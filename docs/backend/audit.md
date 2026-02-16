# Audit Module Documentation

## 1. Overview
The Audit module is the "Black Box" recorder for the application. It provides a historical timeline of important actions, essential for debugging and legal compliance.

-   **Purpose**: Accountability and Tracing.
-   **Key Features**:
    -   **Access Control**: Admins see everything. Users only see their own Cases.
    -   **Generic logging**: Supports any `entityType` (Case, User, Booking).

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `AuditLog` | The Event | `action` (e.g. CASE_CREATED), `entityType`, `entityId`, `details` (JSON) | `User` (Actor) |

## 3. Module Deep Dive (Amateur to Pro)

### `GET /:entityType/:entityId` (The Timeline)
**Goal**: Show history for a specific object (e.g., "Show me history of Case #55").

#### Logic Flow
1.  **Security Gates**:
    -   **Admin**: Pass.
    -   **Case**: Check if user is Client or Lawyer of that case.
    -   **Other**: Block non-admins (Default deny).
2.  **Fetch**: Retrieve logs, include Actor details (`firstName`, `role`).

#### Code Analysis
```javascript
// routes.js Line 31
if (req.user.role !== 'ADMIN' && entityType === 'Case') {
    // Manual authorization check
    const caseData = await prisma.case.findUnique({...});
    // ... verification logic ...
}
```

## 4. API Specification

| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `GET` | `/audit/:entityType/:entityId` | Entity History | Admin / Owner |
| `GET` | `/audit/recent` | Global System Activity | **Admin Only** |

## 5. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Security Logic Hardcoded**: The authorization logic for `Case` is hardcoded inside the route. If we add `Document` audit logs, we have to copy-paste this logic.
    -   *Fix*: Use a Policy Pattern or `casl` library for attribute-based access control (ABAC).

### 🏆 Top 1% Tip
**Immutable Storage**:
Audits in a mutable SQL table can be deleted by a rogue admin (`DELETE FROM AuditLog`).
**Pro Requirement**: Stream audit logs to an **Append-Only Ledger** (e.g., AWS QLDB) or just S3 Object Lock (WORM - Write Once Read Many). This is required for *real* legal compliance.
