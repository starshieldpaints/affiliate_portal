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

Environment variables live in `.env`. Start from `.env.example`, copy to `.env`, and tailor secrets per environment before running services.

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
