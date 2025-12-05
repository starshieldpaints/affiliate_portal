import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing old product data...");

  await prisma.payoutLine.deleteMany({});
  await prisma.commissionLedger.deleteMany({});
  await prisma.commissionRuleScope.deleteMany({});
  await prisma.commissionRule.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.refundEvent.deleteMany({});
  await prisma.attribution.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.click.deleteMany({});
  await prisma.affiliateLink.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.payoutBatch.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.verificationCode.deleteMany({});
  await prisma.fraudAlert.deleteMany({});
  await prisma.auditLog.deleteMany({});

  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("🧹 Old data cleared. Seeding fresh data...");
  console.log("🌱 Starting product seed...");

  const filePath = path.join(__dirname, "product.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);

  if (!json.catalog || !Array.isArray(json.catalog)) {
    throw new Error("❌ product.json must contain a 'catalog' array.");
  }

  const catalog = json.catalog;

  for (const categoryGroup of catalog) {
    const { category, products } = categoryGroup;

    if (!category || !Array.isArray(products)) {
      console.log(`⏭️ Skipping category group (invalid structure):`, categoryGroup);
      continue;
    }

    const categoryRecord = await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: {
        name: category,
        description: category
      }
    });

    for (const p of products) {
      if (!p.id || !p.name || !p.serialNumber || !p.landingUrl || !p.hsn
      ) {
        console.log(`⏭️ Skipping product (missing required fields or landingUrl):`, {
          id: p.id,
          name: p.name,
          serialNumber: p.serialNumber,
          landingUrl: p.landingUrl
        });
        continue;
      }

      const productSku = p.id.toUpperCase();

      const productRecord = await prisma.product.upsert({
        where: { externalProductId: p.id },
        update: {
          name: p.name,
          sku: productSku, // 👈 FIX APPLIED HERE
          hsn: p.hsn || null,
          description: p.description || null,
          imageUrl: p.imageUrl || null,
          landingUrl: p.landingUrl,
          serialNumber: p.serialNumber,
          categoryId: categoryRecord.id
        },
        create: {
          externalProductId: p.id,
          name: p.name,
          sku: productSku, // 👈 FIX APPLIED HERE
          hsn: p.hsn || null,
          description: p.description || null,
          imageUrl: p.imageUrl || null,
          landingUrl: p.landingUrl,
          serialNumber: p.serialNumber,
          categoryId: categoryRecord.id
        }
      });

      // Validate variants
      if (!p.variants || !Array.isArray(p.variants)) {
        console.log(`⏭️ No valid variants for product ${p.id}`);
        continue;
      }

      const usableVariants = p.variants.filter((v: any) => {
        if (!v.volume || !v.mrp || !v.promoPrice) return false;
        if (isNaN(Number(v.mrp)) || isNaN(Number(v.promoPrice))) return false;
        return true;
      });

      if (usableVariants.length === 0) {
        console.log(`⏭️ Skipping product ${p.id} (no usable variants)`);
        continue;
      }

      for (const variant of usableVariants) {
        // 🔑 Corrected Variant SKU logic: PRODUCT_ID-VOLUME_SLUG (e.g., STAR-COOL-SHIELD-1LTR)
        const variantVolumeSlug = variant.volume.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const sku = `${productSku}-${variantVolumeSlug}`; // Use the productSku variable

        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            volume: variant.volume,
            mrp: variant.mrp,
            promoPrice: variant.promoPrice,
            dpl: variant.dpl || null,
            imageUrl: p.imageUrl || null,
            landingUrl: p.landingUrl
          },
          create: {
            sku,
            productId: productRecord.id,
            volume: variant.volume,
            mrp: variant.mrp,
            promoPrice: variant.promoPrice,
            dpl: variant.dpl || null,
            imageUrl: p.imageUrl || null,
            landingUrl: p.landingUrl
          }
        });
      }
    }
  }

  console.log("🌱 Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });