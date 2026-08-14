/**
 * @fileoverview 借贷记账扩展包独立前端入口（开发用）
 */

import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import type { FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend'
import { MfwLedgerPage } from './index'

const menuTrees: FrontendAppTypeMenuConfig[] = [
  {
    appTypeCode: 'ledger',
    label: '借贷记账管理',
    icon: 'Wallet',
    children: [
      {
        path: 'ledger',
        name: '借贷记账管理',
        icon: 'Wallet',
        permissions: ['审核', '冲正', '对账'],
        component: MfwLedgerPage,
      },
    ],
  },
]

const app = createExtensionFrontendApp({
  name: '借贷记账管理',
  menuTrees,
})

app.mount('#app')
