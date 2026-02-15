# Notifications Module Documentation

## 1. Overview
The Notifications module handles user alerts and in-app messaging. It serves as a central hub for informing users about bookings, payments, and system events.

-   **Purpose**: Async user communication.
-   **Key Features**:
    -   **Polymorphic Metadata**: Can link to any entity (`bookingId`, `caseId`, etc.) via JSON metadata.
    -   **Expiration**: Auto-filtering of stale notifications.
    -   **Utility Export**: Exports `createNotification` for use by other modules (Booking, Payments).

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Notification` | The alert | `type` (INFO, SUCCESS, WARNING), `message`, `isRead`, `expiresAt` | `User` |

## 3. Module Deep Dive (Amateur to Pro)

### `GET /` (The Inbox)
**Goal**: Fetch active notifications for the user.

#### Logic Flow
1.  **Filter**: `userId === req.user.id`.
2.  **Expiration Check**:
    ```javascript
    OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } } // Future date
    ]
    ```
3.  **Pagination**: Standard `skip`/`take`.

### `createNotification` (Internal Utility)
This function is key. It's not an API route, but an exported function used by *other* route files.

```javascript
// routes.js Line 221
export async function createNotification({ userId, type, title... }) {
    return prisma.notification.create({ ... });
}
```
**Usage**:
-   Used in `bookings/routes.js` when Booking is confirmed.
-   Used in `payments/routes.js` when Payment fails.

## 4. API Specification

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/notifications` | List Notifications |
| `GET` | `/notifications/unread-count` | Badge number |
| `PUT` | `/notifications/:id/read` | Mark one read |
| `PUT` | `/notifications/read-all` | Mark all read |
| `DELETE` | `/notifications` | Clear read history |

## 5. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Missing Real-time Trigger**: This module only saves to DB. The frontend has to *poll* (`GET /`) to see new notifications.
    -   *Fix*: Integrate **Socket.io** or **Server-Sent Events (SSE)** inside `createNotification`.
    ```javascript
    export async function createNotification(...) {
        const notif = await prisma.create(...);
        io.to(userId).emit('notification', notif); // Push!
        return notif;
    }
    ```

### 🏆 Top 1% Tip
**Notification Preferences**:
Users hate spam. Add a `NotificationPreferences` table linked to User.
-   `email_booking_updates`: true/false
-   `push_marketing`: true/false
Check these bits inside `createNotification` *before* creating the record or sending the push.
