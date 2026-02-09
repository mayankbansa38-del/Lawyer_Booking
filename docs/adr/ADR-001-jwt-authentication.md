# ADR-001: JWT-Based Authentication over Sessions

**Status:** Accepted  
**Date:** 2026-02-09  
**Deciders:** Development Team

## Context

NyayBooker requires user authentication for lawyers, clients, and admins. Options considered:
1. Session-based (server-stored sessions)
2. JWT-based (stateless tokens)

## Decision

We chose **JWT-based authentication** with HTTP-only cookies for token storage.

## Rationale

| Factor | Sessions | JWT |
|--------|----------|-----|
| Scalability | Requires session store (Redis) | Stateless, horizontally scalable |
| Microservices | Session sharing complex | Token verification anywhere |
| Mobile support | Cookie handling issues | Bearer tokens easy |
| 12-Factor compliance | Violates stateless process rule | Fully stateless |

## Implementation

- Access tokens: 15-minute expiry stored in HTTP-only cookie
- Refresh tokens: 7-day expiry in database (allows revocation)
- Token verification via `jsonwebtoken` package

## Consequences

**Positive:**
- Simple Kubernetes/Docker deployment (no session affinity needed)
- Easy to add mobile apps later

**Negative:**
- Token revocation requires refresh token lookup
- Larger request payload than session ID

## Related

- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
