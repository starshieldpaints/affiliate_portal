import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionRulesService } from './services/commission-rules.service';
import { CommissionRulesController } from './controllers/commission-rules.controller';
import { AdminProductsService } from './services/products.service';
import { AdminProductsController } from './controllers/products.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, CommissionRulesController, AdminProductsController],
  providers: [AdminService, CommissionRulesService, AdminProductsService]
})
export class AdminModule {}
