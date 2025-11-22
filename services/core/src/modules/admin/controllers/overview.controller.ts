import { Controller, Get } from '@nestjs/common';
import { OverviewService } from '../services/overview.service';

@Controller('admin/overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  async getOverview() {
    return this.overviewService.getOverview();
  }
}
