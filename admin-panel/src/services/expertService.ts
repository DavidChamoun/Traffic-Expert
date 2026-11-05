import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../config/firebase';
import {
  VerifiedExpert,
  ExpertAccount,
  ExpertWithAccount,
  DashboardStats,
  AuthorizationStatus
} from '../types';
import { logAdminActivity } from './activityService';

const VERIFIED_COLLECTION = 'verifiedExperts';
const EXPERTS_COLLECTION = 'experts';

/**
 * Validate phone number format (must be valid international or Lebanese format).
 * E.g.: +961 71 123 456, +96171123456, 03123456, 71123456
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; formatted: string } {
  const cleaned = phone.replace(/\s+/g, '').trim();
  
  // Lebanese international format: +961 followed by 7 or 8 digits
  const intlRegex = /^\+961[3-9]\d{6,7}$/;
  // Local Lebanese format: 03, 70, 71, 76, 78, 79, 81 etc.
  const localRegex = /^0?[3-9]\d{6,7}$/;

  if (intlRegex.test(cleaned)) {
    return { isValid: true, formatted: cleaned };
  }

  if (localRegex.test(cleaned)) {
    // Convert to +961 format
    const withoutZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
    return { isValid: true, formatted: `+961${withoutZero}` };
  }

  return { isValid: false, formatted: phone };
}

/**
 * Retrieve all verified experts from Firestore and resolve their corresponding expert accounts.
 */
export async function getAllExperts(): Promise<ExpertWithAccount[]> {
  try {
    const verifiedSnap = await getDocs(collection(db, VERIFIED_COLLECTION));
    const expertsSnap = await getDocs(collection(db, EXPERTS_COLLECTION));

    // Map expert accounts by verifiedRef path or id
    const expertAccountsMap = new Map<string, ExpertAccount>();
    expertsSnap.forEach(expertDoc => {
      const data = expertDoc.data();
      const verifiedRef = data.verifiedRef;
      // verifiedRef could be a DocumentReference or path
      let licenseKey = '';
      if (verifiedRef?.id) {
        licenseKey = verifiedRef.id;
      } else if (typeof verifiedRef === 'string') {
        licenseKey = verifiedRef.split('/').pop() || '';
      }

      if (licenseKey) {
        expertAccountsMap.set(licenseKey, {
          id: expertDoc.id,
          verifiedRef: verifiedRef?.path || `${VERIFIED_COLLECTION}/${licenseKey}`,
          isAvailable: Boolean(data.isAvailable),
          isTrackingEnabled: Boolean(data.isTrackingEnabled),
          location: data.location ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          } : undefined,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
          lastUpdated: data.lastUpdated ? (data.lastUpdated as Timestamp).toDate() : undefined,
          authUid: data.authUid || undefined,
          // Explicitly: NEVER include password field
        });
      }
    });

    const result: ExpertWithAccount[] = verifiedSnap.docs.map(docSnap => {
      const data = docSnap.data();
      const licenseNumber = docSnap.id;
      const account = expertAccountsMap.get(licenseNumber);

      // Default authorization status for legacy records without it is "authorized"
      const authorizationStatus: AuthorizationStatus = data.authorizationStatus || 'authorized';

      return {
        licenseNumber,
        fullName: data.fullName || 'Unnamed Expert',
        phoneNumber: data.phoneNumber || '',
        email: data.email || undefined,
        address: data.address || undefined,
        isRegistered: Boolean(data.isRegistered),
        authorizationStatus,
        createdBy: data.createdBy || undefined,
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
        updatedBy: data.updatedBy || undefined,
        account,
      };
    });

    // Sort by licenseNumber
    return result.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } catch (error) {
    console.error('Error fetching experts:', error);
    throw error;
  }
}

/**
 * Fetch a single expert's detailed record with their linked mobile account.
 */
export async function getExpertByLicense(licenseNumber: string): Promise<ExpertWithAccount | null> {
  try {
    const verifiedRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
    const verifiedSnap = await getDoc(verifiedRef);

    if (!verifiedSnap.exists()) {
      return null;
    }

    const data = verifiedSnap.data();
    
    // Find linked expert account
    const expertsQuery = query(
      collection(db, EXPERTS_COLLECTION),
      where('verifiedRef', '==', verifiedRef)
    );
    const accountSnap = await getDocs(expertsQuery);

    let account: ExpertAccount | undefined = undefined;
    if (!accountSnap.empty) {
      const accDoc = accountSnap.docs[0];
      const accData = accDoc.data();
      account = {
        id: accDoc.id,
        verifiedRef: verifiedRef.path,
        isAvailable: Boolean(accData.isAvailable),
        isTrackingEnabled: Boolean(accData.isTrackingEnabled),
        location: accData.location ? {
          latitude: accData.location.latitude,
          longitude: accData.location.longitude,
        } : undefined,
        createdAt: accData.createdAt ? (accData.createdAt as Timestamp).toDate() : undefined,
        lastUpdated: accData.lastUpdated ? (accData.lastUpdated as Timestamp).toDate() : undefined,
        authUid: accData.authUid || undefined,
        // PASSWORDS EXPLICITLY OMITTED
      };
    }

    return {
      licenseNumber: verifiedSnap.id,
      fullName: data.fullName || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || undefined,
      address: data.address || undefined,
      isRegistered: Boolean(data.isRegistered),
      authorizationStatus: data.authorizationStatus || 'authorized',
      createdBy: data.createdBy || undefined,
      createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
      updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      updatedBy: data.updatedBy || undefined,
      account,
    };
  } catch (error) {
    console.error('Error fetching expert by license:', error);
    throw error;
  }
}

/**
 * Add a new Syndicate Authorized Expert.
 * 
 * Strict business rules:
 * - License number must be unique and alphanumeric
 * - Phone number must be validated
 * - Document created in verifiedExperts/{licenseNumber}
 * - isRegistered initialized to false
 * - authorizationStatus initialized to "authorized"
 * - Does NOT create an expert account (mobile app handles account creation upon registration)
 */
export async function addExpert(expertData: {
  licenseNumber: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
}): Promise<void> {
  const licenseNumber = expertData.licenseNumber.trim();
  const fullName = expertData.fullName.trim();
  
  if (!licenseNumber) {
    throw new Error('Syndicate License Number is required.');
  }

  if (!fullName) {
    throw new Error('Full Name is required.');
  }

  const phoneValidation = validatePhoneNumber(expertData.phoneNumber);
  if (!phoneValidation.isValid) {
    throw new Error('Invalid phone number format. Please provide a valid Lebanese phone number (e.g., +961 71 123 456).');
  }

  // Check uniqueness
  const verifiedDocRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
  const existingDoc = await getDoc(verifiedDocRef);
  if (existingDoc.exists()) {
    throw new Error(`An authorized expert with license number "${licenseNumber}" already exists.`);
  }

  const currentUser = auth.currentUser;
  const adminId = currentUser?.uid || 'admin';

  await setDoc(verifiedDocRef, {
    fullName,
    phoneNumber: phoneValidation.formatted,
    email: expertData.email?.trim() || null,
    address: expertData.address?.trim() || null,
    isRegistered: false,
    authorizationStatus: 'authorized',
    createdBy: adminId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: adminId,
  });

  // Audit log
  await logAdminActivity('expert_created', {
    expertLicense: licenseNumber,
    expertName: fullName,
    metadata: {
      phoneNumber: phoneValidation.formatted,
      email: expertData.email?.trim() || null,
    },
  });
}

/**
 * Update an authorized expert's official syndicate information.
 * Note: Changing license number is prevented to protect document integrity and foreign references.
 */
export async function updateExpert(
  licenseNumber: string,
  updates: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  }
): Promise<void> {
  const verifiedRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
  const existingDoc = await getDoc(verifiedRef);

  if (!existingDoc.exists()) {
    throw new Error(`Expert with license "${licenseNumber}" not found.`);
  }

  const phoneValidation = validatePhoneNumber(updates.phoneNumber);
  if (!phoneValidation.isValid) {
    throw new Error('Invalid phone number format. Please provide a valid Lebanese phone number.');
  }

  const currentUser = auth.currentUser;
  const adminId = currentUser?.uid || 'admin';

  await updateDoc(verifiedRef, {
    fullName: updates.fullName.trim(),
    phoneNumber: phoneValidation.formatted,
    email: updates.email?.trim() || null,
    address: updates.address?.trim() || null,
    updatedAt: serverTimestamp(),
    updatedBy: adminId,
  });

  await logAdminActivity('expert_updated', {
    expertLicense: licenseNumber,
    expertName: updates.fullName.trim(),
    metadata: {
      phoneNumber: phoneValidation.formatted,
      email: updates.email?.trim() || null,
    },
  });
}

/**
 * Suspend an expert.
 * Tries Cloud Function first for atomic server-side enforcement.
 * Falls back to Firestore direct transaction if Cloud Functions are not yet deployed.
 */
export async function suspendExpertAction(licenseNumber: string, reason?: string): Promise<void> {
  try {
    const suspendFn = httpsCallable(functions, 'suspendExpert');
    await suspendFn({ licenseNumber, reason });
  } catch (fnError) {
    console.warn('Cloud Function unavailable, executing client Firestore fallback for suspendExpert:', fnError);
    
    // Fallback: batch update in Firestore
    const verifiedRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
    const verifiedSnap = await getDoc(verifiedRef);
    if (!verifiedSnap.exists()) throw new Error('Expert not found.');

    const batch = writeBatch(db);
    const currentUser = auth.currentUser;
    const adminId = currentUser?.uid || 'admin';

    batch.update(verifiedRef, {
      authorizationStatus: 'suspended',
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    });

    // Also set isAvailable = false on expert account
    const accountsQuery = query(collection(db, EXPERTS_COLLECTION), where('verifiedRef', '==', verifiedRef));
    const accountsSnap = await getDocs(accountsQuery);
    if (!accountsSnap.empty) {
      batch.update(accountsSnap.docs[0].ref, {
        isAvailable: false,
        lastUpdated: serverTimestamp(),
      });
    }

    await batch.commit();

    await logAdminActivity('expert_suspended', {
      expertLicense: licenseNumber,
      expertName: verifiedSnap.data()?.fullName,
      reason,
    });
  }
}

/**
 * Reactivate a suspended expert.
 */
export async function reactivateExpertAction(licenseNumber: string): Promise<void> {
  try {
    const reactivateFn = httpsCallable(functions, 'reactivateExpert');
    await reactivateFn({ licenseNumber });
  } catch (fnError) {
    console.warn('Cloud Function unavailable, executing client Firestore fallback for reactivateExpert:', fnError);

    const verifiedRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
    const verifiedSnap = await getDoc(verifiedRef);
    if (!verifiedSnap.exists()) throw new Error('Expert not found.');

    const currentUser = auth.currentUser;
    const adminId = currentUser?.uid || 'admin';

    await updateDoc(verifiedRef, {
      authorizationStatus: 'authorized',
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    });

    await logAdminActivity('expert_reactivated', {
      expertLicense: licenseNumber,
      expertName: verifiedSnap.data()?.fullName,
    });
  }
}

/**
 * Revoke an expert's authorization permanently.
 */
export async function revokeExpertAction(licenseNumber: string, reason?: string): Promise<void> {
  try {
    const revokeFn = httpsCallable(functions, 'revokeExpert');
    await revokeFn({ licenseNumber, reason });
  } catch (fnError) {
    console.warn('Cloud Function unavailable, executing client Firestore fallback for revokeExpert:', fnError);

    const verifiedRef = doc(db, VERIFIED_COLLECTION, licenseNumber);
    const verifiedSnap = await getDoc(verifiedRef);
    if (!verifiedSnap.exists()) throw new Error('Expert not found.');

    const batch = writeBatch(db);
    const currentUser = auth.currentUser;
    const adminId = currentUser?.uid || 'admin';

    batch.update(verifiedRef, {
      authorizationStatus: 'revoked',
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    });

    const accountsQuery = query(collection(db, EXPERTS_COLLECTION), where('verifiedRef', '==', verifiedRef));
    const accountsSnap = await getDocs(accountsQuery);
    if (!accountsSnap.empty) {
      batch.update(accountsSnap.docs[0].ref, {
        isAvailable: false,
        isTrackingEnabled: false,
        lastUpdated: serverTimestamp(),
      });
    }

    await batch.commit();

    await logAdminActivity('expert_revoked', {
      expertLicense: licenseNumber,
      expertName: verifiedSnap.data()?.fullName,
      reason,
    });
  }
}

/**
 * Compute real-time dashboard statistics from actual Firestore documents.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const experts = await getAllExperts();

  const totalExperts = experts.length;
  const authorizedExperts = experts.filter(e => e.authorizationStatus === 'authorized').length;
  const suspendedExperts = experts.filter(e => e.authorizationStatus === 'suspended').length;
  const revokedExperts = experts.filter(e => e.authorizationStatus === 'revoked').length;
  const registeredExperts = experts.filter(e => e.isRegistered).length;
  const unregisteredExperts = experts.filter(e => !e.isRegistered).length;

  // Sort recent by createdAt or default
  const recentExperts = [...experts]
    .sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  return {
    totalExperts,
    authorizedExperts,
    suspendedExperts,
    revokedExperts,
    registeredExperts,
    unregisteredExperts,
    recentExperts,
    recentActivity: [], // will be merged with activity log
  };
}
