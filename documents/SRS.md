# StarShield Affiliate Portal – Software Requirements Specification (SRS)
**Version:** 1.0 • **Date:** 2025-10-25  
**Roles:** Affiliate (User), Admin (only these roles)

---

## 1. Executive Summary
StarShield needs a two-portal system:
1. **Affiliate Portal (User):** Mobile-first progressive web app where affiliates can onboard, create/share links & coupons, view product catalog, track performance, and manage payouts.
2. **Admin Portal:** Desktop-first web app to manage affiliates, products, commission plans, attribution rules, refunds/reversals, analytics, and payouts.

Core objectives: reliable attribution, flexible commission rules, easy onboarding, accurate payouts, and clear analytics.

---

## 2. Scope
- **In scope:** tracking links, coupon attribution, order ingestion via webhooks, commission computation, payouts, dashboards, reports, fraud checks, audit logging, email/SMS notifications.
- **Out of scope (initially):** sub-affiliate multi-tiering, storefront/checkout, mobile native apps (PWA is in-scope).

---

## 3. Stakeholders
- **Affiliate (User):** creates links, views analytics, requests payout.
- **Admin:** config & ops; manages rules, payouts, products, and sees analytics.

---

## 4. Non-Functional Requirements
- **Availability:** 99.9% monthly for core APIs.
- **Performance:** p95 API < 300ms for read endpoints; attribution within 5s after paid order webhook.
- **Security:** JWT with refresh, 2FA optional; HTTPS/TLS; OWASP ASVS safeguards; PII encryption.
- **Privacy/Compliance:** consent management for tracking; data-retention policy; audit log for admin actions.
- **Scalability:** 10k DAU affiliates, 50M monthly click events (via event table offload to analytics store).
- **Accessibility:** WCAG 2.1 AA for portals.
- **Internationalization:** currency handling and time zones; translatable UI labels.

---

## 5. Information Architecture & Navigation

### Affiliate Portal (Mobile-first)
- **Dashboard** → KPIs, top products, latest orders
- **Products** → Catalog, Product Details (link & QR generator, creatives)
- **Links & Coupons** → Manage links, deep-linking, UTM templates, coupon mapping
- **Reports** → Time-series, order-level details, CSV/Excel export
- **Payouts** → Balance, pending/approved/paid, payout history/invoices
- **Notifications** → Sales, payouts, policy changes
- **Help** → FAQ, contact form

### Admin Portal (Desktop-first)
- **Overview** → Company KPIs, anomalies, leaderboards
- **Affiliates** → Approve/reject, statuses, KYC fields
- **Products** → Catalog sync, activation state
- **Commission Rules** → Create/edit; simulation on historical orders
- **Attribution** → Policy settings (last-click/coupon priority/window)
- **Orders & Refunds** → Itemized, status, reversals
- **Payouts** → Batch create, submit to provider, receipts
- **Reports** → Scheduled & on-demand
- **Audit Logs** → All admin-sensitive changes
- **Settings** → Company, integrations, email templates, consent text

---

## 6. User Stories & Acceptance Criteria (selected)

### 6.1 Affiliate
- **US-A1:** As an affiliate, I can generate a shareable product link with my code.
  - **AC:** Given a product, when I click “Create link,” then I receive a short URL, QR code, and UTM parameters applied.
- **US-A2:** I can view my earnings and pending payouts.
  - **AC:** Dashboard shows totals with breakdown by period; matches ledger entries.
- **US-A3:** I can download a CSV of my last month’s itemized sales/commissions.
  - **AC:** CSV includes order_id, product, qty, amounts, commission, status; timezone correct.

### 6.2 Admin
- **US-AD1:** As an admin, I can approve or suspend affiliates.
  - **AC:** State change reflected in authentication; suspended affiliates cannot generate new links.
- **US-AD2:** I can define a commission rule for a specific product with a 15% rate, valid next month only.
  - **AC:** Orders in that window generate ledger entries at 15% net; others use fallback rules.
- **US-AD3:** I can create a payout batch and send payments.
  - **AC:** Batch aggregates approved balances; external payout IDs stored; receipts generated per affiliate.

---

## 7. Functional Requirements

### 7.1 Tracking & Attribution
- First-party cookie (`af_click`) set at redirect; default 30-day window (configurable).
- Bot filtering (UA denylist, velocity caps, ASN checks).
- Policy modes: last-click wins; coupon priority; first-click (feature-flag); multi-touch linear (phase 2).
- Manual override per order by admin (with audit log).

### 7.2 Commission Engine
- Rule types: percent-of-net, flat-per-item/order.
- Scopes: global, category, product, affiliate (optional tier), time windows.
- Exclusions: tax, shipping, gift cards; self-purchase prevention by domain/email list.
- Lifecycle: `pending` → `approved` (after N-day grace) → `paid` or `reversed` on refund.

### 7.3 Orders & Refunds
- Webhooks from store (e.g., Shopify/WooCommerce/custom) for create/paid/refund.
- Idempotent ingestion by `external_order_id`.
- Clawback reversals via ledger entries (no destructive edits).

### 7.4 Payouts
- Providers: Stripe Connect (preferred) / PayPal / Wise.
- Thresholds and schedules (monthly, biweekly).
- Batch export/import and status sync; receipts stored.

### 7.5 Reporting & Analytics
- Metrics: clicks, CTR, conversions, AOV, EPC, revenue, commission, refund rate.
- Breakdowns: product, device, geo, campaign, affiliate.
- Scheduled email reports; CSV/Excel export endpoints.

### 7.6 Portal UX
- Affiliate PWA install; offline read-only for dashboard.
- Admin desktop: keyboard shortcuts, quick search, bulk actions.
- Internationalization-ready strings and number/date formatting.

---

## 8. Data Model (see ERD.mmd for diagram)
Tables: users, affiliate_profiles, products, categories, affiliate_links, coupons, clicks, orders, order_items, attribution, commission_rules, commission_ledger, payout_batches, payout_lines, refund_events, audit_log.

**Roles limited to:** `affiliate`, `admin` only.

---

## 9. API Design
- JWT auth; refresh tokens; 2FA optional.
- REST JSON; OpenAPI in `API_Spec.yaml`.
- Key endpoints:
  - `/auth/*`, `/me/*`, `/products/*`, `/me/links`, `/me/coupons`
  - `/admin/affiliates`, `/admin/commission-rules`, `/admin/payouts/*`, `/admin/reports`
  - `/webhooks/orders`, `/webhooks/refunds`
  - `/r/{code}` (redirect)

---

## 10. Integrations
- E-commerce (Shopify/Woo): product & order webhooks; pagination sync for catalog.
- Payouts: Stripe Connect (Express accounts) or PayPal Payouts.
- Email/SMS: SES/SendGrid; Twilio.
- Object storage for creatives, invoices, exports.

---

## 11. Security & Privacy
- HTTPS; HSTS; CSP; rate limits; WAF.
- PII encryption at rest (column-level); key rotation.
- RBAC: affiliate vs admin; least-privilege service accounts.
- Consent logs; cookie banner texts configurable.
- Audit logging for all admin mutations and manual overrides.

---

## 12. Testing & QA
- Unit tests (services, rules, helpers).
- Integration tests (webhooks, commission compute).
- E2E tests (Cypress/Playwright) for both portals.
- Load tests for redirect/attribution endpoints.
- Security testing (SAST/DAST), dependency scanning.

---

## 13. DevOps & Deploy
- Monorepo (PNPM workspaces): `apps/affiliate`, `apps/admin`, `apps/api`, `packages/ui`.
- CI: lint/typecheck/test/build; preview deployments per PR; canary release.
- Infra: AWS (ECS/EKS), RDS Postgres, ElastiCache Redis, S3, CloudFront, Secrets Manager, SQS.
- Observability: OpenTelemetry traces; centralized logs; SLO dashboards & alerts.

---

## 14. Roadmap
- **Phase 1 (MVP):** tracking, catalog sync, orders+attribution, basic rules, affiliate/admin dashboards, CSV export.
- **Phase 2:** payouts, refunds/reversals, coupon attribution, fraud checks, audit logs.
- **Phase 3:** multi-touch, rule simulations, advanced analytics, PWA offline.

---

## 15. Acceptance & Launch Checklist
- [ ] Attribution validated against test scenarios (link only, coupon only, both).
- [ ] Commission double-entry checks; currency rounding verified.
- [ ] Payout provider sandbox end-to-end run.
- [ ] Security review passed; audit logs complete.
- [ ] Data export & deletion flows validated.
