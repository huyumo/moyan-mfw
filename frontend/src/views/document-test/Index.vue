<template>
  <MfwDocumentManager
    doc-key="demo-article"
    :form-fields="fields"
    :ext-fields="extFields"
    :columns="columns"
    :search-fields="searchFields"
    show-add
    show-edit
    show-delete
    show-view
  />
</template>

<script setup lang="ts">
import { MfwDocumentManager } from 'moyan-mfw-extension-document/frontend';
import type {
  DocumentFieldConfig,
  DocumentExtFieldConfig,
  DocumentColumnConfig,
  DocumentSearchField,
} from 'moyan-mfw-extension-document/frontend';
import { DocumentStatus, ExtValueType } from 'moyan-mfw-extension-document/shared';

/**
 * 文档测试页：演示 MfwDocumentManager 的配置式用法
 * 仅启用「标题 + 正文 + 状态」三个核心字段，其余字段（images/video/tags 等）按需关闭，
 * 体现「公共/协议/简单文档」场景下大多数字段不使用的真实诉求。
 */
const fields: DocumentFieldConfig[] = [
  {
    key: 'title',
    label: '标题',
    component: 'el-input',
    rules: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  },
  {
    key: 'content',
    label: '正文',
    rules: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  },
  {
    key: 'status',
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
];

/** EAV 扩展字段：演示 string / number / boolean / json 四种类型 */
const extFields: DocumentExtFieldConfig[] = [
  { extKey: 'author', label: '作者', valueType: ExtValueType.STRING },
  { extKey: 'readMinutes', label: '阅读时长', valueType: ExtValueType.NUMBER },
  { extKey: 'featured', label: '是否精选', valueType: ExtValueType.BOOLEAN },
  {
    extKey: 'extra',
    label: '附加信息(JSON)',
    valueType: ExtValueType.JSON,
    component: 'el-input',
    elProps: { type: 'textarea', rows: 3 },
  },
];

/** 表格列：大多数场景只展示标题/状态/时间 */
const columns: DocumentColumnConfig[] = [
  { prop: 'title', label: '标题', minWidth: 240 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'viewPageviews', label: '浏览量', width: 100 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];

/** 搜索项 */
const searchFields: DocumentSearchField[] = [
  { key: 'keyword', label: '标题', type: 'input', placeholder: '请输入标题' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    elProps: {
      options: [
        { label: '草稿', value: DocumentStatus.DRAFT },
        { label: '已发布', value: DocumentStatus.PUBLISHED },
        { label: '已下线', value: DocumentStatus.OFFLINE },
      ],
    },
  },
];
</script>
