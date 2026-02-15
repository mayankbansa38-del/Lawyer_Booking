# Cases Module Documentation

## 1. Overview
The Cases module is the digital file cabinet for legal matters. It manages the lifecycle of a case, from creation (via a Booking) to resolution, including an immutable audit trail.

-   **Purpose**: Centralize case information, status tracking, and history.
-   **Key Features**:
    -   Role-Aware Access (Client vs Lawyer views).
    -   Audit Logging (Who changed what and when).
    -   Status Workflow (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`).
-   **Dependencies**: `Prisma` (Postgres).

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Case` | core entity | `caseNumber`, `status`, `priority` | `Client`, `Lawyer`, `Booking` |
| `AuditLog` | History tracker | `action`, `entityType`, `details`, `userId` | `Case`, `User` |

## 3. Module Deep Dive (Amateur to Pro)

### `POST /api/v1/cases` (Creation Logic)
**Goal**: Create a case context.
-   **Lawyer Flow**: Can create a case for *any* client (if they know the ID).
-   **Client Flow**: Can ONLY create a case *from a completed booking*. This prevents spam/fake cases.

#### Code Analysis
```javascript
// routes.js Line 88
else if (req.user.role === 'USER') {
    if (!bookingId) throw new BadRequestError('bookingId is required');
    
    // Security Check: Does this booking belong to you?
    if (booking.clientId !== req.user.id) throw new BadRequestError('Invalid booking');
    
    // Logic Check: Is it actually over?
    if (booking.status !== 'COMPLETED') throw new BadRequestError('Only after consultation');
}
```

> [!TIP]
> **Audit Logging Pattern**:
> Instead of just `update()`, the module uses a helper `createAuditEntry`. This is crucial for legal software. If a lawyer changes the status to "CLOSED", you need to prove *who* did it and *when* in court.

### `PUT /:id` (State Mutation)
**Goal**: Update case details while recording the change delta.

#### Logic Flow
1.  **Fetch**: Get existing state.
2.  **Compare**: Check `status`, `priority` against new values.
3.  **Delta**: Construct a `changes` object (e.g., `{ status: { from: 'OPEN', to: 'CLOSED' } }`).
4.  **Transaction**: (Implicit via Prisma) Update Case + Create Audit Log.

## 4. API Specification

| Method | Endpoint | Description | Query Params |
|:-------|:---------|:------------|:-------------|
| `POST` | `/cases` | Create | - |
| `GET` | `/cases` | List my cases | `status`, `priority`, `search` |
| `GET` | `/cases/:id` | Detail view | - |
| `PUT` | `/cases/:id` | Update | - |
| `GET` | `/cases/:id/history` | View Audit Log | - |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
The `caseAPI` handles these interactions.

```javascript
// services/api/index.js
async getHistory(caseId) {
    return apiClient.get(`/cases/${caseId}/history`);
}
```

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **No Transaction on Create**: `Case.create` and `AuditLog.create` are separate `await` calls. If the Audit Log fails, the Case exists without a "CREATED" log entry.
    -   *Fix*: Wrap in `prisma.$transaction`.
-   **Hardcoded Roles**: `req.user.role === 'LAWYER'` strings are scattered. Use separate middleware `authorize('LAWYER')` or constants.

### ⚠️ Maintainability
-   **Search Performance**: `OR: [{ title: contains }, { description: contains }]`. Searching in `description` (TEXT field) with `contains` (LIKE %...%) prevents index usage.
    -   *Fix*: Remove description from search or use Full Text Search (TsVector).

### 🏆 Top 1% Tip
**Event Sourcing**:
For a legal system, instead of storing just the "Current State" and a separate "Audit Log", consider **Event Sourcing**. Store *events* (`CaseCreated`, `PriorityChanged`) and *derive* the current state. This guarantees 100% audit accuracy because the audit log *is* the database.
