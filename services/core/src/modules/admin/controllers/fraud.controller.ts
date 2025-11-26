import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { FraudService } from '../services/fraud.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ResolveFraudAlertDto } from '../dto/fraud.dto';

@Controller('admin/fraud/alerts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.fraudService.list({ status, type, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.fraudService.get(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Req() req: any, @Body() body: ResolveFraudAlertDto) {
    return this.fraudService.resolve(id, req.user?.id, body.notes);
  }
}
