# StarShield Affiliate Portal Monorepo

End-to-end platform enabling StarShield affiliates to manage campaigns, track commissions, and receive payouts while giving admins powerful oversight, analytics, and fraud defenses.

## Workspaces

- `apps/affiliate` – Next.js 14 PWA tailored for affiliate self-service.
- `apps/admin` – Next.js 14 desktop console for admins.
- `services/core` – NestJS modular monolith exposing REST APIs, webhooks, and attribution logic.
- `services/worker` – BullMQ-driven job runner for commissions, payouts, and notifications.
- `packages/*` – Shared TypeScript libraries (UI kit, API SDK, config validation).
- `infra/terraform` – AWS infrastructure-as-code skeleton.
- `docs` – Living documentation (architecture, runbooks, security posture).

## Getting Started

```bash
# 1) Install dependencies
pnpm install

# 2) Boot backing services (PostgreSQL + Redis)
docker compose up -d

# 3) Apply database schema (development push)
pnpm --filter core-api prisma db push

# 4) (Optional) seed demo data
pnpm --filter core-api prisma db seed

# 5) Run services (separate terminal per command)
pnpm dev:api         # NestJS API
pnpm dev:worker      # BullMQ worker
pnpm dev:affiliate   # Affiliate PWA
pnpm dev:admin       # Admin console
```

> 💡 Need to import a large product catalog? Place your JSON payload in `services/core/prisma/data/products.json` (or point `PRODUCT_SEED_PATH` at any file) before running `pnpm --filter core-api prisma db seed`. The seeder accepts either a legacy array of product records or a `{ "categories": [...], "products": [...] }` object. When categories are supplied, set each category `id` to the slug you reference from every product’s `categoryId`; the seeder will upsert categories first, normalize currency/price precision, and wire products to the right category automatically.

### Resetting + reseeding the database

Need a clean slate before importing fresh catalog data? Use the Prisma reset helper to truncate every application table (cascading foreign keys and resetting sequences) and then rerun the seed:

```bash
pnpm --filter core-api exec ts-node -P ./prisma/tsconfig.json ./prisma/reset-db.ts
pnpm --filter core-api exec prisma db seed
```

Both commands respect `DATABASE_URL`, so be sure it points at the database you intend to wipe.

Environment variables live in `.env`. Start from `.env.example`, copy to `.env`, and tailor secrets per environment before running services.

## Product Catalog API

- `GET /products?page=1&pageSize=20` (core API) serves paginated products with category labels; defaults to `page=1`, `pageSize=20`, and caps at 100 per call.
- The affiliate PWA reads from this endpoint via `NEXT_PUBLIC_API_URL`; be sure that env is pointed at your running API (e.g., `http://localhost:3000`) before launching `pnpm dev:affiliate`.

## Click Tracking

- Public redirect lives at `GET /r/:code`. It resolves active affiliate links, sets/refreshes the `af_click` cookie (30-day default), records the click payload, and redirects to the product landing page.
- Configure fallback behavior with `TRACKING_FALLBACK_URL` (defaults to `https://starshieldpaints.com`) and `COOKIE_DOMAIN` for cross-subdomain cookies.
- Click metadata (`utm_*`, IP hash, referrer, session id) is written into the `Click` table for downstream attribution and reporting.

## Quality Gates

- **Linting** – `pnpm lint` (Turborepo orchestrated).
- **Testing** – `pnpm test` runs package-level suites (Jest, Playwright TBD).
- **Formatting** – `pnpm format` (Prettier).

## Security Baseline

- Argon2 password hashing, JWT (+ optional WebAuthn/TOTP).
- Audit logging for every admin change.
- Bot/velocity checks on tracking endpoints and payout approvals.
- Immutable commission ledger with payout reconciliation jobs.

Review `docs/architecture.md` and `infra/terraform/README.md` for deeper context.
# affiliate_portal
