<template>
  <section class="config-test-page">
    <h2>配置表单卡片测试</h2>
    <MfwConfigFormCard
      ref="formCardRef"
      group-key="test-group"
      :form-group="formGroup"
    />
    <div class="actions">
      <ElButton type="primary" @click="handleSave">保存配置</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import { MfwConfigFormCard } from 'moyan-mfw-extension-config/frontend';
import type { MfwConfigFormCardExpose, ConfigFormGroupConfig } from 'moyan-mfw-extension-config/frontend';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

const formCardRef = ref<MfwConfigFormCardExpose>();

const formGroup: ConfigFormGroupConfig = {
  type: 'el-tabs',
  groups: [
    {
      key: 'service_order',
      title: '客服与订单',
      template: [
        {
          key: 'customer_service_phone',
          label: '客服电话',
          type: 'input',
          configType: ConfigType.PUBLIC,
          elProps: { placeholder: '请输入客服电话' },
        },
      ],
    },
    {
      key: 'site_config',
      title: '站点配置',
      template: [
        {
          key: 'siteName',
          label: '站点名称',
          type: 'input',
          configType: ConfigType.PUBLIC,
          rules: [{ required: true, message: '请输入站点名称' }],
        },
        {
          key: 'siteLogo',
          label: '站点 Logo',
          type: 'input',
          configType: ConfigType.PUBLIC,
        },
        {
          key: 'apiKey',
          label: 'API 密钥',
          type: 'input',
          configType: ConfigType.PRIVATE,
          rules: [{ required: true, message: '请输入 API 密钥' }],
        },
        {
          key: 'secretKey',
          label: 'Secret Key',
          type: 'input',
          configType: ConfigType.PRIVATE,
        },
      ],
    },
  ],
};

const handleSave = async () => {
  try {
    await formCardRef.value?.onConfirm();
  } catch {
    // 验证失败
  }
};

const handleReset = async () => {
  await formCardRef.value?.reset();
  ElMessage.success('已重置');
};
</script>

<style scoped lang="scss">
.config-test-page {
  padding: 24px;

  h2 {
    margin-bottom: 16px;
    font-size: 20px;
  }

  .actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
}
</style>
