<!--
/**
 * @fileoverview - 基础框架默认首页占位页面
 *
 * 这是一个占位页面，业务项目应该在自己的 views/dashboard 目录下
 * 创建实际的首页页面来覆盖此页面。
 *
 * 如果业务层没有定义首页，此页面将作为默认首页显示。
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <section class="mfw-dashboard-placeholder">
    <div class="placeholder-content">
      <h2>欢迎使用管理后台框架</h2>
      <p>请在业务层 <code>frontend/src/views/dashboard/Index.vue</code> 创建您的首页</p>
      <el-alert type="info" :closable="false">
        <template #title>
          此页面为框架默认占位页面，业务层首页将自动覆盖
        </template>
      </el-alert>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.mfw-dashboard-placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 24px;
}

.placeholder-content {
  max-width: 480px;
  text-align: center;

  h2 {
    margin: 0 0 16px;
    font-size: 24px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 20px;
    color: var(--el-text-color-secondary);
    font-size: 14px;

    code {
      background: var(--el-fill-color-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  }
}
</style>