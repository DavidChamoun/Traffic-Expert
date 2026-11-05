# Traffic Expert — Lebanese Syndicate Administration & Mobile Application

The **Traffic Expert** platform connects drivers involved in traffic accidents in Lebanon with officially certified, nearby traffic accident experts authorized by the **Syndicate of Traffic Accident Experts in Lebanon** (*نقابة خبراء السير في لبنان*).

This repository contains both:
1. **The Mobile Application (React Native 0.82.1)** for Drivers and Certified Experts.
2. **The Syndicate Administration Web Panel (`admin-panel/`)** for Syndicate officials to manage officially authorized experts, revoke or suspend licenses, monitor activations, and maintain audit logs.
3. **Cloud Functions & Security Rules (`functions/`, `firestore.rules`)** enforcing backend authorization and preventing unauthorized operations.

---

## 🏛️ System Architecture

```
TrafficExpert/
├── admin-panel/              # Web Application: Syndicate Administration Panel (React 19, TypeScript, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/       # StatusBadge, ConfirmationModal, StatCard, Sidebar, Navbar, ProtectedRoute
│   │   ├── config/           # Firebase Web SDK initialization
│   │   ├── context/          # AuthContext (role verification & custom claim handling)
│   │   ├── layouts/          # AdminLayout (responsive dashboard shell)
│   │   ├── pages/            # Dashboard, ExpertsList, AddExpert, EditExpert, ExpertDetails, ActivityLog, Login
│   │   ├── services/         # expertService, authService, activityService
│   │   └── types/            # TypeScript domain models
├── functions/                # Firebase Cloud Functions (Node 20, TypeScript, Firebase Admin SDK)
│   └── src/index.ts          # Server-side admin provisioning, suspension, reactivation, revocation
├── firestore.rules           # Strict security rules (admin-only writes to verifiedExperts, expert self-update constraints)
├── firestore.indexes.json    # Firestore composite query index configurations
├── firebase.json             # Unified Firebase deployment configuration
├── src/                      # Mobile Application (React Native 0.82.1, TypeScript)
│   ├── navigation/           # AppNavigator (stack navigation)
│   ├── screens/              # DriverMain, MapPage, ExpertsList, ExpertRegister, ExpertLogin, ExpertProfile, OTPAuth
│   ├── session/              # Expert session persistence
│   └── utils/                # Location, permissions, Firestore helpers
```

---

## 🔒 Security & Data Model Integration

### Firestore Collections

#### 1. `verifiedExperts/{licenseNumber}`
Contains expert credentials officially authorized by the syndicate. The document ID is the unique syndicate license number.
- `fullName` (string): Official name registered with the syndicate.
- `phoneNumber` (string): Official mobile number used for phone OTP verification.
- `email` (string, optional): Official email.
- `address` (string, optional): Syndicate district or office location.
- `isRegistered` (boolean): `true` when the expert has completed mobile account setup; `false` when newly authorized.
- `authorizationStatus` (string): `'authorized'` | `'suspended'` | `'revoked'`.
- `createdBy` (string): Admin UID who authorized the record.
- `createdAt` / `updatedAt` (Timestamp): Server timestamps.

#### 2. `experts/{expertId}`
Contains expert application accounts created during mobile app registration.
- `verifiedRef` (DocumentReference): Pointer to `verifiedExperts/{licenseNumber}`.
- `isAvailable` (boolean): Real-time availability toggle for driver emergency dispatch.
- `location` (GeoPoint): Real-time coordinates.
- `isTrackingEnabled` (boolean): Background tracking status.
- `authUid` (string): Firebase Authentication UID verified via phone OTP.
- `createdAt` / `lastUpdated` (Timestamp): Operational timestamps.

> [!IMPORTANT]
> **No Plaintext Passwords in Admin Panel**: The Syndicate Administration Panel never retrieves, modifies, or displays expert passwords. Passwords are treated as confidential operational credentials managed via phone OTP verification.

---

## ⚡ Syndicate Administration Panel Features

1. **Dashboard KPI Overview**:
   - Total Authorized Experts in Registry.
   - Active & Authorized Experts eligible for dispatch.
   - Suspended Experts (temporarily barred).
   - Revoked Experts (permanently barred).
   - Accounts Activated on Mobile vs Pending Initial Registration.
   - Live recently authorized experts table & administrative activity feed.

2. **Expert Management**:
   - **Multi-Field Search**: Real-time filtering by Full Name, License Number, Phone Number, and Email.
   - **Status Filtering**: Filter by Syndicate Status (All, Authorized, Suspended, Revoked) and Mobile Registration Status (Registered, Pending).
   - **Sorting & Pagination**: Clean tabular interface with pagination.
   - **Detail Profile View**: Complete syndicate records, mobile account sync state, location coordinates, and audit history.
   - **Audit-Logged Actions**: Confirmation modals with mandatory justification for suspensions, revocations, and reactivations.

3. **Add New Traffic Expert Workflow**:
   - Validates license number uniqueness in `verifiedExperts`.
   - Validates Lebanese phone format (`+961 XX XXXXXX`).
   - Automatically initializes `authorizationStatus: 'authorized'` and `isRegistered: false`.
   - Does **not** arbitrarily create an expert application account (preserving mobile separation).
   - Logs the action in `adminActivityLog`.

4. **Edit Official Expert Information**:
   - Full Name, Phone Number, Email, and District Address editing.
   - License number is strictly immutable with in-app explanation to preserve `verifiedRef` foreign key integrity across the mobile database.

5. **Syndicate Activity & Audit Log**:
   - Immutable audit trail recording every creation, modification, suspension, reactivation, and revocation.
   - Contains administrator email/UID, target license, action type, and justification timestamp.

---

## 📱 Mobile App Compatibility & Enforcement

The React Native application has been updated to respect syndicate authorization:
- **`ExpertsList.tsx`**: Automatically filters out any expert whose `authorizationStatus` is `'suspended'` or `'revoked'`.
- **`MapPage.tsx`**: Real-time map snapshot filters out suspended/revoked experts, ensuring drivers only see authorized personnel.
- **`ExpertRegister.tsx`**: Rejects registration attempts if a license has been suspended or revoked.
- **`ExpertLogin.tsx`**: Denies login if the syndicate has suspended or revoked the expert's credentials.
- **`ForgotPasswordStep1.tsx`**: Blocks password recovery for suspended/revoked licenses.
- **Backward Compatibility**: Any legacy records lacking the new `authorizationStatus` field default automatically to `'authorized'`.

---

## 🚀 Getting Started & Development

### 1. Syndicate Administration Panel (`admin-panel/`)

```sh
cd admin-panel
npm install
npm run dev
```

The panel runs by default at `http://localhost:5173`.

#### Environment Configuration (`admin-panel/.env`):
Create `.env` using `.env.example` as a template:
```ini
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=trafficexpert-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trafficexpert-app
VITE_FIREBASE_STORAGE_BUCKET=trafficexpert-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=961513525788
VITE_FIREBASE_APP_ID=your_firebase_web_app_id
```

### 2. Cloud Functions (`functions/`)

```sh
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 3. Deploying Firestore Security Rules

```sh
firebase deploy --only firestore:rules
```

### 4. Running the React Native Mobile App

```sh
# Start Metro bundler
npm start

# Run Android
npm run android

# Run iOS
npm run ios
```

---

## 🛡️ Administrative Bootstrapping

To create the initial Syndicate Administrator:
1. In the **Firebase Console**, create an administrator user with their syndicate email under **Authentication > Users**.
2. Create a document in Firestore collection `adminUsers/{uid}` with:
   ```json
   {
     "email": "admin@syndicate.gov.lb",
     "role": "admin",
     "createdAt": "SERVER_TIMESTAMP"
   }
   ```
   *Or* call the Cloud Function `createInitialAdmin` from the login screen helper.
3. The custom security rule and frontend AuthGuard verify that only users with confirmed admin privileges can read audit logs or write to `verifiedExperts`.
