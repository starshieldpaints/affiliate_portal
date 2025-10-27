# Architecture Overview

## System Context

- **Affiliate Portal (Next.js PWA)** – mobile-first experience for affiliates to manage onboarding, links, analytics, and payouts.
- **Admin Portal (Next.js)** – desktop control center for program managers to oversee affiliates, commissions, payouts, attribution policies, and fraud checks.
- **Core API (NestJS)** – modular monolith exposing REST APIs, webhooks, and background workflows using Prisma + PostgreSQL.
- **Worker Service (BullMQ)** – processes asynchronous jobs for commission approvals, payout orchestration, notifications, and scheduled reports.
- **Data Stores**
  - PostgreSQL (OLTP) as the source of truth.
  - Redis for caching, sessions, and queues.
  - S3 for creative assets, payout receipts, and exports.
  - ClickHouse (future) for analytics workloads.

## Module Responsibilities

| Module | Responsibilities |
| ------ | ---------------- |
| Auth | JWT authentication, refresh tokens, 2FA, role-based guards |
| Affiliates | Profiles, KYC status, payout settings, onboarding workflows |
| Catalog | Product synchronization, creatives, asset management |
| Tracking | Redirect endpoint, click logging, consent-aware cookie lifecycle |
| Attribution | Policy engine (last-click vs coupon-first), manual overrides, audit logs |
| Commission | Rule evaluation, ledger lifecycle, FX handling |
| Payouts | Batch creation, provider submission, reconciliation, receipts |
| Reports | Aggregations, scheduled delivery, analytics API |
| Fraud | Bot filtering, velocity checks, self-purchase detection, alerting |

## Security Considerations

- Enforce zero-trust networking, MFA for Admins, and immutable audit logs.
- All secrets sourced from AWS Secrets Manager with automated rotation.
- Data encryption at rest (RDS, S3) and in transit (TLS, HSTS, mutual TLS optional for webhooks).
- Centralized logging and tracing via OpenTelemetry; anomaly detection on authentication and payouts.

## Deployment Pipeline

1. Pull Request triggers lint, typecheck, unit tests, integration tests (with Postgres test container), and Playwright smoke suite.
2. Upon approval, Turbo repository builds app artifacts, containers built with distroless base images, signed via cosign.
3. GitHub Actions deploys to staging (blue), runs contract tests, then promotes to production (green) after health checks.
4. Observability dashboards (Grafana) monitor SLOs: API latency, job backlog, payout SLA, webhook success rate.

Refer to `infra/terraform` for infrastructure-as-code scaffolding and `docs/runbooks` for operational procedures.
