<!--
/**
 * @fileoverview 权限表单组件
 * @description 用于 MfwPopup 弹窗的新建/编辑权限表单
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :rules="rules"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import MfwFormCard from '../../../components/form/form-card';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiPermissionCreate, ApiPermissionUpdate, ApiPermissionFindById } from '../../../apis/sys';
import type { PermissionResponseDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** Props */
interface Props {
  data?: PermissionResponseDto & { parentId?: string };
}

const props = defineProps<Props>();

/** 是否编辑模式 */
const isEdit = computed(() => !!props.data?.id);

/** 表单引用 */
const formRef = ref<MfwFormCardInstance>();

/** 表单数据 */
const form = reactive({
  permName: '',
  permCode: '',
  permCodeDisplay: '',
  nodeType: 'MENU' as 'MENU' | 'TAG',
  permDesc: '',
  showMode: 'NORMAL' as 'NORMAL' | 'DEV',
  sortOrder: 0,
  permStatus: STATUS.ENABLED as 1 | 0,
  parentId: '',
});

/** 表单项配置 */
const formTemplate: FormItemConfig[] = [
  {
    key: 'permName',
    label: '权限名称',
    component: 'el-input',
    placeholder: '请输入权限名称',
    rules: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  },
  {
    key: 'permCode',
    label: '权限编码',
    component: 'el-input',
    placeholder: '如：menu.system 或 tag.system.user',
    rules: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'permCodeDisplay',
    label: '权限编码',
    component: 'el-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'nodeType',
    label: '节点类型',
    component: 'el-select',
    rules: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
    show: () => !isEdit.value,
    value: 'MENU',
    elProps: {
      style: 'width: 100%',
      options: [
        { label: '目录 (MENU)', value: 'MENU' },
        { label: '标签 (TAG)', value: 'TAG' },
      ],
    },
  },
  {
    key: 'permDesc',
    label: '权限描述',
    component: 'el-input',
    placeholder: '请输入权限描述',
    elProps: {
      type: 'textarea',
      rows: 2,
    },
  },
  {
    key: 'showMode',
    label: '显示模式',
    component: 'el-select',
    value: 'NORMAL',
    elProps: {
      style: 'width: 100%',
      options: [
        { label: '普通模式', value: 'NORMAL' },
        { label: '开发模式', value: 'DEV' },
      ],
    },
  },
  {
    key: 'sortOrder',
    label: '排序',
    component: 'el-input-number',
    value: 0,
    elProps: {
      min: 0,
    },
  },
  {
    key: 'permStatus',
    label: '状态',
    component: 'el-switch',
    value: STATUS.ENABLED,
    elProps: {
      activeValue: STATUS.ENABLED,
      inactiveValue: STATUS.DISABLED,
    },
  },
];

/** 验证规则 */
const rules = {};

/** 初始化 */
onMounted(() => {
  if (props.data) {
    form.permName = props.data.permName;
    form.permCode = props.data.permCode;
    form.permCodeDisplay = props.data.permCode;
    form.nodeType = props.data.nodeType as 'MENU' | 'TAG';
    form.permDesc = props.data.permDesc || '';
    form.showMode = props.data.showMode as 'NORMAL' | 'DEV';
    form.sortOrder = props.data.sortOrder;
    form.permStatus = props.data.permStatus as 1 | 0;
    form.parentId = props.data.parentId || '';
  }
});

/** 确认提交 */
const onConfirm = async () => {
  await formRef.value?.validate();

  // 父节点类型校验：TAG 父节点必须是 MENU
  if (form.nodeType === 'TAG') {
    if (!form.parentId) {
      ElMessage.error('TAG 类型权限必须选择父节点');
      throw new Error('TAG 类型权限必须选择父节点');
    }

    // 获取父节点信息验证类型
    const parentResult = await new ApiPermissionFindById({
      query: { id: form.parentId },
    });

    const parent = parentResult.list?.[0];
    if (!parent) {
      ElMessage.error('父节点不存在');
      throw new Error('父节点不存在');
    }
    if (parent.nodeType !== 'MENU') {
      ElMessage.error(`TAG 类型权限的父节点必须是 MENU 类型，当前父节点类型为 ${parent.nodeType}`);
      throw new Error('父节点类型错误');
    }
  }

  if (isEdit.value) {
    await new ApiPermissionUpdate({
      query: { id: props.data!.id },
      params: {
        permName: form.permName,
        permDesc: form.permDesc,
        showMode: form.showMode,
        sortOrder: form.sortOrder,
        permStatus: form.permStatus,
      },
    });
  } else {
    await new ApiPermissionCreate({
      params: {
        permName: form.permName,
        permCode: form.permCode,
        nodeType: form.nodeType,
        permissionType: 'NORMAL',
        parentId: form.parentId || undefined,
        permDesc: form.permDesc,
        showMode: form.showMode,
        sortOrder: form.sortOrder,
        permStatus: form.permStatus,
      },
    });
  }
};

defineExpose({ onConfirm });
</script>