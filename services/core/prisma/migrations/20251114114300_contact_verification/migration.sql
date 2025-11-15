-- CreateEnum
CREATE TYPE "VerificationTarget" AS ENUM ('email', 'phone');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

ALTER TABLE "AffiliateProfile"
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- Normalize existing phone numbers to remove whitespace for consistent matching
UPDATE "AffiliateProfile"
SET "phone" = regexp_replace("phone", '\s+', '', 'g')
WHERE "phone" IS NOT NULL;

-- Backfill verification timestamps for existing records so legacy users remain active
UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW());

UPDATE "AffiliateProfile"
SET "phoneVerifiedAt" =
  CASE
    WHEN "phone" IS NULL THEN NULL
    ELSE COALESCE("phoneVerifiedAt", NOW())
  END;

-- Ensure phone uniqueness when present
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateProfile_phone_key" ON "AffiliateProfile" ("phone");

-- CreateTable
CREATE TABLE "VerificationCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetType" "VerificationTarget" NOT NULL,
  "targetValue" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "channel" TEXT,
  CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VerificationCode_userId_targetType_idx" ON "VerificationCode" ("userId", "targetType");

CREATE INDEX "VerificationCode_targetType_targetValue_idx" ON "VerificationCode" ("targetType", "targetValue");
