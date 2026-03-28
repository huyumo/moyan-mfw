<template>
  <section class="mfw-dashboard">
    <h1>管理后台演示首页</h1>
    <p class="subtitle">用于演示布局、路由与样式能力的基础设施页面。</p>

    <div class="cards">
      <div class="card">
        <div class="card-label">活跃用户</div>
        <div class="card-value">1,246</div>
        <div class="card-detail">较上周 +12.8%</div>
      </div>
      <div class="card">
        <div class="card-label">系统健康度</div>
        <div class="card-value">99.96%</div>
        <div class="card-detail">最近故障：18 天前</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 首页逻辑
</script>

<style scoped lang="scss">
.mfw-dashboard {
  padding: 24px;

  h1 {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #666;
    margin-bottom: 24px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .card-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }

    .card-value {
      font-size: 36px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .card-detail {
      font-size: 13px;
      color: #999;
    }
  }
}
</style>
