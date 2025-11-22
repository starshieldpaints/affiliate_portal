import { Controller, Get, Param, Patch, Post, Body, Query } from '@nestjs/common';
import { AffiliatesService } from '../services/affiliates.service';

@Controller('admin/affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('country') country?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.affiliatesService.list({
      search,
      status,
      kycStatus,
      country,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.affiliatesService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.affiliatesService.update(id, body);
  }

  @Post(':id/kyc')
  decide(@Param('id') id: string, @Body() body: { decision: 'approve' | 'reject'; reason?: string }) {
    return this.affiliatesService.decideKyc(id, body.decision, body.reason);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: { message: string }) {
    return this.affiliatesService.addNote(id, body.message);
  }
}
