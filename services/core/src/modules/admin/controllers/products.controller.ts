import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AdminProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  list(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string
  ) {
    this.ensureAdmin(req);
    return this.products.list({ search, categoryId });
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductDto) {
    this.ensureAdmin(req);
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    this.ensureAdmin(req);
    return this.products.update(id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.products.remove(id);
  }

  private ensureAdmin(req: AuthenticatedRequest) {
    if (!req.user || req.user.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
  }
}
