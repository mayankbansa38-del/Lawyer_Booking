# ADR-003: Prisma ORM over Raw SQL

**Status:** Accepted  
**Date:** 2026-02-09  
**Deciders:** Development Team

## Context

Database access layer options for PostgreSQL:
1. Raw SQL (pg driver)
2. Query builder (Knex.js)
3. Full ORM (Prisma, TypeORM, Sequelize)

## Decision

We chose **Prisma ORM** for PostgreSQL access.

## Rationale

| Factor | Raw SQL | Knex | Prisma |
|--------|---------|------|--------|
| Type safety | ❌ Manual | ❌ Partial | ✅ Full (schema-first) |
| Migrations | ❌ Manual | ✅ Built-in | ✅ Declarative |
| Learning curve | Low | Medium | Medium |
| Query complexity | ✅ Full SQL | ✅ Full SQL | ⚠️ Limited (escape hatch via `$queryRaw`) |

## Implementation

- Schema defined in `prisma/schema.prisma`
- Migrations via `npx prisma migrate dev`
- Client generated with `npx prisma generate`

## Consequences

**Positive:**
- Auto-generated TypeScript types
- Database schema as code (version controlled)
- Declarative migrations reduce errors

**Negative:**
- Complex queries require `$queryRaw`
- Additional build step (`prisma generate`)

## Related

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
