<!--
/**
 * @fileoverview 借贷记账管理页面
 * @description 五视图容器：账本管理 / 交易单 / 分录流水 / 冲正记录 / 对账报告
 */
-->
<template>
  <MfwPageWrapper>
    <el-tabs v-model="activeTab" class="ledger-tabs">
      <el-tab-pane label="账本管理" name="accounts" lazy>
        <AccountTab  />
      </el-tab-pane>
      <el-tab-pane label="交易单" name="transfers" lazy>
        <TransferTab  />
      </el-tab-pane>
      <el-tab-pane label="分录流水" name="entries" lazy>
        <EntryTab  />
      </el-tab-pane>
      <el-tab-pane label="冲正记录" name="reversals" lazy>
        <ReversalTab  />
      </el-tab-pane>
      <el-tab-pane label="对账报告" name="reconcile" lazy>
        <ReconcileTab  />
      </el-tab-pane>
    </el-tabs>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AccountTab from './AccountTab.vue'
import TransferTab from './TransferTab.vue'
import EntryTab from './EntryTab.vue'
import ReversalTab from './ReversalTab.vue'
import ReconcileTab from './ReconcileTab.vue'
import { MfwPageWrapper } from 'moyan-mfw-base/frontend'
import { registerBizTypeExtMeta } from './shared'
import { ApiLedgerGetBizTypeMetas } from '../../apis/ledger'

defineOptions({ name: 'MfwLedgerPage' })

const activeTab = ref('accounts')

/**
 * 业务类型展示元数据由服务端下发（forRoot({ bizTypeMetas }) → GET /api/ext/ledger/biz-types），
 * 前端零配置；本地 registerBizTypeExtMeta 仍可作为补充/覆盖能力
 */
onMounted(async () => {
  try {
    const res = await new ApiLedgerGetBizTypeMetas({})
    if (res && typeof res === 'object') {
      registerBizTypeExtMeta(res as Record<string, any>)
    }
  } catch (err) {
    console.error('加载业务类型展示元数据失败（列表扩展列/搜索项不可用）:', err)
  }
})
</script>

<style scoped>
.ledger-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ledger-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  min-height: 0;
}
.ledger-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
