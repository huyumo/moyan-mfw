<!--
/**
 * @fileoverview 应用拥有者变更组件
 * @description 独立弹窗组件，用于变更应用负责人并自动同步成员表
 */
-->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" data-testid="owner-change-form" @submit.prevent>
    <el-form-item label="当前拥有者">
      <el-tag type="info" size="large">{{ currentOwnerLabel }}</el-tag>
    </el-form-item>
    <el-form-item label="新拥有者" prop="newOwnerId">
      <MfwUserPicker v-model="form.newOwnerId" data-testid="owner-new-picker" :style="{ width: '100%' }" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import MfwUserPicker from '../../picker/user-picker';
import { ApiAppChangeOwner } from '../../../apis/sys';

defineOptions({ name: 'OwnerChanger' });

const props = defineProps<{
  appId: string;
  appName: string;
  currentOwnerId?: string;
  currentOwnerName?: string;
}>();

const formRef = ref<FormInstance>();

const currentOwnerLabel = computed(() => {
  if (props.currentOwnerName) {
    return props.currentOwnerName;
  }
  if (props.currentOwnerId) {
    return props.currentOwnerId;
  }
  return '未设置';
});

const form = reactive({
  newOwnerId: props.currentOwnerId || '',
});

const rules: FormRules = {
  newOwnerId: [{ required: true, message: '请选择新的拥有者', trigger: 'change' }],
};

const onConfirm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (form.newOwnerId === props.currentOwnerId) {
    ElMessage.warning('新拥有者与当前拥有者相同');
    return;
  }

  await new ApiAppChangeOwner({
    params: { id: props.appId },
    query: { ownerId: form.newOwnerId },
  }, { hintSuccess: true });
};

defineExpose({ onConfirm });
</script>
