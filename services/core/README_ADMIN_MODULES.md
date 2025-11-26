# Admin Backend Modules Runbook

## Environment Variables
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_ACCESS_SECRET` – secret for signing access tokens
- `JWT_REFRESH_SECRET` – secret for signing refresh tokens
- `JWT_ACCESS_EXPIRES_IN` – access token TTL (e.g., `900s`)
- `JWT_REFRESH_EXPIRES_IN` – refresh token TTL (e.g., `30d`)
- `REDIS_HOST`, `REDIS_PORT` – Redis for rate limits and refresh token revocation
- `PII_ENCRYPTION_KEY` – 32-byte key for PII encryption (dev can use any string)
- `STORAGE_BUCKET` – bucket name if using cloud storage (reports/receipts)
- `STORAGE_BASE_URL` – public base URL for stored artifacts

## Migrations
```bash
cd services/core
pnpm prisma migrate dev --name <migration-name>
pnpm prisma generate
```

## Running Tests (CI)
```bash
cd services/core
pnpm test
```
Worker tests (none today) should still run pipeline hook:
```bash
cd services/worker
pnpm test   # if/when added
```

## Starting Services
```bash
# API (dev)
cd services/core
pnpm start:dev

# Workers (BullMQ)
cd services/worker
pnpm start
```

## Workers Queues
- commission – evaluates commissions after ingestion
- payout – submits payout batches via provider stub
- fraud – periodic fraud scans
- report – generates CSV reports

## Admin Onboarding (create admin user)
Use Prisma seed or manual script:
```ts
// scripts/create-admin.ts (example snippet)
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash(process.argv[2] ?? 'ChangeMe123!');
  await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash, role: 'admin', status: 'active' }
  });
  console.log('Admin created');
}
main().finally(() => prisma.$disconnect());
```
Run with:
```bash
node -r ts-node/register scripts/create-admin.ts "StrongPass!234"
```

## Notes
- Ensure Redis is running for rate limiting and refresh token revocation.
- Reports are generated to `./reports` (local stub); configure cloud storage in prod.
- Keep JWT secrets and PII encryption keys in secret manager in production.
