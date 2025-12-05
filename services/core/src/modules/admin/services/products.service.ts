// import { Injectable, NotFoundException } from '@nestjs/common';
// import { Prisma } from '@prisma/client';
// import { PrismaService } from '../../prisma/prisma.service';
// import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

// @Injectable()
// export class AdminProductsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async list(params?: { search?: string; categoryId?: string | null; take?: number }) {
//     const take = Math.min(Math.max(params?.take ?? 50, 1), 200);
//     const where: Prisma.ProductWhereInput = {};

//     if (params?.categoryId) {
//       where.categoryId = params.categoryId;
//     }

//     if (params?.search?.trim()) {
//       const term = params.search.trim();
//       where.OR = [
//         { name: { contains: term, mode: 'insensitive' } },
//         { sku: { contains: term, mode: 'insensitive' } }
//       ];
//     }

//     const [records, total] = await this.prisma.$transaction([
//       this.prisma.product.findMany({
//         where,
//         take,
//         orderBy: { createdAt: 'desc' },
//         include: {
//           category: { select: { id: true, name: true } }
//         }
//       }),
//       this.prisma.product.count({ where })
//     ]);

//     return {
//       data: records.map((product) => ({
//         id: product.id,
//         name: product.name,
//         description: product.description,
//         price: Number(product.price),
//         currency: product.currency,
//         landingUrl: product.landingUrl,
//         imageUrl: product.imageUrl,
//         sku: product.sku,
//         isActive: product.isActive,
//         categoryId: product.categoryId,
//         category: product.category
//           ? { id: product.category.id, name: product.category.name }
//           : null
//       })),
//       meta: {
//         total,
//         take
//       }
//     };
//   }

//   async create(dto: CreateProductDto) {
//     const created = await this.prisma.product.create({
//       data: {
//         name: dto.name,
//         description: dto.description ?? null,
//         price: new Prisma.Decimal(dto.price),
//         currency: dto.currency.toUpperCase(),
//         categoryId: dto.categoryId ?? null,
//         sku: dto.sku ?? null,
//         landingUrl: dto.landingUrl ?? null,
//         imageUrl: dto.imageUrl ?? null,
//         isActive: dto.isActive ?? true
//       },
//       include: {
//         category: { select: { id: true, name: true } }
//       }
//     });
//     return created;
//   }

//   async update(id: string, dto: UpdateProductDto) {
//     const existing = await this.prisma.product.findUnique({ where: { id } });
//     if (!existing) {
//       throw new NotFoundException('Product not found');
//     }
//     const updated = await this.prisma.product.update({
//       where: { id },
//       data: {
//         name: dto.name ?? existing.name,
//         description: dto.description ?? existing.description,
//         price: dto.price ? new Prisma.Decimal(dto.price) : existing.price,
//         currency: dto.currency ? dto.currency.toUpperCase() : existing.currency,
//         categoryId:
//           dto.categoryId === undefined ? existing.categoryId : dto.categoryId ?? null,
//         sku: dto.sku ?? existing.sku,
//         landingUrl: dto.landingUrl ?? existing.landingUrl,
//         imageUrl: dto.imageUrl ?? existing.imageUrl,
//         isActive: dto.isActive ?? existing.isActive
//       },
//       include: {
//         category: { select: { id: true, name: true } }
//       }
//     });
//     return updated;
//   }

//   async remove(id: string) {
//     const existing = await this.prisma.product.findUnique({ where: { id } });
//     if (!existing) {
//       throw new NotFoundException('Product not found');
//     }
//     await this.prisma.product.delete({ where: { id } });
//     return { deleted: true };
//   }
// }












import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async list(params?: { search?: string; categoryId?: string | null; take?: number }) {
    const take = Math.min(Math.max(params?.take ?? 50, 1), 200);
    const where: Prisma.ProductWhereInput = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } }
      ];
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } }
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: records.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        // REMOVED: price: Number(product.price) -> 'price' does not exist on Product.
        // If you need price here, you must include 'variants' in the query above and calculate it.
        currency: product.currency,
        landingUrl: product.landingUrl,
        imageUrl: product.imageUrl,
        sku: product.sku,
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null
      })),
      meta: {
        total,
        take
      }
    };
  }

  async create(dto: CreateProductDto) {
    const created = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        // REMOVED: price -> 'price' does not exist on Product.
        // To add a price, you must create a ProductVariant.
        currency: dto.currency.toUpperCase(),
        categoryId: dto.categoryId ?? null,
        sku: dto.sku ?? null,
        landingUrl: dto.landingUrl ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true
      },
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return created;
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        // REMOVED: price -> 'price' does not exist on Product.
        currency: dto.currency ? dto.currency.toUpperCase() : existing.currency,
        categoryId:
          dto.categoryId === undefined ? existing.categoryId : dto.categoryId ?? null,
        sku: dto.sku ?? existing.sku,
        landingUrl: dto.landingUrl ?? existing.landingUrl,
        imageUrl: dto.imageUrl ?? existing.imageUrl,
        isActive: dto.isActive ?? existing.isActive
      },
      include: {
        category: { select: { id: true, name: true } }
      }
    });
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}