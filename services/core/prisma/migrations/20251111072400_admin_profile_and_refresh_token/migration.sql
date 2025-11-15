/*
  Warnings:

  - The `kycStatus` column on the `AffiliateProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `CommissionLedger` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentStatus` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PayoutBatch` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PayoutLine` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `twofaEnabled` on the `User` table. All the data in the column will be lost.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[code]` on the table `AffiliateLink` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commissionRuleId,productId,categoryId,affiliateId,country]` on the table `CommissionRuleScope` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalLineItemId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'disabled');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'canceled');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'rejected', 'reversed');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('open', 'processing', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "PayoutLineStatus" AS ENUM ('pending', 'queued', 'processing', 'paid', 'failed');

-- DropForeignKey
ALTER TABLE "AffiliateLink" DROP CONSTRAINT "AffiliateLink_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateProfile" DROP CONSTRAINT "AffiliateProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Attribution" DROP CONSTRAINT "Attribution_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_affiliateLinkId_fkey";

-- DropForeignKey
ALTER TABLE "CommissionRuleScope" DROP CONSTRAINT "CommissionRuleScope_commissionRuleId_fkey";

-- DropForeignKey
ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- AlterTable
ALTER TABLE "AffiliateLink" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AffiliateProfile" ADD COLUMN     "deletedAt" TIMESTAMP(3),
DROP COLUMN "kycStatus",
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "CommissionLedger" DROP COLUMN "status",
ADD COLUMN     "status" "CommissionStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'paid';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "externalLineItemId" TEXT;

-- AlterTable
ALTER TABLE "PayoutBatch" DROP COLUMN "status",
ADD COLUMN     "status" "PayoutBatchStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "PayoutLine" DROP COLUMN "status",
ADD COLUMN     "status" "PayoutLineStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "twofaEnabled",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "permissions" JSONB,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByToken" TEXT,
    "createdByIp" TEXT,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_code_key" ON "AffiliateLink"("code");

-- CreateIndex
CREATE INDEX "AffiliateLink_affiliateId_isActive_idx" ON "AffiliateLink"("affiliateId", "isActive");

-- CreateIndex
CREATE INDEX "AffiliateLink_affiliateId_createdAt_idx" ON "AffiliateLink"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "Attribution_affiliateId_decidedAt_idx" ON "Attribution"("affiliateId", "decidedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Click_affiliateLinkId_clickedAt_idx" ON "Click"("affiliateLinkId", "clickedAt");

-- CreateIndex
CREATE INDEX "Click_cookieId_clickedAt_idx" ON "Click"("cookieId", "clickedAt");

-- CreateIndex
CREATE INDEX "CommissionLedger_affiliateId_status_createdAt_idx" ON "CommissionLedger"("affiliateId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionLedger_orderId_idx" ON "CommissionLedger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRuleScope_commissionRuleId_productId_categoryId_a_key" ON "CommissionRuleScope"("commissionRuleId", "productId", "categoryId", "affiliateId", "country");

-- CreateIndex
CREATE INDEX "Coupon_affiliateId_isActive_idx" ON "Coupon"("affiliateId", "isActive");

-- CreateIndex
CREATE INDEX "Order_storeId_placedAt_idx" ON "Order"("storeId", "placedAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_placedAt_idx" ON "Order"("paymentStatus", "placedAt");

-- CreateIndex
CREATE INDEX "Order_customerHash_placedAt_idx" ON "Order"("customerHash", "placedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_externalLineItemId_key" ON "OrderItem"("externalLineItemId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "PayoutLine_affiliateId_createdAt_idx" ON "PayoutLine"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutLine_batchId_idx" ON "PayoutLine"("batchId");

-- CreateIndex
CREATE INDEX "RefundEvent_orderId_idx" ON "RefundEvent"("orderId");

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "AffiliateLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRuleScope" ADD CONSTRAINT "CommissionRuleScope_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "CommissionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
