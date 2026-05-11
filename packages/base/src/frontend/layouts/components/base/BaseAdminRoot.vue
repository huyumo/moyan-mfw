<!--
/**
 * @fileoverview - 管理后台根组件
 *
 * 这是管理后台应用的根组件，作为所有页面的容器。
 * 通过 router-view 渲染当前路由对应的页面组件。
 *
 * 功能说明：
 * - 作为应用的根挂载点
 * - 通过 Vue Router 的 router-view 渲染匹配的路由组件
 * - 支持路由切换和页面跳转
 *
 * 使用场景：
 * - 作为 createBaseAdminApp 创建的应用实例的根组件
 * - 在 main.ts 中挂载到 DOM
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <router-view />
  <MfwPopupManager />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { MfwPopupManager } from '../../../components';
import { useAppLoadingStore } from '../../../store/app-loading-store';

onMounted(() => {
  const appLoadingStore = useAppLoadingStore();
  appLoadingStore.hideLoading();
});
</script>
