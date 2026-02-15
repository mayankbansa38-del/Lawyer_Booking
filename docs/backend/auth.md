# Auth Module Documentation

## 1. Overview
The Auth module manages user identity, session security, and access control. It implements industry-standard JWT authentication with refresh token rotation and secure password management.

-   **Purpose**: Securely handle user registration, login, and session management.
-   **Key Features**:
    -   Dual-token Architecture (Access + Refresh Tokens).
    -   Token Rotation (Reuse detection).
    -   Role-Based Access Control (RBAC).
    -   Email Verification & Password Reset flows.
-   **Dependencies**: `jsonwebtoken`, `bcrypt` (scrypt/argon2 preferred), `nodemailer`.

## 2. Architecture & Data Models
The module interacts with the core User tables in PostgreSQL (via Prisma).

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `User` | Core identity | `email`, `password` (hashed), `role`, `isEmailVerified` | `Lawyer`, `Client`, `RefreshToken` |
| `RefreshToken` | Session persistence | `token` (hashed), `expiresAt`, `isRevoked`, `familyId` | `User` |
| `EmailVerificationToken` | Account activation | `token`, `expiresAt` | `User` (via email) |
| `PasswordResetToken` | Recovery | `token`, `expiresAt` | `User` (via email) |

## 3. Module Deep Dive (Amateur to Pro)

### `refreshAccessToken(refreshToken)`
**Goal**: Issue a new short-lived Access Token without forcing the user to log in again, while invalidating the old Refresh Token (Rotation).

#### Logic Flow
1.  **Verification**: Decodes the incoming `refreshToken`. If invalid/expired -> `401 Unauthorized`.
2.  **Database Lookup**: Finds the token in DB.
    -   *Security Check*: If the token is already `isRevoked` (used), this indicates **Token Theft**. The system immediately invalidates *all* tokens in that family (logging out the attacker and the victim).
3.  **Rotation**:
    -   Marks current token as `isRevoked`.
    -   Generates a *new* Refresh Token pair.
4.  **Response**: Returns the new pair.

#### Code Analysis
```javascript
// service.js Line 575
await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true, revokedAt: new Date() } // Revoke OLD
});

// service.js Line 584
const tokens = await generateAuthTokens(storedToken.user); // Generate NEW
```

> [!TIP]
> **Why Rotation?**
> If a hacker steals your Refresh Token, they can use it forever. With Rotation, the moment they use it, they get a new one, but the *real* user also tries to use the *old* one later. The system sees the double-use, realizes theft occurred, and nukes the session.

### `registerUser(userData)`
**Goal**: Create a secure user account with verification.

#### Logic Flow
1.  **Check Duplicates**: `findUnique({ where: { email } })`.
2.  **Hash Password**: NEVER store cleartext. uses `bcrypt.hash(password, 12)`.
3.  **Atomic Creation**: Creates User record.
4.  **Async Email**: Triggers `sendVerificationEmail` but *does not await it* to keep the API fast.

## 4. API Specification

| Method | Endpoint | Description | Auth |
|:-------|:---------|:------------|:-----|
| `POST` | `/auth/register` | Create generic account | No |
| `POST` | `/auth/register/lawyer` | Create lawyer account | No |
| `POST` | `/auth/login` | Get Access/Refresh context | No |
| `POST` | `/auth/refresh` | Rotate tokens | No (Token in body) |
| `POST` | `/auth/logout` | Revoke specific token | No |
| `GET` | `/auth/me` | Get current profile | **Yes** |

## 5. Frontend Integration

### Service (`Frontend/src/services/authApi.js`)
The `authApi` handles the specific endpoints, but the *magic* happens in `apiClient.js` interceptors.

```javascript
// services/apiClient.js
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Auto-refresh logic here
            const { accessToken } = await refreshAccessToken();
            // Retry original request
        }
    }
);
```

### State Management (`AuthContext.jsx`)
-   **User State**: Stores the decoded user object.
-   **Persistence**: Checking `localStorage` on mount to re-hydrate the session.

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Race Condition in Rotation**: If a frontend sends 2 requests simultaneously (e.g., `GetUser` and `GetNotifications`) when the token is expired, both will try to refresh. The first succeeds, the second fails (because the token was just revoked by the first), causing a logout.
    -   *Fix*: Implement a "Refresh Promise Singleton" in the frontend `apiClient` to queue concurrent requests.
-   **Email Enumeration**: `forgotPassword` returns "Email sent" even if the user doesn't exist. This is good security. However, `register` throws "Email already exists", allowing attackers to scrape your user base.
    -   *Fix*: Return 200 OK for register too, but send an email saying "You already have an account".

### ⚠️ Maintainability
-   **Hardcoded Roles**: `USER_ROLES` constants are imported, but DB might have different enums. Ensure Prisma Schema matches code constants.
-   **Async Email Handling**: `sendVerificationEmail(...).catch(...)`. If the server crashes before this background promise resolves, the email is lost.
    -   *Fix*: Use a Job Queue (BullMQ/Redis) for reliable email delivery.

### 🏆 Top 1% Tip
**Device Fingerprinting**:
When issuing a Refresh Token, hash the User Agent + IP subnet. On refresh, verify this hash. If a token issued on an iPhone in New York is suddenly used on a Linux Server in Russia, block it immediately.
