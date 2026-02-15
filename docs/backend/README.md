# Backend Documentation Index

This directory contains deep-dive documentation for all 13 modules of the Lawyer Booking backend.

## Core Modules
-   **[Auth](./auth.md)**: Authentication, JWT rotation, and security.
-   **[Users](./users.md)**: User profiles and management.
-   **[Lawyers](./lawyers.md)**: Lawyer profiles, search, and availability.

## Business Logic
-   **[Bookings](./bookings.md)**: The core reservation workflow.
-   **[Payments](./payments.md)**: Razorpay integration and webhooks.
-   **[Reviews](./reviews.md)**: Feedback system and rating aggregation.

## Case Management
-   **[Cases](./cases.md)**: Legal matter tracking and audit logs.
-   **[Documents](./documents.md)**: Secure file uploads via Supabase.
-   **[Chat](./chat.md)**: Messaging history and access control.

## System & Tools
-   **[Analytics](./analytics.md)**: Dual-database tracking system.
-   **[Notifications](./notifications.md)**: Alerting system.
-   **[Audit](./audit.md)**: System-wide activity logging.
-   **[Admin](./admin.md)**: Platform management and dashboards.

## Documentation Standard
Each file follows a strict "Amateur to Pro" structure:
1.  **Overview**: High-level purpose.
2.  **Architecture**: Database schema and relationships.
3.  **Deep Dive**: Line-by-line analysis of complex logic.
4.  **API Specification**: Endpoints and access control.
5.  **Frontend Integration**: How the React app connects.
6.  **Code Review**: Principal Engineer's critique and top 1% tips.
