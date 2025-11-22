import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { CatalogService } from '../services/catalog.service';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';

@Controller('products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @Public()
  findAll(@Query() query: GetProductsQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }
}
