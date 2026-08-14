/**
 * @fileoverview 业务后端应用入口文件
 */

import {
  createBaseBackendApp,
  SwaggerGroupConfig,
} from "moyan-mfw-base/backend";
import { appTypesConfig } from "./app-types.config";
import { AppModule } from "./app.modules";
import { SupplierModule } from "./modules/supplier/supplier.module";
import { MerchantModule } from "./modules/merchant/merchant.module";
import {
  AdModule,
  AD_EXTENSION_PERMISSION_VALUES,
} from "moyan-mfw-extension-ad/backend";
import {
  DocumentModule,
  DOCUMENT_PERMISSION_VALUES,
} from "moyan-mfw-extension-document/backend";
import {
  SCHEDULER_EXTENSION_PERMISSION_VALUES,
} from "moyan-mfw-extension-scheduler/backend";
import {
  LEDGER_EXTENSION_PERMISSION_VALUES,
} from "moyan-mfw-extension-ledger/backend";
import { DemoLedgerModule } from "./modules/ledger-demo/demo-ledger.module";
import { DemoSchedulerModule } from "./modules/scheduler/demo-scheduler.module";
import "./permissions";

const swaggerGroups: SwaggerGroupConfig[] = [
  {
    name: "supplier",
    title: "供应商API文档",
    description: "供应商管理相关 API",
    include: [SupplierModule],
  },
  {
    name: "merchant",
    title: "商家管理API文档（SPI 示例）",
    description: "商家管理：演示业务层通过框架 SPI 同步应用/用户状态",
    include: [MerchantModule],
  },
  {
    name: "ad-extension",
    title: "广告管理API文档",
    description: "广告位类型、广告位、广告内容管理 API",
    include: [AdModule],
  },
  {
    name: "document-extension",
    title: "文档管理API文档",
    description: "通用文档管理（含 EAV 扩展字段）API",
    include: [DocumentModule],
  },
  {
    name: "scheduler-extension",
    title: "定时任务管理API文档",
    description: "Cron周期任务 + 延迟任务管理 API",
    include: [DemoSchedulerModule],
  },
  {
    name: "ledger-demo",
    title: "借贷记账SPI示例",
    description: "账本扩展包 5 个 SPI + 账户实体扩展 + 业务服务的完整调用用例",
    include: [DemoLedgerModule],
  },
];

async function bootstrap() {
  const app = await createBaseBackendApp({
    name: "墨焱业务后端",
    appTypes: appTypesConfig,
    syncAppTypes: true,
    modules: [AppModule],
    swagger: swaggerGroups,
    permissionValues: [
      ...AD_EXTENSION_PERMISSION_VALUES,
      ...DOCUMENT_PERMISSION_VALUES,
      ...SCHEDULER_EXTENSION_PERMISSION_VALUES,
      ...LEDGER_EXTENSION_PERMISSION_VALUES,
    ],
    hooks: {
      onAppInit: async (ctx) => {
        console.log("[Backend] 应用初始化完成");
      },
      // 演示：登录/注册前后钩子（HookConfig 已接通到 AuthService）
      beforeLogin: async (_ctx, credentials) => {
        console.log(`[钩子] 用户登录前: ${credentials?.username}`);
      },
      afterLogin: async (_ctx, user) => {
        console.log(`[钩子] 用户登录成功: ${user?.username}`);
      },
      afterRegister: async (_ctx, user) => {
        console.log(`[钩子] 新用户注册成功: ${user?.username}`);
      },
    },
  });

  await app.listen(Number(process.env.PORT) || 3000);
}

bootstrap();
