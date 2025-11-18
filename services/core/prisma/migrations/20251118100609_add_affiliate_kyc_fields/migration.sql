/*
  Note: we retain any existing generic `taxId` value by moving it into the new `panNumber` column.
*/
-- AlterTable
ALTER TABLE "AffiliateProfile"
    ADD COLUMN     "aadhaarBackUrl" TEXT,
    ADD COLUMN     "aadhaarFrontUrl" TEXT,
    ADD COLUMN     "aadhaarNumber" TEXT NOT NULL DEFAULT '',
    ADD COLUMN     "panImageUrl" TEXT,
    ADD COLUMN     "panNumber" TEXT NOT NULL DEFAULT '';

-- Backfill the newly required identifiers so existing rows remain valid
UPDATE "AffiliateProfile"
SET "panNumber" = COALESCE("taxId", '');

UPDATE "AffiliateProfile"
SET "aadhaarNumber" = ''
WHERE "aadhaarNumber" IS NULL;

-- Clean up defaults so Prisma schema (which has no defaults) stays in sync
ALTER TABLE "AffiliateProfile"
    ALTER COLUMN "aadhaarNumber" DROP DEFAULT,
    ALTER COLUMN "panNumber" DROP DEFAULT,
    DROP COLUMN "taxId";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "currency" SET DEFAULT 'INR';
