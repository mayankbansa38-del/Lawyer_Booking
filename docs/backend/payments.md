# Payments Module Documentation

## 1. Overview
The Payments module handles financial transactions using **Razorpay**. It manages Orders, Verifications, and Refund lifecycles.

-   **Purpose**: Securely process consultation fees.
-   **Key Features**:
    -   Order Creation (Pre-payment).
    -   Signature Verification (Post-payment security).
    -   Webhooks (Async status updates).
    -   Refunds (Admin initiated).
-   **Dependencies**: `razorpay` SDK.

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Payment` | Transaction Record | `status`, `gatewayOrderId`, `gatewayPaymentId` | `Booking` |
| `Booking` | Product | `amount`, `paymentStatus` | `Payment` |

## 3. Module Deep Dive (Amateur to Pro)

### `POST /webhook` (The Brain)
**Goal**: Handle async updates from Razorpay (e.g., Payment Succeeded, Failed, Refunded).
-   **Security**: Verifies `X-Razorpay-Signature` using HMAC-SHA256 to ensure the request actually came from Razorpay.

#### Logic Flow
1.  **Signature Check**: `createHmac(rawBody, secret) === signature`.
2.  **Event Switch**:
    -   `payment.captured`: Mark Payment `COMPLETED`, Booking `CONFIRMED`.
    -   `payment.failed`: Mark Payment `FAILED`.
    -   `refund.processed`: Mark Payment `REFUNDED`.

#### Code Analysis
```javascript
// routes.js Line 190
// Timing-safe comparison prevents Side-Channel Attacks
if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    logger.logSecurity('INVALID_WEBHOOK_SIGNATURE');
    return res.status(400);
}
```

> [!TIP]
> **Idempotency**:
> Webhooks can be delivered multiple times. The logic checks `if (payment.status === 'COMPLETED') return;` to prevent processing the same event twice. **Excellent practice.**

### `POST /create-order`
**Goal**: Initialize a transaction.
-   **Validation**: Checks if booking is already paid.
-   **Currency**: Ensures atomic integer math (Razorpay expects `paise`, so `amount * 100`).

## 4. API Specification

| Method | Endpoint | Description | Access |
|:-------|:---------|:------------|:-------|
| `POST` | `/create-order` | Init Payment | Client |
| `POST` | `/verify` | Confirm Success (Frontend Callback) | Client |
| `POST` | `/webhook` | Async Updates | **Public** (Signed) |
| `POST` | `/:id/refund` | Process Refund | **Admin** |

## 5. Frontend Integration
The frontend uses the Razorpay standard checkout script.
1. Call `/create-order` -> Get `order_id`.
2. Open Razorpay Modal -> User pays.
3. On Success -> Call `/verify` with `signature`.

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Raw Body Middleware**: For webhooks to work, `req.rawBody` must be preserved. Ensure `express.json()` middleware is configured globally to `verify: (req, res, buf) => req.rawBody = buf`. If missing, signature verification **will fail**.

### ⚠️ Maintainability
-   **Hardcoded Refund Logic**: `refundAmount >= payment.amount`.
    -   *Edge Case*: Handling Partial Refunds + Full Refunds mixed together. The state logic is simple but might get brittle if we introduce "Credits" or "Coupons".

### 🏆 Top 1% Tip
**Reconciliation Job**:
Webhooks fail. The user's internet dies during `/verify`. You need a **Nightly Cron Job** that fetches all `PENDING` payments from your DB, calls Razorpay API `payments.fetch(orderId)`, and syncs the status. **Never rely 100% on real-time sync for money.**
