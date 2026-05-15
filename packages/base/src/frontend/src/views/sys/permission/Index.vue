<!--
/**
 * @fileoverview 普通权限管理页面
 * @description 使用 PermissionManager 组件，API 调用已封装在组件内部
 */
-->
<template>
  <PermissionManager
    permission-type="NORMAL"
    title="普通权限树"
  />
</template>

<script setup lang="ts">
import PermissionManager from '../../../../components/business/permission-manager/Index.vue';

defineOptions({ name: 'MfwPermissionList' });
</script>
