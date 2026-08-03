<!--
/**
 * @fileoverview 文档表单组件（用于 MfwPopup 弹窗内的创建/编辑）
 * @description 配置驱动：根据 fields + extFields 配置动态构建表单，支持自定义组件。
 *   - fields 传入则只渲染配置字段；不传则渲染全部内置字段。
 *   - extFields 渲染 EAV 扩展字段，按 valueType 选默认控件，可被 component 覆盖。
 *   - 编辑模式（record 含 id）自动加载主表 + 扩展字段回填。
 *   - 暴露 onConfirm 供 MfwPopup 确认按钮调用。
 */
-->
<template>
  <MfwFormCard
    ref="formCardRef"
    :form-data="formData"
    :template="formTemplate"
    :form-props="{ labelWidth: '100px', ...formProps }"
    :disabled="loading"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  MfwFormCard,
  MfwQuillEditor,
  MfwImageGallery,
  MfwVideoSingle,
} from 'moyan-mfw-base/frontend';
import type { FormItemConfig, MfwFormCardInstance } from 'moyan-mfw-base/frontend';
import { DocumentType, DocumentStatus, ExtValueType } from 'moyan-mfw-extension-document/shared';
import {
  getDocumentById,
  getExtFields,
  createDocument,
  updateDocument,
  type DocumentData,
  type ExtFieldData,
} from './api';
import type { DocumentFieldConfig, DocumentExtFieldConfig } from './types';

const props = withDefaults(
  defineProps<{
    /** 文档类型标识 */
    docKey: string;
    /** 应用 ID */
    appId?: number | null;
    /** 编辑模式时传入的文档记录（含 id 则为编辑） */
    record?: any;
    /** 字段配置；传入则只渲染配置字段，不传则渲染全部内置字段 */
    fields?: DocumentFieldConfig[];
    /** 扩展字段配置（EAV） */
    extFields?: DocumentExtFieldConfig[];
    /** 透传给 ElForm 的属性 */
    formProps?: Record<string, any>;
  }>(),
  { appId: null, fields: () => [], extFields: () => [], formProps: () => ({}) },
);

const formCardRef = ref<MfwFormCardInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.record?.id);
const loadedId = ref<number | null>(props.record?.id ?? null);

const formData = reactive<Record<string, any>>({
  title: '',
  type: DocumentType.IMAGE_TEXT,
  content: '',
  summary: '',
  images: [],
  video: '',
  tags: '',
  docGroup: '',
  status: DocumentStatus.DRAFT,
  announcementStartTime: '',
  announcementEndTime: '',
  sortOrder: 0,
  virtualPageviews: 0,
});

/** 内置字段默认控件配置（key → FormItemConfig 片段） */
const BUILTIN_DEFAULTS: Record<string, Partial<FormItemConfig>> = {
  title: { label: '标题', component: 'el-input', rules: [{ required: true, message: '请输入标题', trigger: 'blur' }] },
  type: {
    label: '类型',
    component: 'el-select',
    elProps: {
      options: [
        { label: '图文', value: DocumentType.IMAGE_TEXT },
        { label: '视频', value: DocumentType.VIDEO },
      ],
    },
  },
  content: { label: '正文', component: MfwQuillEditor, elProps: { height: '400px' } },
  summary: { label: '摘要', component: 'el-input', elProps: { type: 'textarea', rows: 3 } },
  images: { label: '图片', component: MfwImageGallery },
  video: { label: '视频', component: MfwVideoSingle, show: (d: any) => d.type === DocumentType.VIDEO },
  tags: { label: '标签', component: 'el-input', placeholder: '多个标签用逗号分隔' },
  docGroup: { label: '分组', component: 'el-input' },
  status: {
    label: '状态',
    component: 'el-select',
    elProps: {
      options: [
        { label: '草稿', value: DocumentStatus.DRAFT },
        { label: '已发布', value: DocumentStatus.PUBLISHED },
        { label: '已下线', value: DocumentStatus.OFFLINE },
      ],
    },
  },
  announcementStartTime: { label: '公告开始', component: 'el-date-picker', elProps: { type: 'datetime', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
  announcementEndTime: { label: '公告结束', component: 'el-date-picker', elProps: { type: 'datetime', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
  sortOrder: { label: '排序', component: 'el-input-number', elProps: { min: 0 } },
  virtualPageviews: { label: '虚拟浏览量', component: 'el-input-number', elProps: { min: 0 } },
};

/** 扩展字段默认控件（valueType → component） */
function extDefaultComponent(vt?: ExtValueType): any {
  switch (vt) {
    case ExtValueType.NUMBER:
      return 'el-input-number';
    case ExtValueType.BOOLEAN:
      return 'el-switch';
    case ExtValueType.JSON:
      return 'el-input';
    default:
      return 'el-input';
  }
}

/** 构建主表表单模板 */
const mainTemplate = computed<FormItemConfig[]>(() => {
  const cfgs: DocumentFieldConfig[] = props.fields?.length
    ? props.fields
    : (Object.keys(BUILTIN_DEFAULTS) as string[]).map((key) => ({ key }));
  return cfgs.map((f) => {
    const def = BUILTIN_DEFAULTS[f.key] || {};
    const item: FormItemConfig = {
      key: f.key,
      label: f.label ?? def.label,
      component: f.component ?? def.component ?? 'el-input',
      elProps: { ...(def.elProps || {}), ...(f.elProps || {}) },
      itemProps: f.itemProps,
      rules: f.rules ?? def.rules,
      show: f.show ?? def.show,
      disabled: f.disabled,
      span: f.span,
      value: f.value,
      placeholder: f.placeholder,
      change: f.change,
      on: f.on,
    };
    // 清理 undefined
    Object.keys(item).forEach((k) => (item as any)[k] === undefined && delete (item as any)[k]);
    return item;
  });
});

/** 构建扩展字段表单模板 */
const extTemplate = computed<FormItemConfig[]>(() => {
  return (props.extFields || []).map((f) => {
    const vt = f.valueType ?? ExtValueType.STRING;
    const item: FormItemConfig = {
      key: f.extKey,
      label: f.label ?? f.extKey,
      component: f.component ?? extDefaultComponent(vt),
      elProps: vt === ExtValueType.JSON ? { type: 'textarea', rows: 4, ...(f.elProps || {}) } : { ...(f.elProps || {}) },
      itemProps: f.itemProps,
      rules: f.rules,
      show: f.show,
      disabled: f.disabled,
      span: f.span,
      value: f.value,
      placeholder: f.placeholder,
      change: f.change,
    };
    Object.keys(item).forEach((k) => (item as any)[k] === undefined && delete (item as any)[k]);
    return item;
  });
});

const formTemplate = computed<FormItemConfig[]>(() => [...mainTemplate.value, ...extTemplate.value]);

/** 扩展字段值序列化（提交时） */
function serializeExtValue(value: any, vt?: ExtValueType): any {
  if (vt === ExtValueType.JSON && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/** 扩展字段值反序列化（回填时） */
function deserializeExtValue(raw: any, vt?: ExtValueType): any {
  if (vt === ExtValueType.JSON && raw && typeof raw === 'object') {
    return JSON.stringify(raw, null, 2);
  }
  return raw;
}

/** 加载文档（编辑模式） */
async function loadDocument() {
  if (!loadedId.value) return;
  loading.value = true;
  try {
    const doc = await getDocumentById(loadedId.value);
    Object.assign(formData, {
      title: doc.title ?? '',
      type: doc.type ?? DocumentType.IMAGE_TEXT,
      content: doc.content ?? '',
      summary: doc.summary ?? '',
      images: doc.images ?? [],
      video: doc.video ?? '',
      tags: doc.tags ?? '',
      docGroup: doc.docGroup ?? '',
      status: doc.status ?? DocumentStatus.DRAFT,
      announcementStartTime: doc.announcementStartTime ?? '',
      announcementEndTime: doc.announcementEndTime ?? '',
      sortOrder: doc.sortOrder ?? 0,
      virtualPageviews: doc.virtualPageviews ?? 0,
    });
    // 回填扩展字段
    const exts = await getExtFields(loadedId.value);
    const vtMap = new Map((props.extFields || []).map((f) => [f.extKey, f.valueType ?? ExtValueType.STRING]));
    for (const e of exts || []) {
      formData[e.extKey] = deserializeExtValue(e.extValue?.data, vtMap.get(e.extKey) || (e.valueType as ExtValueType));
    }
  } catch {
    ElMessage.error('加载文档失败');
  } finally {
    loading.value = false;
  }
}

/** 构建扩展字段提交载荷 */
function buildExtPayload() {
  return (props.extFields || []).map((f) => {
    const vt = f.valueType ?? ExtValueType.STRING;
    return {
      extKey: f.extKey,
      extValue: { data: serializeExtValue(formData[f.extKey] ?? '', vt) },
      valueType: vt,
      description: f.description,
    };
  });
}

/** 确认提交 */
async function onConfirm() {
  await formCardRef.value?.validate();
  const mainKeys = mainTemplate.value.map((t) => t.key);
  const payload: Record<string, any> = {};
  for (const k of mainKeys) {
    payload[k] = formData[k];
  }
  payload.extFields = buildExtPayload();

  if (isEdit.value && loadedId.value) {
    const updated = await updateDocument(loadedId.value, payload as Partial<DocumentData>);
    ElMessage.success('保存成功');
    return updated;
  }
  const created = await createDocument({ ...payload, docKey: props.docKey, appId: props.appId ?? undefined } as Partial<DocumentData>);
  ElMessage.success('创建成功');
  return created;
}

onMounted(loadDocument);

defineExpose({ onConfirm });
</script>
