# Analytics Module Documentation

## 1. Overview
The Analytics module is a high-performance tracking and reporting system designed to capture user interactions (page views, searches, custom events) and provide actionable insights to Lawyers and Admins.

-   **Purpose**: To track user behavior, measure lawyer profile performance, and monitor system health (API errors).
-   **Key Features**:
    -   Real-time Page View & Event Tracking (MongoDB).
    -   Hybrid Dashboard (merging MongoDB logs with Postgres Booking/Payment data).
    -   Admin Reporting (API performance, System health).
-   **Dependencies**: `mongoose` (MongoDB), `prisma` (Postgres), `user-agent` parsing.

## 2. Architecture & Data Models
The module uses a **Dual-Database Architecture**:
-   **MongoDB**: strict-schema collections for high-volume write-heavy log data.
-   **PostgreSQL**: relational data for Bookings and Payments (referenced via `getHybridDashboardMetrics`).

### MongoDB Schemas (`service.js`)
| Collection | Purpose | Key Fields | Indexes |
|:-----------|:--------|:-----------|:--------|
| `PageView` | User navigation history | `sessionId`, `path`, `userId`, `timestamp` | `sessionId`, `path`, `timestamp` |
| `Event` | Custom interactions (clicks) | `event`, `category`, `sessionId` | `event`, `timestamp` |
| `SearchLog` | internal search queries | `query`, `resultsCount`, `filters` | `timestamp` |
| `ApiLog` | Backend performance logs | `path`, `statusCode`, `duration`, `error` | `statusCode`, `timestamp` |

> [!NOTE]
> Mongoose schemas are defined *inside* `service.js` using a singleton pattern (`getModels()`) to ensure the connection is established before model creation.

## 3. Module Deep Dive (Amateur to Pro)

### `getHybridDashboardMetrics(lawyerId)`
**Goal**: Combine "Soft Metrics" (Views - MongoDB) with "Hard Metrics" (Money - Postgres) to show a lawyer their true performance.

#### Logic Flow
1.  **Date Range Setup**: Calculates the start date (6 months ago) and end date (now).
2.  **Parallel Execution (`Promise.all`)**:
    -   **Task A (Postgres)**: Fetch *all* bookings for this lawyer in the last 6 months.
    -   **Task B (MongoDB)**: Count total page views for this lawyer's profile.
    -   **Task C (MongoDB)**: Count previous period page views (for trend calculation).
3.  **In-Memory Aggregation**:
    -   Iterates through the fetched bookings to calculate total earnings.
    -   Groups data by month (`Map<"Month Year", Data>`) to format it for the frontend chart.
4.  **Trend Calculation**: Compares current month vs. last month for Views, Bookings, and Earnings.

#### Code Analysis
```javascript
// Service.js Line 582
const [bookings, pageViewsCount, previousPageViewsCount] = await Promise.all([
    getPrismaClient().booking.findMany({...}), // Postgres
    models.PageView.countDocuments({...}),     // Mongo
    models.PageView.countDocuments({...})      // Mongo (Previous Period)
]);
```
> [!TIP]
> **Why `Promise.all`?**
> Database queries are I/O bound. Independent queries (Postgres vs Mongo) should always run in parallel to reduce total latency. If they ran sequentially, the user would wait `Time(Postgres) + Time(Mongo)`. With `Promise.all`, they wait `Max(Time(Postgres), Time(Mongo))`.

## 4. API Specification

### Tracking (Public/Optional Auth)
| Method | Endpoint | Description | Payload |
|:-------|:---------|:------------|:--------|
| `POST` | `/api/v1/analytics/pageview` | Log a visit | `{ path, referrer, sessionId }` |
| `POST` | `/api/v1/analytics/event` | Log action | `{ event, category, properties }` |

### Reporting (Private)
| Method | Endpoint | Description | Role |
|:-------|:---------|:------------|:-----|
| `GET` | `/api/v1/analytics/hybrid-dashboard` | Lawyer's personal stats | `LAWYER`, `ADMIN` |
| `GET` | `/api/v1/analytics/dashboard` | System-wide admin stats | `ADMIN` |
| `GET` | `/api/v1/analytics/api` | API Performance (Latency/Errors) | `ADMIN` |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
The frontend does not have a dedicated `AnalyticsService` file; instead, it exposes methods via the `lawyerAPI` object.

```javascript
// services/api/index.js
async getAnalytics(lawyerId) {
    const response = await apiClient.get('/analytics/hybrid-dashboard', {
        params: { lawyerId }
    });
    return response.data;
}
```

### Component Usage (`LawyerAnalytics.jsx`)
-   **Trigger**: `useEffect` calls `lawyerAPI.getAnalytics(user.lawyer.id)` on mount.
-   **Visualization**: Uses the `monthlyData` array from the API to render bar charts (Earnings) and progress bars (Views vs Bookings).

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Performance (Write Heavy)**: `trackPageView` writes directly to MongoDB. In a high-traffic scenario (10k+ users), this will lock the DB connection pool.
    -   *Fix*: Use a **Buffer/Queue**. Push events to Redis/Kafka, and have a worker bulk-insert them every 5 seconds.
-   **Scalability (Aggregation)**: `getHybridDashboardMetrics` fetches *all* bookings for 6 months and filters/sums them in JavaScript.
    -   *Risk*: If a lawyer has 50,000 bookings, this will crash the Node.js memory (OOM).
    -   *Fix*: Use Database Aggregation. Let Postgres do the `SUM(amount)` and `GROUP BY month`.

### ⚠️ Maintainability
-   **Hardcoded Dates**: `months = ['Jan', 'Feb'...]` rely on server timezone. Should return ISO dates and let the Frontend format them.
-   **Error Swallowing**: In `trackPageView`, errors are caught and logged (`logger.error`), but the client receives a 200 OK. This is good for UX (analytics shouldn't break the app), but ensure your logger alerts you if *all* writes are failing.

### 🏆 Top 1% Tip
**Implement Sampling & Debouncing**:
You don't need to track *every* scroll event. For high-volume events, implement 10% sampling or throttle requests on the client side (`lodash.throttle`) to reduce server load by 90% while keeping statistically significant data.
