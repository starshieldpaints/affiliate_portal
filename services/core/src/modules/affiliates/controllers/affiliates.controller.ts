import { Controller, Get, Param } from '@nestjs/common';
import { AffiliatesService } from '../services/affiliates.service';

@Controller('admin/affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  findAll() {
    return this.affiliatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.affiliatesService.findOne(id);
  }
}
