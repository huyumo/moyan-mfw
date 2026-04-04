<!--
/**
 * @fileoverview 权限节点表单
 * @description 用于新建/编辑权限节点
 */
-->
<template>
  <div class="permission-node-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="权限名称" prop="permName">
        <el-input v-model="form.permName" placeholder="请输入权限名称" />
      </el-form-item>

      <el-form-item label="权限编码" prop="permCode">
        <el-input
          v-model="form.permCode"
          placeholder="请输入权限编码"
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item label="节点类型" prop="nodeType">
        <el-select
          v-model="form.nodeType"
          placeholder="请选择节点类型"
          style="width: 100%"
          :disabled="isEdit"
        >
          <el-option
            v-for="opt in nodeTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="权限描述" prop="permDesc">
        <el-input
          v-model="form.permDesc"
          type="textarea"
          :rows="2"
          placeholder="请输入权限描述"
        />
      </el-form-item>

      <el-form-item label="显示模式" prop="showMode">
        <el-radio-group v-model="form.showMode">
          <el-radio-button label="NORMAL">普通</el-radio-button>
          <el-radio-button label="DEV">开发</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="状态" prop="permStatus">
        <el-switch
          v-model="form.permStatus"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

export interface PermissionNodeFormProps {
  isEdit?: boolean;
  nodeTypeOptions: Array<{ label: string; value: string }>;
  defaultNodeType?: string;
  initialData?: Partial<PermissionNodeFormData>;
}

export interface PermissionNodeFormData {
  id: string;
  permName: string;
  permCode: string;
  nodeType: string;
  permDesc: string;
  showMode: 'NORMAL' | 'DEV';
  permStatus: 0 | 1;
  parentId?: string;
}

export interface PermissionNodeFormInstance {
  onConfirm: () => Promise<PermissionNodeFormData>;
}

const props = withDefaults(defineProps<PermissionNodeFormProps>(), {
  isEdit: false,
  defaultNodeType: 'MENU',
});

const formRef = ref<FormInstance>();

const form = reactive<PermissionNodeFormData>({
  id: '',
  permName: '',
  permCode: '',
  nodeType: 'MENU',
  permDesc: '',
  showMode: 'NORMAL',
  permStatus: 1,
});

const formRules: FormRules = {
  permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
};

onMounted(() => {
  if (props.initialData) {
    form.id = props.initialData.id || '';
    form.permName = props.initialData.permName || '';
    form.permCode = props.initialData.permCode || '';
    form.nodeType = props.initialData.nodeType || props.defaultNodeType || 'MENU';
    form.permDesc = props.initialData.permDesc || '';
    form.showMode = (props.initialData.showMode as 'NORMAL' | 'DEV') || 'NORMAL';
    form.permStatus = (props.initialData.permStatus as 0 | 1) || 1;
    form.parentId = props.initialData.parentId;
  } else {
    form.nodeType = props.defaultNodeType || 'MENU';
  }
});

const onConfirm = async (): Promise<PermissionNodeFormData> => {
  await formRef.value?.validate();
  return { ...form };
};

defineExpose<PermissionNodeFormInstance>({ onConfirm });
</script>

<style scoped lang="scss">
.permission-node-form {
  padding: 8px 0;
}
</style>
