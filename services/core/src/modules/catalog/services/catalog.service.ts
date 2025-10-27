import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    if (products.length > 0) {
      return products;
    }

    return [
      {
        id: 'sample-helmet',
        name: 'StarShield Elite Helmet',
        price: 249,
        currency: 'USD',
        description:
          'Flagship impact-resistant helmet engineered for tactical visibility and comfort.',
        imageUrl: 'https://images.unsplash.com/photo-1612810806695-30ba0b5c7c2e?w=640&q=80'
      },
      {
        id: 'sample-visor',
        name: 'Photon Filter Visor',
        price: 189,
        currency: 'USD',
        description: 'Adaptive visor with anti-glare photon filtering technology.',
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=640&q=80'
      }
    ];
  }
}
