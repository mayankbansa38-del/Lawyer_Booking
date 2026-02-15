# Users Module Documentation

## 1. Overview
The Users module handles profile management, role-based data retrieval, and the "Saved Lawyers" (Favorites) functionality. It serves as the central identity hub for both Clients and Lawyers.

-   **Purpose**: Manage user profiles and relationships (e.g., favorites).
-   **Key Features**:
    -   Profile Management (Update Name, Phone).
    -   Admin User Management (List/View all users).
    -   "Saved Lawyers" (Bookmarking system).
-   **Dependencies**: `Prisma` (Postgres).

## 2. Architecture & Data Models
The module operates primarily on the `User` table but links heavily to `Lawyer` and `SavedLawyer`.

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `User` | Core Profile | `firstName`, `lastName`, `phone`, `avatar` | `Lawyer?`, `SavedLawyer[]` |
| `SavedLawyer` | Favorites (Many-to-Many) | `userId`, `lawyerId`, `createdAt` | `User`, `Lawyer` |

> [!NOTE]
> The `SavedLawyer` model acts as a pivot table for the Many-to-Many relationship between Users (Clients) and Lawyers.

## 3. Module Deep Dive (Amateur to Pro)

### `GET /saved-lawyers` (Favorites Logic)
**Goal**: Retrieve a list of lawyers the user has bookmarked, including their primary metadata (Rating, Location, Specialization).

#### Logic Flow
1.  **Auth**: Ensure user is logged in.
2.  **Query**: Fetch `SavedLawyer` records where `userId == me`.
3.  **Include JOINs**:
    -   `lawyer`: To get professional details.
    -   `lawyer.user`: To get the lawyer's name and avatar (which live in the `User` table).
    -   `lawyer.specializations`: Filtered to take only the top 3 (to avoid over-fetching).
4.  **Transformation**: The raw Prisma result is nested (`saved.lawyer.user.firstName`). The API flat maps this into a clean UI-ready object (`{ name: ..., image: ... }`).

#### Code Analysis
```javascript
// routes.js Line 173
const savedLawyers = await prisma.savedLawyer.findMany({
    where: { userId: req.user.id },
    include: {
        lawyer: {
            include: { user: true, specializations: true } // Deep nested JOIN
        }
    }
});
```

> [!TIP]
> **Prisma `metrics`**:
> This query performs a potentially heavy JOIN. In a SQL explanation, this would involve 4 tables (`SavedLawyer` -> `Lawyer` -> `User` + `Specialization`). Indexing `userId` on `SavedLawyer` is crucial here.

## 4. API Specification

| Method | Endpoint | Description | Role |
|:-------|:---------|:------------|:-----|
| `GET` | `/users/profile` | Get own profile | Any |
| `PUT` | `/users/profile` | Update text fields | Any |
| `GET` | `/users/saved-lawyers` | List favorites | Any |
| `POST` | `/users/saved-lawyers/:id` | Add favorite | Any |
| `DELETE` | `/users/saved-lawyers/:id` | Remove favorite | Any |
| `GET` | `/users` | List all users with pagination | **ADMIN** |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
The users functionality is split between `userAPI` and `favoritesAPI` objects within the index file.

```javascript
// services/api/index.js
export const favoritesAPI = {
    async getByUser() {
        // Returns { data: [...] } which maps directly to the UI components
        return apiClient.get('/users/saved-lawyers');
    }
};
```

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Logic in Routes**: The `Users` module does not have a `service.js` or `controller.js`. All logic (DB queries, transformation) is inside `routes.js`.
    -   *Impact*: Hard to test unit logic. Hard to reuse code (e.g., if another module needs to "get user profile").
    -   *Fix*: Refactor DB calls into `service.js`.
-   **Missing Validation**: `PUT /profile` reads `req.body` directly without a Joi/Zod validation middleware. A user could send a massive string for `firstName` and crash the DB insert.

### ⚠️ Maintainability
-   **N+1 Risk**: retrieving `specializations` inside the `findMany` is efficient with Prisma (usually a second query), but if you ever switch to raw SQL or add complexity, this deep nesting becomes a performance bottleneck.
-   **Pagination**: The Admin `GET /users` implements offset-based pagination (`skip/take`).
    -   *Pro Tip*: For large datasets (>1M users), offset pagination gets slower. Switch to **Cursor-based pagination** (using `id` or `createdAt`).

### 🏆 Top 1% Tip
**Soft Delete**:
Currently, there is no delete endpoint. If you add one, **NEVER** actually `DELETE FROM users`. Add a `deletedAt` column. This preserves referential integrity for historic bookings and audit logs.
