<!--
/**
 * @fileoverview 文档详情弹窗组件
 * @description 在 MfwPopup 中以抽屉形式展示文档详情，采用阅读式排版而非表格呈现
 */
-->
<template>
  <div class="mfw-document-detail" v-loading="loading">
    <template v-if="doc">
      <!-- 文章头部 -->
      <header class="mfw-document-detail__header">
        <h2 class="mfw-document-detail__title">{{ doc.title || '(无标题)' }}</h2>
        <div class="mfw-document-detail__meta">
          <span v-if="doc.docKey" class="meta-chip meta-chip--primary">类型 · {{ doc.docKey }}</span>
          <span v-if="doc.docGroup" class="meta-chip">分组 · {{ doc.docGroup }}</span>
          <span v-if="doc.type" class="meta-chip meta-chip--warning">{{ doc.type }}</span>
          <span
            v-if="doc.status !== undefined"
            class="meta-chip"
            :class="`meta-chip--${statusTagType(doc.status)}`"
          >
            {{ statusText(doc.status) }}
          </span>
        </div>
        <div class="mfw-document-detail__stats">
          <span v-if="doc.viewPageviews !== undefined" class="stat-item">
            <el-icon><View /></el-icon>
            <span>{{ doc.viewPageviews }} 次浏览</span>
          </span>
          <span v-if="doc.createdAt" class="stat-item">
            <el-icon><Calendar /></el-icon>
            <MfwDateFormat :value="doc.createdAt" />
          </span>
        </div>
      </header>

      <el-divider class="mfw-document-detail__divider" />

      <!-- 正文内容 -->
      <article
        v-if="doc.content"
        class="mfw-document-detail__content"
        v-html="doc.content"
      />

      <!-- 图片画廊 -->
      <section v-if="doc.images?.length" class="mfw-document-detail__gallery">
        <el-image
          v-for="(src, i) in doc.images"
          :key="i"
          :src="src"
          :preview-src-list="doc.images"
          :initial-index="i"
          fit="cover"
          class="gallery-item"
        />
      </section>

      <!-- 视频 -->
      <section v-if="doc.video" class="mfw-document-detail__video-wrap">
        <video :src="doc.video" controls class="mfw-document-detail__video" />
      </section>

      <!-- 扩展字段：采用键值对列表而非表格 -->
      <section
        v-if="showExtFields && extFields.length"
        class="mfw-document-detail__ext"
      >
        <h3 class="mfw-document-detail__ext-title">扩展字段</h3>
        <dl class="mfw-document-detail__ext-list">
          <div v-for="f in extFields" :key="f.extKey" class="ext-row">
            <dt class="ext-row__label">{{ f.extKey }}</dt>
            <dd class="ext-row__value">{{ formatExtValue(f) }}</dd>
          </div>
        </dl>
      </section>
    </template>
    <el-empty v-else-if="!loading" description="文档不存在或无权访问" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Calendar } from '@element-plus/icons-vue';
import { MfwDateFormat } from 'moyan-mfw-base/frontend';
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

<style scoped lang="scss">
.mfw-document-detail {
  padding: 20px 24px 32px;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

/* ---- 头部 ---- */
.mfw-document-detail__header {
  margin-bottom: 4px;
}

.mfw-document-detail__title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
  word-break: break-word;
}

/* ---- 元信息标签 ---- */
.mfw-document-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 12px;
  background: #f2f3f5;
  color: #4e5969;
  white-space: nowrap;

  &--primary {
    background: #e8f3ff;
    color: #165dff;
  }

  &--warning {
    background: #fff7e8;
    color: #ff7d00;
  }

  &--success {
    background: #e8ffea;
    color: #00b42a;
  }

  &--info {
    background: #f2f3f5;
    color: #86909c;
  }

  &--danger {
    background: #ffece8;
    color: #f53f3f;
  }
}

/* ---- 统计信息 ---- */
.mfw-document-detail__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #86909c;
  font-size: 13px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 14px;
  }
}

/* ---- 分割线 ---- */
.mfw-document-detail__divider {
  margin: 16px 0 20px;
}

/* ---- 正文内容 ---- */
.mfw-document-detail__content {
  font-size: 15px;
  line-height: 1.8;
  color: #1d2129;
  word-break: break-word;

  :deep(p) {
    margin: 0 0 12px;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  :deep(a) {
    color: #165dff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 20px 0 12px;
    font-weight: 600;
    color: #1d2129;
  }

  :deep(h1) { font-size: 22px; }
  :deep(h2) { font-size: 18px; }
  :deep(h3) { font-size: 16px; }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 12px;
    padding-left: 24px;
  }

  :deep(blockquote) {
    margin: 0 0 12px;
    padding: 8px 16px;
    border-left: 4px solid #e5e6eb;
    background: #f7f8fa;
    color: #4e5969;
  }

  :deep(code) {
    padding: 2px 6px;
    font-size: 13px;
    background: #f2f3f5;
    border-radius: 3px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  :deep(pre) {
    margin: 0 0 12px;
    padding: 12px 16px;
    overflow-x: auto;
    background: #f7f8fa;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.6;

    code {
      padding: 0;
      background: none;
    }
  }

  :deep(table) {
    width: 100%;
    margin: 0 0 12px;
    border-collapse: collapse;

    th,
    td {
      padding: 8px 12px;
      border: 1px solid #e5e6eb;
      text-align: left;
    }

    th {
      background: #f7f8fa;
      font-weight: 600;
    }
  }
}

/* ---- 图片画廊 ---- */
.mfw-document-detail__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.gallery-item {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #f7f8fa;
}

/* ---- 视频 ---- */
.mfw-document-detail__video-wrap {
  margin-top: 20px;
}

.mfw-document-detail__video {
  width: 100%;
  max-height: 480px;
  border-radius: 6px;
  background: #000;
}

/* ---- 扩展字段 ---- */
.mfw-document-detail__ext {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;
}

.mfw-document-detail__ext-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.mfw-document-detail__ext-list {
  margin: 0;
}

.ext-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px dashed #f2f3f5;

  &:last-child {
    border-bottom: none;
  }
}

.ext-row__label {
  flex: 0 0 120px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #86909c;
}

.ext-row__value {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #1d2129;
  word-break: break-all;
}
</style>
