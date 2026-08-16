<!--
/**
 * @fileoverview 扫码配置页面
 * @description 码生成策略（分组/分隔符/字符集）+ 场景白名单管理，含示例码实时预览
 */
-->
<template>
  <MfwPageWrapper>
    <div class="scan-code-config-page">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>码生成策略</span>
            <span class="preview-wrap">
              示例码：<el-tag type="info" size="large" class="preview-code" data-testid="scan-code-preview">{{ previewCode }}</el-tag>
            </span>
          </div>
        </template>
        <MfwFormCard
          ref="formRef"
          :form-data="form"
          :template="formTemplate"
          :form-props="{ labelWidth: '140px' }"
        />
        <div class="form-actions">
          <el-button type="primary" :loading="saving" data-testid="scan-code-save-btn" @click="handleSave">
            保存配置
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="card-header"><span>场景说明</span></div>
        </template>
        <el-alert type="info" :closable="false" show-icon>
          <p>· 码内容即数据库记录ID，扫码后直接按 ID 查询（如 {{ previewCode }}）</p>
          <p>· 配置了场景白名单后，generate() 仅允许白名单内的场景，空 = 不限制</p>
          <p>· 码内容总长度（分组字符 + 分隔符）不可超过 32 字符，保存时后端校验</p>
          <p>· 修改策略只影响新生成的码，已有记录不变</p>
        </el-alert>
      </el-card>
    </div>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MfwPageWrapper, MfwFormCard } from 'moyan-mfw-base/frontend'
import type { MfwFormCardInstance, FormItemConfig } from 'moyan-mfw-base/frontend'
import {
  SCAN_CODE_CHARSETS,
  SCAN_CODE_CHARSET_LABELS,
} from 'moyan-mfw-extension-scan-code/shared'
import { ApiScanCodeGetSettings, ApiScanCodeSaveSettings } from '../../apis/scan-code'

defineOptions({ name: 'MfwScanCodeConfigPage' })

const formRef = ref<MfwFormCardInstance>()
const saving = ref(false)

const form = reactive({
  groupCount: 3,
  groupLength: 4,
  separator: '-',
  charset: 'A-Z1-9',
  scenes: [] as string[],
})

const formTemplate = computed<FormItemConfig[]>(() => [
  {
    key: 'groupCount',
    label: '分组数',
    component: 'el-input-number',
    rules: [{ required: true, message: '请输入分组数', trigger: 'blur' }],
    elProps: { min: 2, max: 5, controlsPosition: 'right', 'data-testid': 'scan-code-group-count' },
  },
  {
    key: 'groupLength',
    label: '每组字符数',
    component: 'el-input-number',
    rules: [{ required: true, message: '请输入每组字符数', trigger: 'blur' }],
    elProps: { min: 3, max: 5, controlsPosition: 'right', 'data-testid': 'scan-code-group-length' },
  },
  {
    key: 'separator',
    label: '分组分隔符',
    component: 'el-input',
    rules: [{ required: true, message: '请输入分隔符（空格表示不分隔）', trigger: 'blur' }],
    elProps: {
      maxlength: 2,
      placeholder: '默认 -，留空输入请用空格代替（最长 2 字符）',
      'data-testid': 'scan-code-separator',
    },
  },
  {
    key: 'charset',
    label: '字符集',
    component: 'el-select',
    rules: [{ required: true, message: '请选择字符集', trigger: 'change' }],
    elProps: {
      options: Object.keys(SCAN_CODE_CHARSETS).map((c) => ({
        label: SCAN_CODE_CHARSET_LABELS[c] ?? c,
        value: c,
      })),
    },
  },
  {
    key: 'scenes',
    label: '场景白名单',
    component: 'el-select',
    elProps: {
      multiple: true,
      filterable: true,
      allowCreate: true,
      defaultFirstOption: true,
      reserveKeyword: false,
      placeholder: '输入场景名后回车添加（如 points / gift），留空 = 不限制',
      'data-testid': 'scan-code-scenes',
    },
  },
])

/** 前端本地生成示例码预览（仅展示格式，与后端生成逻辑同构） */
const previewCode = computed(() => {
  const chars = SCAN_CODE_CHARSETS[form.charset as keyof typeof SCAN_CODE_CHARSETS] ?? SCAN_CODE_CHARSETS['A-Z1-9']
  const sep = form.separator === ' ' ? '' : form.separator
  const group = () =>
    Array.from({ length: form.groupLength }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const total = form.groupCount * form.groupLength + (form.groupCount - 1) * sep.length
  if (total > 32) return '超长（>32 字符）'
  return Array.from({ length: form.groupCount }, () => group()).join(sep)
})

const loadSettings = async () => {
  const result = await new ApiScanCodeGetSettings({})
  form.groupCount = result.groupCount
  form.groupLength = result.groupLength
  form.separator = result.separator === '' ? ' ' : result.separator
  form.charset = result.charset
  form.scenes = result.scenes ? [...result.scenes] : []
}

const handleSave = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  saving.value = true
  try {
    await new ApiScanCodeSaveSettings({
      body: {
        groupCount: form.groupCount,
        groupLength: form.groupLength,
        separator: form.separator === ' ' ? '' : form.separator,
        charset: form.charset,
        scenes: form.scenes.length > 0 ? form.scenes : undefined,
      },
    })
    ElMessage.success('码生成策略已保存')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped lang="scss">
.scan-code-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.preview-code {
  font-family: monospace;
  letter-spacing: 1px;
}

.form-actions {
  margin-top: 8px;
  padding-left: 140px;
}

:deep(.el-alert__content p) {
  margin: 2px 0;
  line-height: 1.6;
}
</style>
