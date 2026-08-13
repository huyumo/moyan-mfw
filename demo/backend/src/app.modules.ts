import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import AdModule from "moyan-mfw-extension-ad/backend";
import { ConfigModule } from "moyan-mfw-extension-config/backend";
import { DocumentModule } from "moyan-mfw-extension-document/backend";
import { DemoSchedulerModule } from "./modules/scheduler/demo-scheduler.module";

@Module({
  imports: [
    SupplierModule,
    MerchantModule,
    AdModule,
    ConfigModule,
    DocumentModule,
    DemoSchedulerModule,
  ],
})
export class AppModule {}