-- Add PII encrypted and hash columns
ALTER TABLE "AffiliateProfile"
  ADD COLUMN "phoneEnc" TEXT,
  ADD COLUMN "phoneHash" TEXT,
  ADD COLUMN "panEnc" TEXT,
  ADD COLUMN "panHash" TEXT,
  ADD COLUMN "aadhaarEnc" TEXT,
  ADD COLUMN "aadhaarHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProfile_phoneHash_key" ON "AffiliateProfile"("phoneHash");
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProfile_panHash_key" ON "AffiliateProfile"("panHash");
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProfile_aadhaarHash_key" ON "AffiliateProfile"("aadhaarHash");

-- Click consent/bot flags
ALTER TABLE "Click"
  ADD COLUMN "consentGiven" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "botFlags" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskScore" DECIMAL(6,2);

-- Commission ledger grace window
ALTER TABLE "CommissionLedger"
  ADD COLUMN "graceUntil" TIMESTAMP(3);

-- Payout batch provider/reconciliation metadata
ALTER TABLE "PayoutBatch"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "providerBatchId" TEXT,
  ADD COLUMN "receiptUrl" TEXT,
  ADD COLUMN "reconciledAt" TIMESTAMP(3);

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS "FraudAlert" (
  "id" TEXT NOT NULL,
  "affiliateId" TEXT NOT NULL,
  "orderId" TEXT,
  "clickId" TEXT,
  "riskScore" DECIMAL(5,2) NOT NULL,
  "type" TEXT NOT NULL,
  "details" JSONB,
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FraudAlert_affiliateId_status_createdAt_idx" ON "FraudAlert"("affiliateId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "FraudAlert_orderId_idx" ON "FraudAlert"("orderId");
CREATE INDEX IF NOT EXISTS "FraudAlert_clickId_idx" ON "FraudAlert"("clickId");

ALTER TABLE "FraudAlert"
  ADD CONSTRAINT "FraudAlert_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FraudAlert"
  ADD CONSTRAINT "FraudAlert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FraudAlert"
  ADD CONSTRAINT "FraudAlert_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "Click"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FraudAlert"
  ADD CONSTRAINT "FraudAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
