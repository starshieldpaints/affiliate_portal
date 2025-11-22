# Admin API Contracts (Draft)

Base URL: `${NEXT_PUBLIC_API_URL}` (default `http://localhost:4000`)

Auth: Cookie-based session (access/refresh). All protected endpoints require admin session.

## Auth

### POST /auth/admin/login
- Body: `{ "email": string, "password": string }`
- 200: `{ "id": string, "email": string, "roles": ["admin"], "adminProfile": { "displayName": string } }`
- Sets auth cookies (httpOnly, sameSite=lax/strict).

### POST /auth/admin/logout
- Body: `{}`
- 204 No Content; clears cookies.

### POST /auth/admin/refresh
- Body: `{}`
- 200: same shape as login; rotates cookies.

### GET /auth/admin/me
- 200: admin user shape above or `null` if not authenticated.

## Affiliates

### GET /admin/affiliates
- Query: `search?: string`, `status?: "active" | "inactive" | "pending" | "blocked"`, `kycStatus?: "pending" | "verified" | "rejected" | "in_review"`, `country?: string`, `page?: number`, `pageSize?: number`, `createdFrom?: string`, `createdTo?: string`
- 200:
```json
{
  "data": [
    {
      "id": "aff_123",
      "email": "user@example.com",
      "displayName": "Jane Doe",
      "status": "active",
      "kycStatus": "verified",
      "phone": "+911234567890",
      "country": "IN",
      "payoutMethod": "upi",
      "payoutDetails": { "upiId": "name@bank" },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 120 }
}
```

### GET /admin/affiliates/:id
- 200: affiliate object (fields above) plus optional documents, verification timestamps, notes.

### PATCH /admin/affiliates/:id
- Body (partial):
```json
{
  "status": "active",
  "kycStatus": "verified",
  "payoutMethod": "upi",
  "payoutDetails": { "upiId": "name@bank" }
}
```
- 200: updated affiliate object.

### POST /admin/affiliates/:id/kyc
- Body: `{ "decision": "approve" | "reject", "reason"?: string }`
- 200: updated affiliate.

### POST /admin/affiliates/:id/notes
- Body: `{ "message": string }`
- 201: `{ "id": "note_1", "message": "...", "createdAt": "..." }`

## Products (Catalog)

### GET /admin/products
- Query: `search?: string`, `categoryId?: string`, `status?: "active"|"inactive"`, `page?: number`, `pageSize?: number`
- 200:
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Shield Lite 10L",
      "sku": "SL-10L",
      "price": 1999,
      "currency": "INR",
      "categoryId": "cat_paint",
      "categoryName": "Paints",
      "status": "active",
      "imageUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 320 }
}
```

### POST /admin/products
- Body:
```json
{
  "name": "Shield Lite 10L",
  "sku": "SL-10L",
  "price": 1999,
  "currency": "INR",
  "categoryId": "cat_paint",
  "status": "active",
  "imageUrl": "https://...",
  "description": "text",
  "attributes": { "volume": "10L" }
}
```
- 201: product object.

### PATCH /admin/products/:id
- Body: partial of POST body.
- 200: updated product.

### DELETE /admin/products/:id
- 204 No Content.

## Commission Rules

### GET /admin/commission-rules
- Query: `search?: string`, `status?: "active" | "inactive"`, `page?: number`, `pageSize?: number`
- 200:
```json
{
  "data": [
    {
      "id": "rule_1",
      "name": "Default Paints",
      "status": "active",
      "rateType": "percent",
      "rateValue": 12.5,
      "appliesTo": { "categoryIds": ["cat_paint"], "productIds": [] },
      "startsAt": "2024-01-01T00:00:00Z",
      "endsAt": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 12 }
}
```

### POST /admin/commission-rules
- Body:
```json
{
  "name": "Rule name",
  "status": "active",
  "rateType": "percent",
  "rateValue": 10,
  "appliesTo": { "categoryIds": ["cat_paint"], "productIds": [] },
  "startsAt": "2024-01-01T00:00:00Z",
  "endsAt": null
}
```
- 201: rule object.

### PATCH /admin/commission-rules/:id
- Body: partial of POST body.
- 200: updated rule.

### POST /admin/commission-rules/:id/activate
### POST /admin/commission-rules/:id/deactivate
- 200: updated rule status.

## Orders & Refunds

### GET /admin/orders
- Query: `search?: string`, `status?: "pending" | "paid" | "refunded" | "flagged"`, `override?: "true" | "false"`, `risk?: "high" | "normal"`, `page?: number`, `pageSize?: number`, `from?: string`, `to?: string`
- 200:
```json
{
  "data": [
    {
      "id": "ord_123",
      "orderNumber": "SO-1001",
      "affiliateId": "aff_123",
      "productId": "prod_123",
      "amount": 2599,
      "currency": "INR",
      "status": "paid",
      "attribution": { "ruleId": "rule_1", "manualOverride": false },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 2000 }
}
```

### GET /admin/orders/:id
- 200: order detail with attribution, affiliate summary, refund info (optional).

### PATCH /admin/orders/:id
- Body (partial): `{ "status": "paid", "attribution": { "ruleId": "rule_2", "manualOverride": true } }`
- 200: updated order.

### POST /admin/orders/:id/refund
- Body: `{ "amount": number, "reason": string }`
- 201: `{ "id": "refund_1", "status": "submitted" }`

## Payouts

### GET /admin/payouts
- Query: `status?: "queued" | "processing" | "paid" | "failed"`, `page?: number`, `pageSize?: number`
- 200:
```json
{
  "data": [
    {
      "id": "pay_1",
      "batchId": "batch_2024_05_26",
      "affiliateId": "aff_123",
      "amount": 12000,
      "currency": "INR",
      "status": "queued",
      "scheduledFor": "2024-05-26T09:00:00Z",
      "createdAt": "2024-05-25T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 120 }
}
```

### POST /admin/payouts/batch
- Body: `{ "affiliateIds": ["aff_123"], "scheduledFor": "2024-05-26T09:00:00Z" }`
- 201: `{ "batchId": "batch_2024_05_26", "count": 10 }`

### PATCH /admin/payouts/:id
- Body: `{ "status": "paid" | "failed", "notes"?: string }`
- 200: updated payout record.

### GET /admin/payouts/batches
- Query: `status?: "queued" | "processing" | "paid" | "failed"`, `page?: number`, `pageSize?: number`
- 200: `{ "data": [ { "batchId": "batch_2024_05_26", "count": 10, "status": "queued", "scheduledFor": "...", "createdAt": "..." } ], "meta": { ... } }`

## Reports

### GET /admin/reports
- Query: `type?: "summary" | "payouts" | "orders"`, `range?: "7d" | "30d" | "90d"`
- 200:
```json
{
  "data": [
    { "id": "rpt_1", "type": "payouts", "label": "Payouts last 30d", "generatedAt": "2024-05-01T00:00:00Z", "url": "https://s3/report.csv" }
  ]
}
```

### POST /admin/reports
- Body: `{ "type": "payouts", "range": "30d", "format": "csv" }`
- 201: `{ "id": "rpt_2", "status": "queued" }`

## Fraud & Alerts

### GET /admin/fraud/alerts
- Query: `status?: "open" | "closed"`, `type?: string`, `page?: number`, `pageSize?: number`
- 200:
```json
{
  "data": [
    { "id": "alert_1", "type": "velocity", "subjectId": "aff_123", "riskScore": 0.81, "status": "open", "createdAt": "2024-05-20T00:00:00Z" }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 8 }
}
```

### GET /admin/fraud/alerts/:id
- 200: alert detail including history/notes (optional).

### PATCH /admin/fraud/alerts/:id
- Body: `{ "status": "closed", "note"?: string }`
- 200: updated alert.

## Audit

### GET /admin/audit
- Query: `actorEmail?: string`, `action?: string`, `from?: string`, `to?: string`, `page?: number`, `pageSize?: number`
- 200:
```json
{
  "data": [
    { "id": "audit_1", "actor": "admin@example.com", "action": "UPDATED_COMMISSION_RULE", "targetId": "rule_1", "createdAt": "2024-05-21T00:00:00Z", "meta": { "ip": "1.1.1.1" } }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 400 }
}
```

### GET /admin/audit/export
- Query: `from?: string`, `to?: string`, `actorEmail?: string`, `action?: string`
- 200: CSV file download.

## Health

### GET /health
- 200: `{ "status": "ok", "uptime": number }`

### GET /ready
- 200 when dependencies are ready; 503 otherwise.
