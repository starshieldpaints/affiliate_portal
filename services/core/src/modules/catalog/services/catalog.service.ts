import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ProductWhereInput = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId.trim();
    }

    const [total, products, categories] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      }),
      this.prisma.category.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' }
      })
    ]);

    if (total === 0) {
      const data =
        query.categoryId && query.categoryId.trim().length > 0
          ? fallbackProducts.filter((product) => product.categoryId === query.categoryId)
          : fallbackProducts;
      return {
        data,
        meta: {
          page: 1,
          pageSize: data.length,
          total: data.length,
          totalPages: 1,
          hasNextPage: false
        },
        filters: {
          categories: Object.values(fallbackCategories)
        }
      };
    }

    const normalized = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
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
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data: normalized,
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
}

const fallbackCategories = {
  protectiveGear: { id: 'protective-gear', name: 'Protective Gear', description: null },
  optics: { id: 'optics', name: 'Optics', description: null },
  apparel: { id: 'apparel', name: 'Apparel', description: null },
  accessories: { id: 'accessories', name: 'Accessories', description: null },
  systems: { id: 'systems', name: 'Systems', description: null }
} as const;

const fallbackProducts = [
  {
    id: 'sample-helmet',
    name: 'StarShield Elite Helmet',
    description:
      'Flagship impact-resistant helmet engineered for tactical visibility and comfort.',
    price: 249,
    currency: 'USD',
    landingUrl: 'https://starshield.io/p/elite-helmet',
    imageUrl: 'https://placehold.co/640x384/png?text=Elite+Helmet',
    sku: 'SSH-ELT-01',
    externalProductId: 'sample-helmet',
    categoryId: fallbackCategories.protectiveGear.id,
    category: fallbackCategories.protectiveGear
  },
  {
    id: 'sample-visor',
    name: 'Photon Filter Visor',
    description: 'Adaptive visor with anti-glare photon filtering technology.',
    price: 189,
    currency: 'USD',
    landingUrl: 'https://starshield.io/p/photon-visor',
    imageUrl: 'https://placehold.co/640x384/png?text=Photon+Visor',
    sku: 'SSV-PHN-14',
    externalProductId: 'sample-visor',
    categoryId: fallbackCategories.optics.id,
    category: fallbackCategories.optics
  }
];
