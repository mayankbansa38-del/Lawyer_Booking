# ADR-002: PostgreSQL + MongoDB Dual-Database Architecture

**Status:** Accepted (Under Review)  
**Date:** 2026-02-09  
**Deciders:** Development Team

## Context

NyayBooker uses two databases:
1. **PostgreSQL (via Prisma):** Users, lawyers, bookings, payments
2. **MongoDB:** Notifications, activity logs, audit trails

## Decision

Maintain dual-database architecture for specialized workloads.

## Rationale

| Data Type | PostgreSQL | MongoDB |
|-----------|-----------|---------|
| User profiles, Bookings | ✅ Strong ACID, relations | ❌ Overkill |
| Notifications, Logs | ❌ Schema migrations for flexible data | ✅ Schema-less, time-series |
| Payments (compliance) | ✅ ACID transactions | ❌ Eventual consistency |

## Implementation

- PostgreSQL: via Neon (serverless) with Prisma ORM
- MongoDB: via MongoDB Atlas for notifications/logs
- Single `disconnectAllDatabases()` for graceful shutdown

## Consequences

**Positive:**
- Right tool for the job (ACID for money, flexible for logs)
- Prisma provides type-safe queries for critical data

**Negative:**
- Increased operational complexity
- Two connection strings to manage
- Developer cognitive load

## Open Questions

> [!WARNING]
> **Review Required:** Is MongoDB strictly necessary, or can PostgreSQL JSONB columns handle notification/log storage? This would reduce ops burden.

## Related

- ADR-003: Prisma ORM selection
