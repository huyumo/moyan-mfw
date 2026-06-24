<!--
/**
 * @fileoverview 文档详情弹窗组件
 * @description 在 MfwPopup 中以抽屉形式展示文档详情与扩展字段
 */
-->
<template>
  <div class="mfw-document-detail" v-loading="loading">
    <template v-if="doc">
      <h2 class="mfw-document-detail__title">{{ doc.title || '(无标题)' }}</h2>
      <div class="mfw-document-detail__meta">
        <el-tag v-if="doc.docKey" size="small">类型：{{ doc.docKey }}</el-tag>
        <el-tag v-if="doc.docGroup" size="small" type="info">分组：{{ doc.docGroup }}</el-tag>
        <el-tag v-if="doc.type" size="small" type="warning">{{ doc.type }}</el-tag>
        <el-tag v-if="doc.status !== undefined" size="small" :type="statusTagType(doc.status)">
          {{ statusText(doc.status) }}
        </el-tag>
        <span v-if="doc.viewPageviews !== undefined" class="meta-item">浏览：{{ doc.viewPageviews }}</span>
        <span v-if="doc.createdAt" class="meta-item">创建：{{ doc.createdAt }}</span>
      </div>
      <el-divider />
      <div v-if="doc.content" class="mfw-document-detail__content" v-html="doc.content" />
      <div v-if="doc.images?.length" class="mfw-document-detail__images">
        <el-image
          v-for="(src, i) in doc.images"
          :key="i"
          :src="src"
          :preview-src-list="doc.images"
          fit="cover"
          class="detail-image"
        />
      </div>
      <video v-if="doc.video" :src="doc.video" controls class="mfw-document-detail__video" />
      <template v-if="showExtFields && extFields.length">
        <el-divider content-position="left">扩展字段</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="f in extFields" :key="f.extKey" :label="f.extKey">
            {{ formatExtValue(f) }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </template>
    <el-empty v-else-if="!loading" description="文档不存在或无权访问" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getDocumentById,
  getDocumentByOnlyKey,
  getExtFields,
  type DocumentData,
  type ExtFieldData,
} from './api';
import { DocumentStatus, ExtValueType } from 'moyan-mfw-extension-document/shared';

const props = withDefaults(
  defineProps<{
    /** 文档 ID（与 onlyKey 二选一） */
    id?: number;
    /** 文档唯一键（与 id 二选一） */
    onlyKey?: string;
    /** 应用 ID */
    appId?: number | null;
    /** 是否渲染扩展字段区 */
    showExtFields?: boolean;
    /** 是否走公开接口（无需认证，仅返回已发布） */
    pubMode?: boolean;
  }>(),
  { appId: null, showExtFields: true, pubMode: false },
);

const loading = ref(false);
const doc = ref<DocumentData | null>(null);
const extFields = ref<ExtFieldData[]>([]);

const STATUS_TEXT: Record<number, string> = {
  [DocumentStatus.DRAFT]: '草稿',
  [DocumentStatus.PUBLISHED]: '已发布',
  [DocumentStatus.OFFLINE]: '已下线',
};

const STATUS_TYPE: Record<number, 'success' | 'info' | 'warning' | 'danger'> = {
  [DocumentStatus.DRAFT]: 'info',
  [DocumentStatus.PUBLISHED]: 'success',
  [DocumentStatus.OFFLINE]: 'warning',
};

function statusText(s: number): string {
  return STATUS_TEXT[s] ?? String(s);
}
function statusTagType(s: number): 'success' | 'info' | 'warning' | 'danger' {
  return STATUS_TYPE[s] ?? 'info';
}

function formatExtValue(f: ExtFieldData): string {
  const raw = f.extValue?.data;
  if (f.valueType === ExtValueType.JSON && raw && typeof raw === 'object') {
    return JSON.stringify(raw);
  }
  if (raw === null || raw === undefined) return '-';
  return String(raw);
}

async function load() {
  loading.value = true;
  try {
    if (props.id) {
      doc.value = await getDocumentById(props.id);
    } else if (props.onlyKey) {
      doc.value = await getDocumentByOnlyKey(props.onlyKey);
    }
    if (doc.value?.id && props.showExtFields) {
      extFields.value = await getExtFields(doc.value.id);
    }
  } catch {
    ElMessage.error('加载文档失败');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
