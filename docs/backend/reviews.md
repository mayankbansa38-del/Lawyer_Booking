# Reviews Module Documentation

## 1. Overview
The Reviews module builds trust in the marketplace. It allows clients to rate lawyers after a *completed* consultation. It automatically maintains the lawyer's aggregate rating score.

-   **Purpose**: Quality control and social proof.
-   **Key Features**:
    -   **Verified Only**: Can only review if you have a `COMPLETED` booking.
    -   **One-Time**: One review per booking.
    -   **Edit Window**: Reviews are locked after 48 hours.
    -   **Auto-Aggregation**: Updating a review instantly updates the `Lawyer` table stats.

## 2. Architecture & Data Models

### Database Schema
| Model | Purpose | Key Fields | Relationships |
|:------|:--------|:-----------|:--------------|
| `Review` | The feedback | `rating` (1-5), `title`, `content`, `isPublished` | `Booking`, `Lawyer`, `User` (Client) |
| `Lawyer` | Aggregate Target | `averageRating`, `totalReviews` | `Review` |

## 3. Module Deep Dive (Amateur to Pro)

### `POST /api/v1/reviews` (The "Trust" Transaction)
**Goal**: Accept feedback and recalculate the lawyer's public score.

#### Logic Flow
1.  **Validation**: Is rating 1-5?
2.  **Authorization**:
    -   Does the booking exist?
    -   Are you the client?
    -   Is booking `COMPLETED`? (Crucial prevention of premature reviews)
    -   Have you already reviewed?
3.  **Creation**: Save the `Review`.
4.  **Aggregation**:
    -   Run `prisma.review.aggregate({ _avg: { rating: true } })`.
    -   Update `Lawyer` table with the new average.

#### Code Analysis
```javascript
// routes.js Line 72 (Aggregation Pattern)
const aggregation = await prisma.review.aggregate({
    where: { lawyerId: booking.lawyerId, isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
});

await prisma.lawyer.update({
    where: { id: booking.lawyerId },
    data: {
        averageRating: aggregation._avg.rating || 0,
        totalReviews: aggregation._count.rating || 0,
    },
});
```

> [!TIP]
> **Denormalization**:
> We store `averageRating` on the `Lawyer` model instead of calculating it on every profile view. This makes `GET /lawyers` extremely fast (O(1) read vs O(N) calculation).

### `PUT /:id` (Strict Editing)
**Goal**: Allow typos to be fixed, but prevent history rewriting.
-   **Rule**: `hoursSinceCreation > 48` throws `BadRequestError`.
-   **Re-aggregation**: Editing a rating *also* triggers the aggregation logic again.

## 4. API Specification

| Method | Endpoint | Description | Constraints |
|:-------|:---------|:------------|:------------|
| `POST` | `/reviews` | Create Review | Booking must be COMPLETED |
| `GET` | `/reviews/lawyer/:id` | Public List | Public |
| `PUT` | `/reviews/:id` | Edit Review | < 48 hours old |
| `POST` | `/reviews/:id/respond`| Lawyer Reply | Lawyer Only |

## 5. Frontend Integration

### specific Service (`Frontend/src/services/api/index.js`)
Frontend typically displays these in a list with "Load More" pagination.
-   **Visuals**: Star rating component.
-   **Logic**: Check `booking.status === 'COMPLETED'` before showing "Leave Review" button.

## 6. Code Review & Improvements (Principal Engineer View)

### 🚨 Critical Issues
-   **Race Condition in Aggregation**: If two users review the same lawyer simultaneously, the `aggregate` -> `update` sequence might overwrite each other's calculations.
    -   *Fix*: Not critical for low traffic, but strict correctness requires database-level triggers or serializable transactions.

### ⚠️ Maintainability
-   **Aggregation Code Duplication**: The aggregation logic (lines 72-84 and 278-286) is copy-pasted in Create, Update, and Delete routes.
    -   *Fix*: Extract to `lawyerService.updateAggregateRatings(lawyerId)`.

### 🏆 Top 1% Tip
**Sentiment Analysis**:
Run the `content` through an NLP model (e.g., OpenAI, AWS Comprehend) during creation. Flag toxic reviews for specific moderation *before* publishing them. Add a `sentimentScore` field to sort reviews by "Most Constructive" rather than just "Newest".
