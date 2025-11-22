import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionRulesService } from './services/commission-rules.service';
import { CommissionRulesController } from './controllers/commission-rules.controller';
import { AdminProductsService } from './services/products.service';
import { AdminProductsController } from './controllers/products.controller';
import { OverviewService } from './services/overview.service';
import { OverviewController } from './controllers/overview.controller';
import { AdminAuthController } from './controllers/auth.controller';
import { AdminAuthService } from './services/auth.service';
import { AffiliatesController } from './controllers/affiliates.controller';
import { AffiliatesService } from './services/affiliates.service';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { PayoutsController } from './controllers/payouts.controller';
import { PayoutsService } from './services/payouts.service';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { FraudController } from './controllers/fraud.controller';
import { FraudService } from './services/fraud.service';
import { AuditController } from './controllers/audit.controller';
import { AuditService } from './services/audit.service';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminAuthController,
    AdminController,
    AffiliatesController,
    CommissionRulesController,
    AdminProductsController,
    OrdersController,
    PayoutsController,
    ReportsController,
    FraudController,
    AuditController,
    HealthController,
    OverviewController
  ],
  providers: [
    AdminAuthService,
    AdminService,
    AffiliatesService,
    CommissionRulesService,
    AdminProductsService,
    OrdersService,
    PayoutsService,
    ReportsService,
    FraudService,
    AuditService,
    OverviewService
  ]
})
export class AdminModule {}
