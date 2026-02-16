# Admin Module Documentation

## 1. Overview
The Admin module is the control center. It bypasses standard business rules to allow platform management. It is the only module with a dedicated `service.js` and `controller.js` file structure, indicating its complexity.

-   **Purpose**: Platform Management & Oversight.
-   **Key Features**:
    -   **Dashboard**: High-performance stats aggregation.
    -   **User Control**: Ban/Unban, Role modifications.
    -   **Lawyer Verification**: KYC workflow (Approve/Reject).
    -   **Practice Areas**: CMS for categories.
    -   **System Health**: DB and Storage checks.

## 2. Architecture & Data Models

### Key Concepts
-   **Transaction Script**: Uses `prisma.$transaction` heavily to aggregate data from multiple tables in single database round-trips.
-   **Cascading Deletes**: Handles clean-up of related data (e.g., Deleting a User handles Lawyer profile).

## 3. Module Deep Dive (Amateur to Pro)

### `GET /dashboard` (The Performance King)
**Goal**: Load the admin landing page fast.
**Problem**: The dashboard needs counts from 14 different queries (Users, Revenue today/week/month, Recent bookings, etc.).
**Solution**:
The code explicitly uses `prisma.$transaction([...])` to bundle these 14 queries.
-   **Before**: 14 TCP round-trips. Latency = 14 * 50ms = 700ms.
-   **After**: 1 TCP round-trip. Latency = 50ms.
-   *Note*: Postgres executes them sequentially inside the transaction, but we save the network overhead.

### `PUT /lawyers/:id/verify` (KYC Workflow)
**Goal**: Gatekeep the platform.
-   **Action**: `approve` or `reject`.
-   **Logic**:
    -   Updates `verificationStatus`.
    -   Sets `verifiedAt` / `verifiedBy`.
    -   Logs the business event.
    -   *(TODO)*: Send email notification.

### `DELETE /users/:id` (Atomic Destruction)
Deleting a user is dangerous. What if they have Bookings? Payments?
The code uses an interactive transaction:
```javascript
// routes.js Line 267
await prisma.$transaction(async (tx) => {
    // Check constraints
    if (user.role === 'ADMIN') throw ...
    
    // Delete User
    await tx.user.delete({...}); // Cascades to Lawyer
    
    // Log Audit
    logger.logBusiness('USER_DELETED', ...);
});
```
This ensures we don't end up with a "Half-Deleted" state if the Audit Log fails.

## 4. API Specification

| Endpoint | Access | Description |
|:---------|:-------|:------------|
| `/admin/dashboard` | Admin | Aggregate Stats |
| `/admin/users` | Admin | User Management |
| `/admin/lawyers` | Admin | Lawyer Verification |
| `/admin/practice-areas` | Admin | Category CMS |
| `/admin/system/health` | Admin | Infrastructure Check |

## 5. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Health Check Imports**: The `/system/health` route uses dynamic imports `await import(...)` inside the handler (Line 779). This is bad for performance (lazy loading modules on every request).
    -   *Fix*: Import them at the top level or verify why they are lazy loaded.

### ⚠️ Maintainability
-   **Dashboard Query Weight**: The dashboard query counts *everything*. As the DB grows to 1M rows, `COUNT(*)` in Postgres becomes slow.
    -   *Fix*: Use **Materialized Views** or Redis caching for stats. Recompute stats only every 5-10 minutes.

### 🏆 Top 1% Tip
**Admin Action Auditing**:
Every admin action (Banning a user, Verifying a lawyer) MUST be signed.
**Pro**: Implement "Reason Codes" (e.g., "Violation of TOS #4"). Force the Admin to select a reason before banning. This prevents "Rage Banning" and provides legal cover for platform decisions.
