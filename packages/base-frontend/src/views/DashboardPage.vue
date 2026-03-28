<!--
/**
 * @fileoverview - 管理后台仪表盘页面
 *
 * 这是管理后台的首页/仪表盘页面，用于展示系统概览信息和快捷入口。
 * 作为演示页面，展示了框架的布局能力、组件使用和样式系统。
 *
 * 页面内容：
 * 1. 统计卡片区域：展示活跃用户、系统健康度、待处理任务、发布版本等关键指标
 * 2. 快速接入清单：以时间线形式展示接入步骤
 * 3. 快捷入口：提供常用页面的快速导航按钮
 *
 * 设计特点：
 * - 使用 CSS Grid 实现响应式卡片布局
 * - 采用框架定义的 CSS 变量保持样式一致性
 * - 集成 Element Plus 组件（Timeline、Space、Button 等）
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <section class="mfw-dashboard">
    <header class="mfw-dashboard-header">
      <h2>管理后台演示首页</h2>
      <p>用于演示布局、路由与样式能力的基础设施页面。</p>
    </header>

    <div class="mfw-dashboard-grid mfw-dashboard-grid--stats">
      <article class="mfw-dashboard-card">
        <small>活跃用户</small>
        <strong>1,246</strong>
        <span>较上周 +12.8%</span>
      </article>
      <article class="mfw-dashboard-card">
        <small>系统健康度</small>
        <strong>99.96%</strong>
        <span>最近故障：18 天前</span>
      </article>
      <article class="mfw-dashboard-card">
        <small>待处理任务</small>
        <strong>8</strong>
        <span>其中 2 项为高优先级检查</span>
      </article>
      <article class="mfw-dashboard-card">
        <small>发布节奏</small>
        <strong>0.2.0</strong>
        <span>3 天后进入冻结窗口</span>
      </article>
    </div>

    <div class="mfw-dashboard-grid mfw-dashboard-grid--content">
      <article class="mfw-dashboard-card mfw-dashboard-card--large">
        <h3>快速接入清单</h3>
        <el-timeline>
          <el-timeline-item timestamp="步骤 1" placement="top">接入真实登录鉴权接口。</el-timeline-item>
          <el-timeline-item timestamp="步骤 2" placement="top">将静态菜单替换为后端菜单树。</el-timeline-item>
          <el-timeline-item timestamp="步骤 3" placement="top">挂载权限指令与路由守卫。</el-timeline-item>
          <el-timeline-item timestamp="步骤 4" placement="top">基于框架壳层构建业务页面。</el-timeline-item>
        </el-timeline>
      </article>

      <article class="mfw-dashboard-card">
        <h3>快捷入口</h3>
        <el-space direction="vertical" fill>
          <el-button plain @click="go('/dashboard')">返回首页</el-button>
          <el-button plain @click="go('/403')">权限不足页面</el-button>
          <el-button plain @click="go('/404')">页面不存在</el-button>
          <el-button plain tag="a" href="https://www.vben.pro/#/analytics" target="_blank"> 分析示例链接 </el-button>
        </el-space>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
/** 路由器实例 */
const router = useRouter();

/**
 * 导航到指定路径
 * @param path - 目标路径
 */
function go(path: string) {
  router.push(path);
}
</script>
