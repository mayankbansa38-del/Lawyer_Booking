# Chat Module Documentation

## 1. Overview
The Chat module provides the HTTP interface for the messaging system. While real-time communication happens via **Socket.io** (separate layer), this module handles history retrieval and persistence.

-   **Purpose**: Record legal consultations and pre-validation questions.
-   **Key Features**:
    -   **Context-Bound**: Chats happen *inside* a `Case` context. You can't just DM anyone.
    -   **Access Control**: Strictly limits access to the Client and Lawyer involved in the Case.
    -   **Persistence**: PostgreSQL storage for permanent record (Compliance).

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Message` | Individual text/file | `content`, `type` (TEXT/IMAGE), `isRead` | `Case`, `User` (Sender) |
| `Case` | Chat Room Context | `clientId`, `lawyerId` | `Message`[] |

## 3. Module Deep Dive (Amateur to Pro)

### `GET /:caseId/messages` (Secure History)
**Goal**: Load previous conversation.

#### Logic Flow
1.  **Security Barrier**: `verifyCaseAccess(caseId, userId)`
    -   Fetches Case.
    -   Checks: `userId === client.id` OR `userId === lawyer.userId`.
    -   If neither -> `403 Forbidden`.
2.  **Fetch**: Paginated list from `Message` table.
3.  **Transform**: Reverse the list so the oldest message is first (natural reading order for paginated chat).

#### Code Analysis
```javascript
// routes.js Line 24
async function verifyCaseAccess(prisma, caseId, userId) {
    const caseData = ...
    if (!isClient && !isLawyer) throw new ForbiddenError(...);
}
```

> [!TIP]
> **Socket.io Hybrid**:
> This REST endpoint is for *loading history*. All live messages should go through the WebSocket connection to appear instantly. REST is the "fallback" or "initial load" mechanism.

### `POST /:caseId/messages` (Persistence)
**Goal**: Save a message to DB (and likely trigger a socket event elsewhere).
-   **Audit**: Sending a message specifically triggers an `AuditLog` entry. This is unusual for chat (high volume), but important for legal context ("I advised the client X on date Y").

## 4. API Specification

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/chat/:caseId/messages` | Load History |
| `POST` | `/chat/:caseId/messages` | Send Message (REST) |
| `PUT` | `/chat/:caseId/messages/read` | Mark all as Read |
| `GET` | `/chat/conversations` | List active chats |

## 5. Frontend Integration
The frontend likely manages state using a store (Redux/Zustand) that merges:
1.  **History**: Fetched from this API on component mount.
2.  **Live**: Appended via Socket.io events (`socket.on('message')`).

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Audit Volume**: Creating an `AuditLog` for *every single chat message* (Line 137) is a performance bomb. If a user says "Hello" "How are you", that's 2 Messages + 2 AuditLogs.
    -   *Fix*: Remove chat from AuditLog. Valid legal proof is the Message table itself, which is immutable enough.

### ⚠️ Maintainability
-   **Mark as Read Logic**: The `PUT .../read` route updates *all* unread messages in the case.
    -   *UX Flaw*: If I open the chat but scroll to the top, I might mark new messages at the bottom as read without seeing them.
    -   *Better*: Pass `lastReadMessageId` to only mark messages up to that point.

### 🏆 Top 1% Tip
**End-to-End Encryption (E2EE)**:
For legal confidentiality, storing messages in plain text (even in DB) is risky.
**Pro Architect**: Client encrypts with Lawyer's Public Key. Server only sees ciphertext. Server stores it. Only Lawyer's Private Key can decrypt it. (Signal Protocol).
