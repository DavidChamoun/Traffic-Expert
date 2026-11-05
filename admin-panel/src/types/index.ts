/**
 * Shared type definitions for the Traffic Expert admin panel.
 */

// ── Authorization status ────────────────────────────────────────────
export type AuthorizationStatus = 'authorized' | 'suspended' | 'revoked';

// ── verifiedExperts document ────────────────────────────────────────
export interface VerifiedExpert {
  /** Firestore document ID = license number */
  licenseNumber: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  isRegistered: boolean;
  /** Added by admin panel; existing docs without this are treated as "authorized" */
  authorizationStatus?: AuthorizationStatus;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

// ── experts document ────────────────────────────────────────────────
export interface ExpertAccount {
  id: string;
  verifiedRef: string; // path like "verifiedExperts/123"
  isAvailable: boolean;
  isTrackingEnabled?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: Date;
  lastUpdated?: Date;
  authUid?: string;
  /** Password field exists but must NEVER be read or displayed */
}

// ── Combined view for admin panel ───────────────────────────────────
export interface ExpertWithAccount extends VerifiedExpert {
  account?: ExpertAccount;
}

// ── Activity log ────────────────────────────────────────────────────
export type ActivityAction =
  | 'expert_created'
  | 'expert_updated'
  | 'expert_suspended'
  | 'expert_reactivated'
  | 'expert_revoked'
  | 'admin_granted'
  | 'initial_admin_created';

export interface ActivityLogEntry {
  id: string;
  action: ActivityAction;
  adminId: string;
  adminEmail: string;
  expertLicense?: string;
  expertName?: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ── Dashboard stats ─────────────────────────────────────────────────
export interface DashboardStats {
  totalExperts: number;
  authorizedExperts: number;
  suspendedExperts: number;
  revokedExperts: number;
  registeredExperts: number;
  unregisteredExperts: number;
  recentExperts: VerifiedExpert[];
  recentActivity: ActivityLogEntry[];
}

// ── Filter options ──────────────────────────────────────────────────
export interface ExpertFilters {
  search: string;
  authorizationStatus: AuthorizationStatus | 'all';
  registrationStatus: 'all' | 'registered' | 'not_registered';
}
