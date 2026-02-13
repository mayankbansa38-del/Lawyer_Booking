# NyayBooker Documentation

> Legal consultation booking platform connecting clients with verified lawyers.

## Quick Start

```bash
# Backend
cd Backend
cp .env.example .env  # Configure your environment
npm install
npx prisma generate
npm run dev

# Frontend  
cd Frontend
npm install
npm run dev
```

## Architecture

| Component | Stack |
|-----------|-------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Shadcn/UI |
| Backend | Express 4, Prisma 6, Zod |
| Database | PostgreSQL (Neon), MongoDB (Atlas) |
| Storage | Supabase (documents) |
| Auth | JWT + Google OAuth |

## API Endpoints

- **Health:** `GET /health/live`, `GET /health/ready`
- **Auth:** `/api/v1/auth/*`
- **Lawyers:** `/api/v1/lawyers/*`
- **Bookings:** `/api/v1/bookings/*`
- **Payments:** `/api/v1/payments/*`

## Documentation Index

| Document | Description |
|----------|-------------|
| [ADR-001](./adr/ADR-001-jwt-authentication.md) | JWT authentication decision |
| [ADR-002](./adr/ADR-002-dual-database-strategy.md) | PostgreSQL + MongoDB rationale |
| [ADR-003](./adr/ADR-003-prisma-orm.md) | Prisma ORM selection |

## Environment Variables

See `Backend/.env.example` for required configuration:
- `DATABASE_URL` - Neon PostgreSQL connection
- `MONGODB_URI` - MongoDB Atlas connection  
- `JWT_SECRET` - Token signing key
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - File storage

## Development

```bash
# Run linting
npm run lint

# Build frontend (generates bundle analysis)
cd Frontend && npm run build
# View: Frontend/dist/stats.html

# Run Prisma migrations
cd Backend && npx prisma migrate dev
```
