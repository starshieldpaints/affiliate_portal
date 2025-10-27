import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '../services/catalog.service';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  findAll() {
    return this.catalogService.findAll();
  }
}
