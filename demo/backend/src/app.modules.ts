import { Module } from "@nestjs/common";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import AdModule from "moyan-mfw-extension-ad/backend";
import { ConfigModule } from "moyan-mfw-extension-config/backend";
import { DocumentModule } from "moyan-mfw-extension-document/backend";
import { DemoLedgerModule } from "./modules/ledger-demo/demo-ledger.module";
import { DemoSchedulerModule } from "./modules/scheduler/demo-scheduler.module";
import { DemoSmsModule } from "./modules/sms-demo/demo-sms.module";
import { DemoScanCodeModule } from "./modules/scan-code-demo/demo-scan-code.module";

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
    // 短信扩展：验证码发送/校验演示 + 配置页面接口（/api/ext/sms/config/*）
    DemoSmsModule,
    // 扫码扩展：生成→解析→核销演示 + 配置页面接口（/api/ext/scan-code/config/*）
    DemoScanCodeModule,
  ],
})
export class AppModule {}