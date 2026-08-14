/**
 * @fileoverview 借贷记账扩展包独立后端入口（开发用）
 * @description 用于独立运行扩展包进行开发测试
 *
 * 注意：createExtensionBackendApp 不透传 permissionValues，独立启动时需手动注册
 */

import { createExtensionBackendApp } from 'moyan-mfw-base/backend'
import { registerPermissionValues } from 'moyan-mfw-base/backend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
import { LedgerModule } from './ledger.module'

async function bootstrap() {
  // 独立启动手动注册权限值
  registerPermissionValues([...LEDGER_EXTENSION_PERMISSION_VALUES])

  const app = await createExtensionBackendApp({
    name: 'ledger',
    module: LedgerModule,
    entities: [],
  })
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3002)
}

bootstrap()
