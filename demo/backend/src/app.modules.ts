import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import AdModule from "moyan-mfw-extension-ad/backend";
import { ConfigModule } from "moyan-mfw-extension-config/backend";
import { DocumentModule } from "moyan-mfw-extension-document/backend";
import { DemoLedgerModule } from "./modules/ledger-demo/demo-ledger.module";
import { DemoSchedulerModule } from "./modules/scheduler/demo-scheduler.module";

@Module({
  imports: [
    SupplierModule,
    MerchantModule,
    AdModule,
    ConfigModule,
    DocumentModule,
    // 借贷记账扩展：完整 SPI 调用用例（5 个 SPI 自定义实现 + 账户实体扩展 + 业务服务），见 modules/ledger-demo/
    DemoLedgerModule,
    DemoSchedulerModule,
  ],
})
export class AppModule {}