import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  IdTokenResult
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { auth, functions, db } from '../config/firebase';

export interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  role?: string;
  loading: boolean;
}

/**
 * Check if the current user has the admin custom claim or an admin profile doc.
 * In Firebase Auth, custom claims are in IdTokenResult.
 * As a fallback/hybrid during initial setup before Cloud Functions deployment,
 * we also verify the `adminUsers/{uid}` collection.
 */
export async function checkAdminPrivileges(user: User): Promise<boolean> {
  try {
    const idTokenResult: IdTokenResult = await user.getIdTokenResult(true);
    if (idTokenResult.claims.admin === true) {
      return true;
    }

    // Check adminUsers document as a fallback verification
    const adminDoc = await getDoc(doc(db, 'adminUsers', user.uid));
    if (adminDoc.exists() && adminDoc.data()?.role === 'admin') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying admin privileges:', error);
    return false;
  }
}

/**
 * Log in admin via email and password, verifying administrative authorization.
 */
export async function loginAdmin(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  const isAdmin = await checkAdminPrivileges(user);
  if (!isAdmin) {
    // Sign out immediately if not authorized as syndicate admin
    await signOut(auth);
    throw new Error('Access denied. This account does not have Syndicate Administrator privileges.');
  }

  return user;
}

/**
 * Log out current admin.
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Provision initial admin via Cloud Function.
 */
export async function claimInitialAdmin(): Promise<string> {
  const createInitialAdminFn = httpsCallable(functions, 'createInitialAdmin');
  const result = await createInitialAdminFn();
  const data = result.data as { message: string };
  return data.message;
}

/**
 * Listen to auth state changes.
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
