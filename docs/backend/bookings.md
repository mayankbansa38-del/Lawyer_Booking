# Bookings Module Documentation

## 1. Overview
The Bookings module orchestrates the core transaction: a Client scheduling time with a Lawyer. It handles the entire lifecycle from Request -> Confirmation -> Payment -> Completion.

-   **Purpose**: Manage appointment lifecycle and state transitions.
-   **Key Features**:
    -   Conflict Detection (Double-booking prevention).
    -   Email Notifications (Confirmation, Cancellation).
    -   State Machine (`PENDING` -> `CONFIRMED` -> `COMPLETED`).
-   **Dependencies**: `Prisma`, `Nodemailer` (Emails).

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Booking` | The Transaction | `status`, `scheduledDate`, `amount`, `meetingLink` | `Client`, `Lawyer`, `Payment` |
| `Payment` | Financial Record | `amount`, `status`, `razorpayOrderId` | `Booking` |

### State Machine
1.  **PENDING**: Created by Client. Slots reserved.
2.  **CONFIRMED**: Accepted by Lawyer (or Auto-confirmed).
3.  **CANCELLED**: Terminated by either party (before time).
4.  **COMPLETED**: Successfully finished (Lawyer marks it).

## 3. Module Deep Dive (Amateur to Pro)

### `POST /api/v1/bookings` (Create Booking)
**Goal**: Atomic creation of a booking while ensuring no double-booking occurs.

#### Logic Flow
1.  **Availability Check**: Verifies lawyer is `VERIFIED` and `isAvailable`.
2.  **Lawyer Conflict Check**: Finds any *other* booking for this lawyer at `Date + Time`.
3.  **User Conflict Check**: Ensures the *Client* isn't double-booked (attending two meetings at once).
4.  **Creation**: Inserts the record with status `PENDING`.
5.  **Notification**: Triggers Email + In-App Notification (async).

#### Code Analysis
```javascript
// routes.js Line 52
const existingBooking = await prisma.booking.findFirst({
    where: {
        lawyerId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: { in: ['PENDING', 'CONFIRMED'] } // Ignore Cancelled
    }
});
```

> [!TIP]
> **Race Conditions**:
> This "Read-then-Write" check is vulnerable. If two users click "Book" at the exact same millisecond, both pass the `findFirst` check (returning null), and both `create` a booking.
> **Fix**: Application-level locking (Redis Lock) or Database uniqueness constraint (`UNIQUE(lawyerId, scheduledDate, scheduledTime)`).

### `PUT /:id/confirm` (State Transition)
**Goal**: Move booking to `CONFIRMED` and generate meeting link.
-   **Access Control**: Only the Lawyer (owner) can confirm.
-   **Validation**: Must be in `PENDING` state.

## 4. API Specification

| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/bookings` | Create new request | Client |
| `GET` | `/bookings` | List my bookings | Client |
| `GET` | `/bookings/lawyer` | List my appointments | Lawyer |
| `PUT` | `/bookings/:id/confirm` | Accept request | Lawyer |
| `PUT` | `/bookings/:id/cancel` | Cancel | Both |
| `PUT` | `/bookings/:id/complete` | Mark finished | Lawyer |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
The `appointmentAPI` handles these calls.

```javascript
// services/api/index.js
async create(data) {
    // data = { lawyerId, date, time, duration... }
    return apiClient.post('/bookings', data);
}
```

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Double Booking Race Condition**: As mentioned above, rely on DB constraints, not just code checks.
-   **TZ Issues**: `scheduledDate` is stored as a `Date` object (timestamp), but `scheduledTime` is likely a string ("10:00").
    -   *Risk*: If the server is UTC and user IS IST, "2024-02-15 00:00:00" might be "2024-02-14 18:30:00".
    -   *Fix*: Store everything as UTC ISO timestamps or `timestamptz`.

### ⚠️ Maintainability
-   **Email Failure = Silent Failure**: The email promise has a `.catch()` that logs error but doesn't alert the user. If email service is down, users won't know their booking is confirmed.
-   **Fat Controllers**: The route handler contains: Validation + DB Logic + Email Logic + Notification Logic.
    -   *Fix*: Extract `bookAppointment`, `cancelAppointment` into `service.js`. Keep routes clean.

### 🏆 Top 1% Tip
**Calendar Integration**:
Don't just email. Generate an **ICS file** (iCal) attachment so users can add it to Google/Outlook Calendar with one click. Even better, use Google Calendar API to auto-invite them.
