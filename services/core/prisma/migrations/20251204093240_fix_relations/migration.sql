/*
  Warnings:

  - You are about to drop the column `currency` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `landingUrl` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductVariant_sku_key";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "currency",
DROP COLUMN "imageUrl",
DROP COLUMN "landingUrl",
DROP COLUMN "name",
DROP COLUMN "sku";

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalProductId_key" ON "Product"("externalProductId");
