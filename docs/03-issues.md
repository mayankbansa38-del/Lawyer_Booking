# Known Issues & Roadmap

## Critical Issues

### 1. Frontend Bundle Size (278KB main chunk)
**Impact:** Slow initial page load  
**Mitigation:** 
- [x] Code splitting configured
- [ ] Tree-shake unused exports from mockData.js
- [ ] Evaluate if Swiper.js can be lazy-loaded

### 2. Missing Error Boundaries
**Impact:** Unhandled errors crash entire app  
**Mitigation:** Add React Error Boundaries around lazy routes

---

## Medium Priority

### 3. Request ID not passed to all logs
**Status:** Partially implemented  
**Next:** Ensure `req.id` is included in all Winston log entries

### 4. mockData.js (33KB) in production bundle
**Status:** Used in 3 files for dev/testing  
**Next:** Move to Mock Service Worker for dev-only mocking

### 5. No staging environment
**Status:** Only dev/prod exist  
**Next:** Add staging branch with separate database

---

## Low Priority / Tech Debt

### 6. Swagger/OpenAPI not generated
**Status:** Planned  
**Deps:** Install `swagger-jsdoc`, add JSDoc to routes

### 7. Prisma ERD not generated
**Status:** Planned  
**Deps:** Install `prisma-erd-generator`

### 8. No E2E tests
**Status:** No Playwright/Cypress setup  
**Next:** Add critical path tests (login, booking flow)

---

## Roadmap

| Phase | Target | Status |
|-------|--------|--------|
| 1. Security Audit | ✅ | Complete |
| 2. Backend Refactoring | 🔄 | In Progress |
| 3. Frontend Optimization | 🔄 | In Progress |
| 4. Documentation | 🔄 | In Progress |
| 5. E2E Testing | ⏳ | Planned |
| 6. Staging Environment | ⏳ | Planned |
