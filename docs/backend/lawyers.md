# Lawyers Module Documentation

## 1. Overview
The Lawyers module allows clients to discover, filter, and view lawyer profiles. It is the core "Marketplace" component of the platform.

-   **Purpose**: Enable clients to find the right legal expert.
-   **Key Features**:
    -   Advanced Search & Filtering (Location, Price, Experience, Specialization).
    -   Availability Checking (Slot generation).
    -   Profile Management (Lawyers updating their own data).
-   **Dependencies**: `Prisma` (Postgres), `GeoDistance` (future scope, currently string matching).

## 2. Architecture & Data Models
The data model splits the identity (`User`) from the professional profile (`Lawyer`) to allow role-specific fields.

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Lawyer` | Professional Profile | `hourlyRate`, `city`, `experience`, `headline` | `User`, `Booking[]`, `Review[]` |
| `PracticeArea` | Taxonomy | `name`, `slug`, `icon` | `LawyerSpecialization[]` |
| `LawyerSpecialization` | Many-to-Many | `isPrimary`, `yearsExperience` | `Lawyer`, `PracticeArea` |

## 3. Module Deep Dive (Amateur to Pro)

### `GET /api/v1/lawyers` (Search Engine)
**Goal**: Return a paginated, sorted, and filtered list of lawyers matching complex criteria.

#### Logic Flow
1.  **Parsing Query Params**: Extracts filters like `minRate`, `city`, `specialization`.
2.  **Dynamic `where` Construction**:
    -   *Specialization*: Uses a nested `some` query to find lawyers linked to a specific Practice Area slug.
    -   *Text Search*: Uses `OR` condition to search in `bio`, `headline`, `firstName`, AND `lastName`.
3.  **Sorting**:
    -   `rating` -> `averageRating: desc`
    -   `price` -> `hourlyRate: asc`
4.  **Transformation**: Flattens the nested `Lawyer -> User` structure into a clean API response.

#### Code Analysis
```javascript
// routes.js Line 81 (Specialization Filter)
if (specialization) {
    where.specializations = {
        some: { practiceArea: { slug: specialization } }
    };
}

// routes.js Line 92 (Text Search)
if (search) {
    where.OR = [
        { bio: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { ... } } }
    ];
}
```

> [!TIP]
> **Prisma `mode: 'insensitive'`**:
> Postgres indexes are case-sensitive by default. Using `insensitive` forces a sequence scan unless you have a specific `CITEXT` column or a functional index (`LOWER(col)`). For high-scale search, move this to **Elasticsearch** or **Meilisearch**.

### `GET /:id/availability` (Slot Generator)
**Goal**: Calculate open time slots for a given date.

#### Logic Flow
1.  **Fetch Schedule**: Gets the lawyer's weekly availability preferences (e.g., "Mon: 9-5").
2.  **Fetch Bookings**: Finds all *existing* confirmed/pending bookings for that specific date.
3.  **Subtraction Algorithm**: `Available Slots = Weekly Schedule - Existing Bookings`.

## 4. API Specification

| Method | Endpoint | Description | Query Params |
|:-------|:---------|:------------|:-------------|
| `GET` | `/api/v1/lawyers` | Search lawyers | `city`, `specialization`, `minRate`, `search` |
| `GET` | `/api/v1/lawyers/:slugOrId` | Get profile | - |
| `GET` | `/api/v1/lawyers/:id/availability` | Get slots | `date=YYYY-MM-DD` |
| `PUT` | `/api/v1/lawyers/profile` | Update own profile | - |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
The `lawyerAPI.getAll` method performs heavy frontend-to-backend parameter mapping.

```javascript
// services/api/index.js
async getAll(filters = {}) {
    const params = {};
    if (filters.locations) params.city = filters.locations[0]; // Logic: Only takes first location
    // ...
    return apiClient.get('/lawyers', { params });
}
```

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **No Pagination on Availability**: The availability endpoint returns *all* slots. If a lawyer works 24h/7d with 15min slots, payload size increases.
    -   *Fix*: This is fine for daily views.
-   **Transaction Missing**: in `PUT /profile`, the code updates `User`, `Lawyer`, and `Specializations`. If `Specializations` fails, the `User` name change stays committed (partial update).
    -   *Fix*: **(GOOD NEWS)** The code *does* use `prisma.$transaction`. Kudos!

### ⚠️ Maintainability
-   **Slot Generation Logic**: The logic to generate slots (`logic unavailable in routes file`) seems to be simplified or missing in the route handler shown. It fetches bookings but doesn't explicitly show the "Subtraction" code in the snippet (it stops at `const availableSlots = ...`).
    -   *Risk*: If this logic is complex, it should be in `service.js` and unit-tested, not hidden in `routes.js`.
-   **Hardcoded Filters**: `if (filters.locations[0])` in frontend limits the API power. The backend supports full text search, but frontend restricts it to a single city selection.

### 🏆 Top 1% Tip
**Geospatial Search**:
String matching on `city` ("Mumbai" vs "mumbai") is brittle. Implement **PostGIS**. Store coordinates (`lat`, `lng`) and allow users to "Find lawyers within 5km".
