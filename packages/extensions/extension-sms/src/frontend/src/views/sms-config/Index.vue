<!--
/**
 * @fileoverview 短信配置页面
 * @description 运营商凭证配置（单行表单）+ 短信模板管理（表格 CRUD）
 */
-->
<template>
  <MfwPageWrapper>
    <div class="sms-config-page">
      <!-- 运营商配置 -->
      <el-card shadow="never" class="sms-config-card">
        <template #header>
          <div class="card-header">
            <span>运营商配置</span>
            <el-tag v-if="providerSource === 'db'" type="success" size="small">页面配置生效</el-tag>
            <el-tag v-else-if="providerSource === 'env'" type="warning" size="small">环境变量降级</el-tag>
          </div>
        </template>
        <MfwFormCard
          ref="providerFormRef"
          :form-data="providerForm"
          :template="providerFormTemplate"
          :form-props="{ labelWidth: '140px' }"
        />
        <div class="form-actions">
          <el-button type="primary" :loading="savingProvider" data-testid="sms-provider-save-btn" @click="handleSaveProvider">
            保存运营商配置
          </el-button>
        </div>
      </el-card>

      <!-- 模板管理 -->
      <el-card shadow="never" class="sms-config-card">
        <template #header>
          <div class="card-header">
            <span>短信模板</span>
            <el-button type="primary" size="small" data-testid="sms-template-add-btn" @click="handleAddTemplate">
              <el-icon><Plus /></el-icon>
              新增模板
            </el-button>
          </div>
        </template>
        <el-table :data="templates" v-loading="loadingTemplates" empty-text="暂无模板">
          <el-table-column prop="scene" label="场景名" min-width="140">
            <template #default="{ row }">
              <el-tag size="small">{{ row.scene }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="signName" label="签名" min-width="120" />
          <el-table-column prop="templateCode" label="模板 Code" min-width="140" />
          <el-table-column label="参数 key" min-width="160">
            <template #default="{ row }">
              <el-tag v-for="key in row.paramKeys" :key="key" size="small" type="info" class="param-tag">
                {{ key }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEditTemplate(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteTemplate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { MfwPageWrapper, MfwFormCard, MfwPopup } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import { SMS_PROVIDERS, SMS_PROVIDER_LABELS, type SmsTemplateItem } from 'moyan-mfw-extension-sms/shared'
import {
  ApiSmsGetProviderSetting,
  ApiSmsSaveProviderSetting,
  ApiSmsListTemplates,
  ApiSmsDeleteTemplate,
  type SaveProviderSettingParams,
} from '../../apis/sms'
import MfwSmsTemplateForm from '../../components/sms-template-form/Index.vue'

defineOptions({ name: 'MfwSmsConfigPage' })

// ── 运营商配置 ──

const providerFormRef = ref<MfwFormCardInstance>()
const savingProvider = ref(false)
const providerSource = ref<'db' | 'env' | null>(null)
/** 标记是否已有 DB 配置（决定 secret 是否必填） */
const hasDbSetting = ref(false)

const providerForm = reactive({
  provider: 'aliyun',
  accessKeyId: '',
  accessKeySecret: '',
  defaultSignName: '',
})

const providerFormTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'provider',
    label: '短信运营商',
    component: 'el-select',
    rules: [{ required: true, message: '请选择运营商', trigger: 'change' }],
    elProps: {
      options: SMS_PROVIDERS.map((p) => ({ label: SMS_PROVIDER_LABELS[p] ?? p, value: p })),
    },
  },
  {
    key: 'accessKeyId',
    label: 'AccessKey ID',
    component: 'el-input',
    rules: [{ required: true, message: '请输入 AccessKey ID', trigger: 'blur' }],
    elProps: { placeholder: '阿里云 AccessKey ID', clearable: true, 'data-testid': 'sms-ak-id' },
  },
  {
    key: 'accessKeySecret',
    label: 'AccessKey Secret',
    component: 'el-input',
    rules: hasDbSetting.value
      ? []
      : [{ required: true, message: '首次配置必须填写 AccessKey Secret', trigger: 'blur' }],
    elProps: {
      type: 'password',
      showPassword: true,
      placeholder: hasDbSetting.value ? '留空表示保持不变（已配置 **** 尾4位）' : '阿里云 AccessKey Secret',
      'data-testid': 'sms-ak-secret',
    },
  },
  {
    key: 'defaultSignName',
    label: '默认短信签名',
    component: 'el-input',
    elProps: { placeholder: '可被模板级签名覆盖', clearable: true },
  },
])

const loadProviderSetting = async () => {
  const result = await new ApiSmsGetProviderSetting({})
  if (result) {
    providerSource.value = result.source
    providerForm.provider = result.provider
    providerForm.accessKeyId = result.accessKeyId
    providerForm.defaultSignName = result.defaultSignName ?? ''
  }
  hasDbSetting.value = result?.source === 'db'
}

const handleSaveProvider = async () => {
  const valid = await providerFormRef.value?.validate()
  if (!valid) return
  savingProvider.value = true
  try {
    const body: SaveProviderSettingParams = {
      provider: providerForm.provider,
      accessKeyId: providerForm.accessKeyId,
    }
    if (providerForm.accessKeySecret?.trim()) {
      body.accessKeySecret = providerForm.accessKeySecret.trim()
    }
    if (providerForm.defaultSignName?.trim()) {
      body.defaultSignName = providerForm.defaultSignName.trim()
    }
    await new ApiSmsSaveProviderSetting({ body })
    ElMessage.success('运营商配置已保存')
    providerForm.accessKeySecret = ''
    await loadProviderSetting()
  } finally {
    savingProvider.value = false
  }
}

// ── 模板管理 ──

const loadingTemplates = ref(false)
const templates = ref<SmsTemplateItem[]>([])

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    templates.value = (await new ApiSmsListTemplates({})) ?? []
  } finally {
    loadingTemplates.value = false
  }
}

const handleAddTemplate = () => {
  MfwPopup.open({
    title: '新增短信模板',
    type: 'dialog',
    component: MfwSmsTemplateForm,
    popupProps: { width: 520 },
    on: { confirm: loadTemplates },
  })
}

const handleEditTemplate = (row: SmsTemplateItem) => {
  MfwPopup.open({
    title: `编辑短信模板：${row.scene}`,
    type: 'dialog',
    component: MfwSmsTemplateForm,
    elProps: { ...row },
    popupProps: { width: 520 },
    on: { confirm: loadTemplates },
  })
}

const handleDeleteTemplate = async (row: SmsTemplateItem) => {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.scene}」吗？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  await new ApiSmsDeleteTemplate({ params: { id: row.id } }, { hintSuccess: true })
  await loadTemplates()
}

onMounted(() => {
  loadProviderSetting()
  loadTemplates()
})
</script>

<style scoped lang="scss">
.sms-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sms-config-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.form-actions {
  margin-top: 8px;
  padding-left: 140px;
}

.param-tag {
  margin-right: 4px;
}
</style>
