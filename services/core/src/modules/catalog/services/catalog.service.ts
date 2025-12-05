// import { Injectable } from '@nestjs/common';
// import { Prisma } from '@prisma/client';
// import { PrismaService } from '../../prisma/prisma.service';
// import { GetProductsQueryDto } from '../dto/get-products-query.dto';

// @Injectable()
// export class CatalogService {
//   constructor(private readonly prisma: PrismaService) {}

//   async findAll(query: GetProductsQueryDto) {
//     const page = query.page ?? 1;
//     const pageSize = query.pageSize ?? 20;
//     const skip = (page - 1) * pageSize;
//     const where: Prisma.ProductWhereInput = {};
//     if (query.categoryId) {
//       where.categoryId = query.categoryId.trim();
//     }

//     const [total, products, categories] = await this.prisma.$transaction([
//       this.prisma.product.count({ where }),
//       this.prisma.product.findMany({
//         skip,
//         take: pageSize,
//         where,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           category: {
//             select: {
//               id: true,
//               name: true,
//               description: true
//             }
//           }
//         }
//       }),
//       this.prisma.category.findMany({
//         select: { id: true, name: true, description: true },
//         orderBy: { name: 'asc' }
//       })
//     ]);

//     if (total === 0) {
//       const data =
//         query.categoryId && query.categoryId.trim().length > 0
//           ? fallbackProducts.filter((product) => product.categoryId === query.categoryId)
//           : fallbackProducts;
//       return {
//         data,
//         meta: {
//           page: 1,
//           pageSize: data.length,
//           total: data.length,
//           totalPages: 1,
//           hasNextPage: false
//         },
//         filters: {
//           categories: Object.values(fallbackCategories)
//         }
//       };
//     }

//     const normalized = products.map((product) => ({
//       id: product.id,
//       name: product.name,
//       description: product.description,
//       price: Number(product.price),
//       currency: product.currency,
//       landingUrl: product.landingUrl ?? '#',
//       imageUrl: product.imageUrl,
//       sku: product.sku ?? product.id,
//       externalProductId: product.externalProductId ?? product.id,
//       categoryId: product.categoryId,
//       category: product.category
//         ? {
//             id: product.category.id,
//             name: product.category.name,
//             description: product.category.description
//           }
//         : null
//     }));

//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     return {
//       data: normalized,
//       meta: {
//         page,
//         pageSize,
//         total,
//         totalPages,
//         hasNextPage: page < totalPages
//       },
//       filters: {
//         categories: categories.map((category) => ({
//           id: category.id,
//           name: category.name,
//           description: category.description
//         }))
//       }
//     };
//   }

//   async findOne(id: string) {
//     const product = await this.prisma.product.findUnique({
//       where: { id },
//       include: {
//         category: {
//           select: {
//             id: true,
//             name: true,
//             description: true
//           }
//         }
//       }
//     });

//     if (!product) {
//       return { product: null, variants: [] };
//     }

//     const baseName = this.deriveBaseName(product.name);
//     const variants = await this.prisma.product.findMany({
//       where: {
//         OR: [{ categoryId: product.categoryId }, { name: { contains: baseName, mode: 'insensitive' } }]
//       },
//       select: {
//         id: true,
//         name: true,
//         price: true,
//         currency: true,
//         sku: true,
//         imageUrl: true
//       },
//       orderBy: { price: 'asc' },
//       take: 8
//     });

//     return {
//       product: {
//         id: product.id,
//         name: product.name,
//         description: product.description,
//         price: Number(product.price),
//         currency: product.currency,
//         landingUrl: product.landingUrl ?? '#',
//         imageUrl: product.imageUrl,
//         sku: product.sku ?? product.id,
//         externalProductId: product.externalProductId ?? product.id,
//         categoryId: product.categoryId,
//         category: product.category
//           ? {
//               id: product.category.id,
//               name: product.category.name,
//               description: product.category.description
//             }
//           : null
//       },
//       variants: variants.map((variant) => ({
//         id: variant.id,
//         name: variant.name,
//         price: Number(variant.price),
//         currency: variant.currency,
//         sku: variant.sku ?? variant.id,
//         imageUrl: variant.imageUrl
//       }))
//     };
//   }

//   private deriveBaseName(name: string) {
//     if (!name) return '';
//     return name.replace(/\s*[-(]?\s*\d+(\.\d+)?\s*(ltr|l|kg|ml|g)\s*[)]?/gi, '').trim();
//   }
// }

// const fallbackCategories = {
//   protectiveGear: { id: 'protective-gear', name: 'Protective Gear', description: null },
//   optics: { id: 'optics', name: 'Optics', description: null },
//   apparel: { id: 'apparel', name: 'Apparel', description: null },
//   accessories: { id: 'accessories', name: 'Accessories', description: null },
//   systems: { id: 'systems', name: 'Systems', description: null }
// } as const;

// const fallbackProducts = [
//   {
//     id: 'sample-helmet',
//     name: 'StarShield Elite Helmet',
//     description:
//       'Flagship impact-resistant helmet engineered for tactical visibility and comfort.',
//     price: 249,
//     currency: 'USD',
//     landingUrl: 'https://starshield.io/p/elite-helmet',
//     imageUrl: 'https://placehold.co/640x384/png?text=Elite+Helmet',
//     sku: 'SSH-ELT-01',
//     externalProductId: 'sample-helmet',
//     categoryId: fallbackCategories.protectiveGear.id,
//     category: fallbackCategories.protectiveGear
//   },
//   {
//     id: 'sample-visor',
//     name: 'Photon Filter Visor',
//     description: 'Adaptive visor with anti-glare photon filtering technology.',
//     price: 189,
//     currency: 'USD',
//     landingUrl: 'https://starshield.io/p/photon-visor',
//     imageUrl: 'https://placehold.co/640x384/png?text=Photon+Visor',
//     sku: 'SSV-PHN-14',
//     externalProductId: 'sample-visor',
//     categoryId: fallbackCategories.optics.id,
//     category: fallbackCategories.optics
//   }
// ];



import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product as PrismaProduct } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';

// --- TYPE DEFINITIONS ---

// 1. Structure for Category (Prisma Relation)
type CategoryRelation = { id: string; name: string; description: string | null };

// 2. Structure for Variant (Prisma Relation with Decimals)
type VariantPriceRelation = {
  id: string;
  sku: string | null;
  volume: string | null;
  promoPrice: Prisma.Decimal | null;
  mrp: Prisma.Decimal | null;
  dpl: Prisma.Decimal | null;
  imageUrl: string | null;
  landingUrl: string | null;
  isActive: boolean;
};

// 3. Interface for findAll result (Subset of fields needed for list view)
interface ProductForCatalog extends PrismaProduct {
  variants: { promoPrice: Prisma.Decimal | null; mrp: Prisma.Decimal | null }[];
  category: CategoryRelation | null;
}

// 4. Interface for findOne result (Full fields needed for detail view)
interface ProductWithFullRelations extends PrismaProduct {
  variants: VariantPriceRelation[];
  category: CategoryRelation | null;
}

// --- HELPER FUNCTIONS ---

/**
 * Calculates the lowest price.
 * FIX: Type definition relaxed to only require 'variants', resolving TS2345.
 */
const getMinCatalogPrice = (product: { variants: { promoPrice: Prisma.Decimal | null; mrp: Prisma.Decimal | null }[] }): number => {
  const prices = product.variants
    ?.map(variant => {
      const promo = variant.promoPrice ? Number(variant.promoPrice) : Infinity;
      const mrp = variant.mrp ? Number(variant.mrp) : Infinity;
      return Math.min(promo, mrp);
    })
    .filter(price => price !== Infinity);

  return (!prices || prices.length === 0) ? 0 : Math.min(...prices);
};

/**
 * Normalizes variants for the single product view.
 */
const normalizeVariantDetails = (variants: VariantPriceRelation[]) => {
  return variants.map(v => ({
    id: v.id,
    sku: v.sku,
    volume: v.volume,
    // CRITICAL: Explicitly convert Decimal to Number
    mrp: v.mrp ? Number(v.mrp) : null,
    promoPrice: v.promoPrice ? Number(v.promoPrice) : null,
    dpl: v.dpl ? Number(v.dpl) : null,
    imageUrl: v.imageUrl,
    landingUrl: v.landingUrl,
    isActive: v.isActive,
  }));
};

// --------------------------------------------------------------------------------------
// --- CATALOG SERVICE ---
// --------------------------------------------------------------------------------------

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: GetProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const categoryFilter: Prisma.ProductWhereInput = query.categoryId?.trim()
      ? { categoryId: query.categoryId.trim() }
      : {};

    const [total, productsRaw, categories] = await this.prisma.$transaction([
      this.prisma.product.count({ where: categoryFilter }),

      this.prisma.product.findMany({
        skip,
        take: pageSize,
        where: categoryFilter,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, description: true } },
          // Only select what we need for price calculation to keep it light
          variants: { select: { promoPrice: true, mrp: true } }
        }
      }),

      this.prisma.category.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' }
      })
    ]);

    // 🔑 FIX: Cast the raw result to our interface so TypeScript knows 'category' and 'variants' exist
    const products = productsRaw as unknown as ProductForCatalog[];

    const normalizedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,

      // Now TS knows 'product' matches the shape expected by getMinCatalogPrice
      price: getMinCatalogPrice(product),

      currency: product.currency,
      landingUrl: product.landingUrl ?? '#',
      imageUrl: product.imageUrl,
      sku: product.sku ?? product.id,
      externalProductId: product.externalProductId ?? product.id,
      categoryId: product.categoryId,

      // Safe access to category
      category: product.category
        ? {
          id: product.category.id,
          name: product.category.name,
          description: product.category.description
        }
        : null,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data: normalizedProducts,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages
      },
      filters: {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description
        }))
      }
    };
  }

  // async findOne(id: string) {
  //   const productRaw = await this.prisma.product.findUnique({
  //     where: { id },
  //     include: {
  //       category: { select: { id: true, name: true, description: true } },
  //       variants: true // Include all variant fields
  //     }
  //   });

  //   if (!productRaw) {
  //     throw new NotFoundException(`Product with ID ${id} not found.`);
  //   }

  //   // 🔑 FIX: Cast to full interface to access variants safely
  //   const product = productRaw as unknown as ProductWithFullRelations;

  //   // Normalize variants (converts Decimals to Numbers)
  //   const normalizedVariants = normalizeVariantDetails(product.variants);

  //   return {
  //     product: {
  //       id: product.id,
  //       name: product.name,
  //       description: product.description,
  //       price: getMinCatalogPrice(product),
  //       currency: product.currency,
  //       landingUrl: product.landingUrl ?? '#',
  //       imageUrl: product.imageUrl,
  //       sku: product.sku ?? product.id,
  //       externalProductId: product.externalProductId ?? product.id,
  //       categoryId: product.categoryId,
  //       category: product.category
  //         ? {
  //           id: product.category.id,
  //           name: product.category.name,
  //           description: product.category.description
  //         }
  //         : null
  //     },
  //     variants: normalizedVariants
  //   };
  // }



  async findOne(id: string) {
    // 1. First, try to find the Product directly (Standard Case)
    let productRaw = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        variants: true
      }
    });

    // 2. If not found, check if the ID actually belongs to a Variant (Variant Click Case)
    if (!productRaw) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id },
        select: { productId: true }
      });

      if (variant) {
        // Found it! It was a variant ID. Now fetch the actual parent product.
        productRaw = await this.prisma.product.findUnique({
          where: { id: variant.productId },
          include: {
            category: { select: { id: true, name: true, description: true } },
            variants: true
          }
        });
      }
    }

    // 3. If still not found, then it truly doesn't exist
    if (!productRaw) {
      throw new NotFoundException(`Product or Variant with ID ${id} not found.`);
    }

    // --- (Rest of logic remains exactly the same) ---

    // Cast to full interface to satisfy TypeScript
    const product = productRaw as unknown as ProductWithFullRelations;

    // Normalize variants
    const normalizedVariants = normalizeVariantDetails(product.variants);

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: getMinCatalogPrice(product),
        currency: product.currency,
        landingUrl: product.landingUrl ?? '#',
        imageUrl: product.imageUrl,
        sku: product.sku ?? product.id,
        externalProductId: product.externalProductId ?? product.id,
        categoryId: product.categoryId,
        category: product.category
          ? {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description
          }
          : null
      },
      variants: normalizedVariants
    };
  }
}