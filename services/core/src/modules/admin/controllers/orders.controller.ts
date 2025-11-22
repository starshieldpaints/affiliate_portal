import { Controller, Get, Param, Patch, Post, Body, Query } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';

@Controller('admin/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('risk') risk?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.ordersService.list({
      search,
      status,
      risk,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { status?: string; attribution?: { ruleId?: string; manualOverride?: boolean } }
  ) {
    return this.ordersService.update(id, {
      status: body.status as any,
      attribution: body.attribution as any
    });
  }

  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() body: { amount: number; reason: string }) {
    return this.ordersService.refund(id, body.amount, body.reason);
  }
}
