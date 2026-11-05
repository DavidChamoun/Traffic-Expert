/**
 * Cloud Functions for Traffic Expert — Syndicate Administration
 *
 * These functions provide secure server-side operations that cannot
 * be safely performed from the client:
 *
 * 1. Admin provisioning (custom claims)
 * 2. Expert suspension/revocation with session invalidation
 * 3. Activity logging for audit trail
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ─────────────────────────────────────────────────────────────────────
// ADMIN PROVISIONING
// ─────────────────────────────────────────────────────────────────────

/**
 * setAdminRole — Callable function to grant admin privileges.
 *
 * Can only be called by an existing admin.
 * Sets the custom claim { admin: true } on the target user.
 *
 * @param data.email - Email of the user to make admin
 */
export const setAdminRole = functions.https.onCall(async (request) => {
  // Verify caller is admin
  if (!request.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can grant admin privileges."
    );
  }

  const email = request.data?.email;
  if (!email || typeof email !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email address is required."
    );
  }

  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });

    // Create admin user profile
    await db.collection("adminUsers").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || email.split("@")[0],
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: request.auth.uid,
    }, { merge: true });

    // Log the action
    await db.collection("adminActivityLog").add({
      action: "admin_granted",
      adminId: request.auth.uid,
      adminEmail: request.auth.token.email || "unknown",
      targetEmail: email,
      targetUid: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: `Admin role granted to ${email}` };
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new functions.https.HttpsError(
        "not-found",
        "No user found with this email. They must create an account first."
      );
    }
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * createInitialAdmin — One-time setup function.
 *
 * Creates the first admin user. This function checks that NO admin
 * users exist yet. Once the first admin is created, this function
 * refuses to run again. Further admins must be created via setAdminRole.
 *
 * @param data.email - Email of the first admin
 */
export const createInitialAdmin = functions.https.onCall(async (request) => {
  // Check if any admin already exists
  const adminSnap = await db.collection("adminUsers").limit(1).get();
  if (!adminSnap.empty) {
    throw new functions.https.HttpsError(
      "already-exists",
      "An admin already exists. Use setAdminRole to add more admins."
    );
  }

  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to become the initial admin."
    );
  }

  const email = request.auth.token.email;
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Your account must have an email address."
    );
  }

  try {
    // Set admin custom claim
    await auth.setCustomUserClaims(request.auth.uid, { admin: true });

    // Create admin profile
    await db.collection("adminUsers").doc(request.auth.uid).set({
      email: email,
      displayName: request.auth.token.name || email.split("@")[0],
      role: "admin",
      isInitialAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: "system",
    });

    // Log the action
    await db.collection("adminActivityLog").add({
      action: "initial_admin_created",
      adminId: request.auth.uid,
      adminEmail: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { isInitialSetup: true },
    });

    return {
      message: `Initial admin created: ${email}. Please sign out and sign back in for the changes to take effect.`,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ─────────────────────────────────────────────────────────────────────
// EXPERT MANAGEMENT — SERVER-SIDE OPERATIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * suspendExpert — Suspend an expert's authorization.
 *
 * Sets authorizationStatus to "suspended" in verifiedExperts.
 * Sets isAvailable to false in the expert's account.
 *
 * @param data.licenseNumber - License number of the expert to suspend
 * @param data.reason - Optional reason for suspension
 */
export const suspendExpert = functions.https.onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can suspend experts."
    );
  }

  const { licenseNumber, reason } = request.data || {};
  if (!licenseNumber) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "License number is required."
    );
  }

  const verifiedRef = db.collection("verifiedExperts").doc(licenseNumber);
  const verifiedSnap = await verifiedRef.get();

  if (!verifiedSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Expert not found."
    );
  }

  const batch = db.batch();

  // Update verifiedExperts
  batch.update(verifiedRef, {
    authorizationStatus: "suspended",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid,
  });

  // Find and update expert account if it exists
  const expertSnap = await db.collection("experts")
    .where("verifiedRef", "==", verifiedRef)
    .limit(1)
    .get();

  if (!expertSnap.empty) {
    batch.update(expertSnap.docs[0].ref, {
      isAvailable: false,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  // Log action
  await db.collection("adminActivityLog").add({
    action: "expert_suspended",
    adminId: request.auth.uid,
    adminEmail: request.auth.token.email || "unknown",
    expertLicense: licenseNumber,
    expertName: verifiedSnap.data()?.fullName || "unknown",
    reason: reason || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { message: `Expert ${licenseNumber} has been suspended.` };
});

/**
 * reactivateExpert — Reactivate a suspended expert.
 *
 * @param data.licenseNumber - License number of the expert to reactivate
 */
export const reactivateExpert = functions.https.onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can reactivate experts."
    );
  }

  const { licenseNumber } = request.data || {};
  if (!licenseNumber) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "License number is required."
    );
  }

  const verifiedRef = db.collection("verifiedExperts").doc(licenseNumber);
  const verifiedSnap = await verifiedRef.get();

  if (!verifiedSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Expert not found.");
  }

  const currentStatus = verifiedSnap.data()?.authorizationStatus;
  if (currentStatus !== "suspended") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Expert is not suspended (current status: ${currentStatus || "authorized"}).`
    );
  }

  await verifiedRef.update({
    authorizationStatus: "authorized",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid,
  });

  await db.collection("adminActivityLog").add({
    action: "expert_reactivated",
    adminId: request.auth.uid,
    adminEmail: request.auth.token.email || "unknown",
    expertLicense: licenseNumber,
    expertName: verifiedSnap.data()?.fullName || "unknown",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { message: `Expert ${licenseNumber} has been reactivated.` };
});

/**
 * revokeExpert — Permanently revoke an expert's authorization.
 *
 * @param data.licenseNumber - License number of the expert to revoke
 * @param data.reason - Reason for revocation
 */
export const revokeExpert = functions.https.onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can revoke expert authorizations."
    );
  }

  const { licenseNumber, reason } = request.data || {};
  if (!licenseNumber) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "License number is required."
    );
  }

  const verifiedRef = db.collection("verifiedExperts").doc(licenseNumber);
  const verifiedSnap = await verifiedRef.get();

  if (!verifiedSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Expert not found.");
  }

  const batch = db.batch();

  batch.update(verifiedRef, {
    authorizationStatus: "revoked",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.uid,
  });

  // Disable expert account
  const expertSnap = await db.collection("experts")
    .where("verifiedRef", "==", verifiedRef)
    .limit(1)
    .get();

  if (!expertSnap.empty) {
    batch.update(expertSnap.docs[0].ref, {
      isAvailable: false,
      isTrackingEnabled: false,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If expert has an authUid, revoke their Firebase Auth refresh tokens
    const expertData = expertSnap.docs[0].data();
    if (expertData.authUid) {
      try {
        await auth.revokeRefreshTokens(expertData.authUid);
      } catch (e) {
        // Non-critical — expert may not have a Firebase Auth account
        console.warn("Could not revoke tokens for", expertData.authUid, e);
      }
    }
  }

  await batch.commit();

  await db.collection("adminActivityLog").add({
    action: "expert_revoked",
    adminId: request.auth.uid,
    adminEmail: request.auth.token.email || "unknown",
    expertLicense: licenseNumber,
    expertName: verifiedSnap.data()?.fullName || "unknown",
    reason: reason || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    message: `Expert ${licenseNumber} authorization has been permanently revoked.`,
  };
});
