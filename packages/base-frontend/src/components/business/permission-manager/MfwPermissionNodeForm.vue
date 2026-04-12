<!--
/**
 * @fileoverview 权限节点表单
 * @description 用于新建/编辑权限节点，内部直接调用 API
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
        <div class="perm-code-input">
          <span v-if="parentPermCodePrefix" class="perm-code-prefix">{{ parentPermCodePrefix }}:</span>
          <el-input
            v-model="form.permCode"
            :placeholder="permCodePlaceholder"
            :disabled="isEdit"
            class="perm-code-input-field"
          />
        </div>
        <div v-if="!isEdit && parentId" class="perm-code-hint">
          完整编码: <strong>{{ fullPermCode }}</strong>
        </div>
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

<script setup
 lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';

defineOptions({ name: 'MfwPermissionNodeForm' });
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ApiPermissionCreate, ApiPermissionUpdate } from '../../../apis/sys';

interface PermissionNodeFormData {
  id: string;
  permName: string;
  permCode: string;
  nodeType: string;
  permDesc: string;
  showMode: 'NORMAL' | 'DEV';
  permStatus: 0 | 1;
}

interface PermissionNodeFormProps {
  data?: {
    isEdit?: boolean;
    permissionType: 'PC' | 'NORMAL';
    parentId?: string;
    parentPermCode?: string; // 父节点的完整编码
    nodeTypeOptions?: Array<{ label: string; value: string }>;
    defaultNodeType?: string;
    initialData?: Partial<PermissionNodeFormData>;
  };
}

const props = defineProps<PermissionNodeFormProps>();

// 从 data 中解构属性
const isEdit = computed(() => props.data?.isEdit ?? false);
const permissionType = computed(() => props.data?.permissionType ?? 'NORMAL');
const parentId = computed(() => props.data?.parentId);
const parentPermCode = computed(() => props.data?.parentPermCode);
const nodeTypeOptions = computed(() => props.data?.nodeTypeOptions ?? []);
const defaultNodeType = computed(() => props.data?.defaultNodeType ?? 'MENU');
const initialData = computed(() => props.data?.initialData);

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

// 计算父节点编码前缀（严格按照树结构）
const parentPermCodePrefix = computed(() => {
  if (!parentId.value || isEdit.value) return '';
  return parentPermCode.value || '';
});

// 编码输入提示
const permCodePlaceholder = computed(() => {
  if (isEdit.value) return '权限编码不可修改';
  if (!parentId.value) return '请输入权限编码（如：pc_root 或 normal_root）';
  return '请输入最后一段编码（如：user）';
});

// 完整编码预览
const fullPermCode = computed(() => {
  if (!form.permCode) return '';
  if (!parentId.value) return form.permCode;
  return `${parentPermCode.value}:${form.permCode}`;
});

onMounted(() => {
  if (initialData.value) {
    form.id = initialData.value.id || '';
    form.permName = initialData.value.permName || '';
    form.permCode = initialData.value.permCode || '';
    form.nodeType = initialData.value.nodeType || defaultNodeType.value || 'MENU';
    form.permDesc = initialData.value.permDesc || '';
    form.showMode = (initialData.value.showMode as 'NORMAL' | 'DEV') || 'NORMAL';
    form.permStatus = (initialData.value.permStatus as 0 | 1) || 1;
  } else {
    form.nodeType = defaultNodeType.value || 'MENU';
  }
});

const onConfirm = async () => {
  await formRef.value?.validate();

  if (isEdit.value) {
    // 编辑
    await new ApiPermissionUpdate({
      query: { id: form.id },
      params: {
        permName: form.permName,
        permDesc: form.permDesc,
        showMode: form.showMode,
        permStatus: form.permStatus,
      },
    });
    ElMessage.success('更新成功');
  } else {
    // 新建 - 只传最后一段编码，后端会自动拼接
    await new ApiPermissionCreate({
      params: {
        permName: form.permName,
        permCode: form.permCode,
        nodeType: form.nodeType,
        permissionType: permissionType.value,
        parentId: parentId.value,
        permDesc: form.permDesc,
        showMode: form.showMode,
        permStatus: form.permStatus,
      },
    });
    ElMessage.success('创建成功');
  }
};

defineExpose({ onConfirm });
</script>

<style scoped lang="scss">
.permission-node-form {
  padding: 8px 0;

  .perm-code-input {
    display: flex;
    align-items: center;
    width: 100%;

    .perm-code-prefix {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      margin-right: 4px;
      white-space: nowrap;
    }

    .perm-code-input-field {
      flex: 1;
    }
  }

  .perm-code-hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>