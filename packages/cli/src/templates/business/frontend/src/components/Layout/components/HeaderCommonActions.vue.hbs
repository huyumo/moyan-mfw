<template>
  <div class="header-actions">
    <el-space :size="2">
      <!-- 主题切换 -->
      <div class="action-icon-btn" data-testid="header-theme-btn" @click="toggleTheme">
        <el-icon :size="18">
          <component :is="isDark ? Sunny : Moon" />
        </el-icon>
      </div>

      <!-- 全屏切换 -->
      <div class="action-icon-btn" data-testid="header-fullscreen-btn" @click="toggleFullscreen">
        <el-icon :size="18">
          <component :is="isFullscreen ? ScaleToOriginal : FullScreen" />
        </el-icon>
      </div>

      <!-- 布局设置 -->
      <div class="action-icon-btn" data-testid="header-settings-btn" @click="openLayoutSettings">
        <el-icon :size="18"><Setting /></el-icon>
      </div>
    </el-space>
  </div>
</template>

<script setup lang="ts">
import { Setting, Moon, Sunny, FullScreen, ScaleToOriginal } from '@element-plus/icons-vue';
import { ref, onMounted, onUnmounted } from 'vue';

const isDark = ref(false);
const isFullscreen = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
};

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    await document.exitFullscreen();
    isFullscreen.value = false;
  }
};

const openLayoutSettings = () => {
  console.log('Open layout settings');
};

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped lang="scss">
.header-actions {
  display: flex;
  align-items: center;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 4px;
  font-weight: 600;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  &:active {
    background: rgba(255, 255, 255, 0.18);
  }
}
</style>
