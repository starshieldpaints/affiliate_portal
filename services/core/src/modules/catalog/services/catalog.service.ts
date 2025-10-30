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
        imageUrl: 'https://placehold.co/640x384/png?text=Elite+Helmet'
      },
      {
        id: 'sample-visor',
        name: 'Photon Filter Visor',
        price: 189,
        currency: 'USD',
        description: 'Adaptive visor with anti-glare photon filtering technology.',
        imageUrl: 'https://placehold.co/640x384/png?text=Photon+Visor'
      }
    ];
  }
}
