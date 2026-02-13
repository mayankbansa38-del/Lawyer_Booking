# Local PostgreSQL Setup (Docker)

## 🚀 Quick Start (Copy-Paste)

### 1. Start PostgreSQL Container
```bash
cd ~/work/projects/Lawyer_Booking/Backend
docker compose up -d
docker compose logs -f  # Ctrl+C to exit logs
```

### 2. Connection String
**Use this in `.env` for local dev:**
```
DATABASE_URL="postgresql://nyaybooker:dev_password_local@localhost:5432/nyaybooker_db?schema=public"
```

### 3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4. Seed Database (if seed script exists)
```bash
npx prisma db seed
# OR if custom seed:
node prisma/seed.js
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

---

## 📊 Performance Comparison

| Metric | Neon (us-east-1) | Local Docker |
|--------|------------------|--------------|
| Ping | ~500ms | <5ms |
| Dashboard load | ~7s | <0.2s |
| Login flow | ~8s | <0.5s |

---

## 🛠️ Common Commands

**View logs:**
```bash
docker compose logs -f postgres
```

**Stop container:**
```bash
docker compose stop
```

**Remove container + data:**
```bash
docker compose down -v
```

**Connect via psql:**
```bash
docker exec -it nyaybooker-postgres psql -U nyaybooker -d nyaybooker_db
```

**Backup database:**
```bash
docker exec nyaybooker-postgres pg_dump -U nyaybooker nyaybooker_db > backup.sql
```

**Restore database:**
```bash
cat backup.sql | docker exec -i nyaybooker-postgres psql -U nyaybooker -d nyaybooker_db
```

---

## 🔄 Switching Between Neon and Local

**Local (Development):**
```bash
export DATABASE_URL="postgresql://nyaybooker:dev_password_local@localhost:5432/nyaybooker_db?schema=public"
npm run dev
```

**Neon (Production/Testing):**
```bash
# Use .env file with Neon pooler URL
npm run dev
```

---

## ⚠️ Important Notes

1. **Don't commit `.env.local`** - Already in `.gitignore`
2. **Migrations are shared** - Same Prisma schema works for both
3. **Data is isolated** - Local and Neon databases are separate
4. **Container persists** - Data survives container restarts unless you `down -v`
