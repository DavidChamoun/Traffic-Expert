import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { ActivityLogEntry, ActivityAction } from '../types';

const COLLECTION_NAME = 'adminActivityLog';

/**
 * Record an administrative activity log entry.
 * Note: Never logs passwords, OTP codes, tokens or secrets.
 */
export async function logAdminActivity(
  action: ActivityAction,
  details: {
    expertLicense?: string;
    expertName?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    const adminId = currentUser ? currentUser.uid : 'unknown';
    const adminEmail = currentUser?.email || 'admin@syndicate.gov.lb';

    await addDoc(collection(db, COLLECTION_NAME), {
      action,
      adminId,
      adminEmail,
      expertLicense: details.expertLicense || null,
      expertName: details.expertName || null,
      reason: details.reason || null,
      metadata: details.metadata || {},
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to write admin activity log:', error);
    // Non-blocking for caller, but logged
  }
}

/**
 * Retrieve recent administrative activity logs.
 */
export async function getRecentActivityLogs(maxItems: number = 25): Promise<ActivityLogEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const ts = data.timestamp as Timestamp | null;
      return {
        id: doc.id,
        action: data.action,
        adminId: data.adminId || 'unknown',
        adminEmail: data.adminEmail || 'admin@syndicate.gov.lb',
        expertLicense: data.expertLicense || undefined,
        expertName: data.expertName || undefined,
        reason: data.reason || undefined,
        timestamp: ts ? ts.toDate() : new Date(),
        metadata: data.metadata || {},
      };
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

/**
 * Retrieve activity logs for a specific expert.
 */
export async function getExpertActivityLogs(licenseNumber: string): Promise<ActivityLogEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('expertLicense', '==', licenseNumber),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const ts = data.timestamp as Timestamp | null;
      return {
        id: doc.id,
        action: data.action,
        adminId: data.adminId,
        adminEmail: data.adminEmail,
        expertLicense: data.expertLicense,
        expertName: data.expertName,
        reason: data.reason,
        timestamp: ts ? ts.toDate() : new Date(),
        metadata: data.metadata,
      };
    });
  } catch (error) {
    console.error('Error fetching expert activity logs:', error);
    return [];
  }
}
