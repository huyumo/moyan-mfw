<!--
**
 * @fileoverview - 头部通用操作区组件（参考 Vben Admin 设计）
 *
 * 该组件是墨焱管理后台顶部导航栏的通用操作区，提供快捷操作入口。
 *
 * 功能说明：
 * 1. 搜索按钮
 *    - 显示搜索图标
 *    - 支持快捷键 Ctrl+K 触发
 *    - 点击打开搜索面板
 *
 * 2. 主题切换
 *    - 点击切换亮色/暗色主题
 *    - 使用月亮/太阳图标
 *
 * 3. 全屏切换
 *    - 点击切换全屏模式
 *    - 使用展开/收起图标
 *
 * 4. 语言切换
 *    - 点击切换显示语言
 *    - 使用地球图标
 *
 * 5. 消息通知
 *    - 显示消息入口图标，跳转到 /monitor/overview
 *    - 使用 el-badge 组件显示未读消息数量
 *
 * 6. 布局设置
 *    - 点击打开布局样式配置抽屉
 *    - 通过调用 layoutStore.toggleSettingsPanel 方法控制抽屉显示
 *
 * 布局设计：
 * - 使用 el-space 组件进行横向布局，间距 8px
 * - 纯图标按钮设计，无边框无背景
 * - 图标尺寸：20px
 * - 消息徽章样式优化：红色背景，小号徽章
 *
 * 技术实现：
 * - 使用 Vue 3 Composition API（script setup）
 * - 使用 Element Plus UI 组件库
 * - 使用 SCSS 进行样式编写
 * - 使用 Vue Router 进行导航
 * - 通过 Pinia Store 控制布局设置抽屉
 *
 * @author moyan
 * @since 1.0.0
-->

<script setup lang="ts">
import { useLayoutStore } from 'moyan-mfw-base-frontend/store/layout-store';
import { useColorMode } from 'moyan-mfw-base-frontend/composables';
import {
  Bell,
  Document,
  Setting,
  Search,
  Moon,
  Sunny,
  FullScreen,
  ScaleToOriginal,
  Switch,
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';

const layoutStore = useLayoutStore();
const router = useRouter();
const { isDark, toggleDark } = useColorMode();

/**
 * 全屏状态
 */
const isFullscreen = ref(false);

/**
 * 打开布局设置面板。
 * 调用 layoutStore 的 toggleSettingsPanel 方法显示抽屉。
 */
const openLayoutSettings = () => {
  layoutStore.toggleSettingsPanel(true);
};

/**
 * 导航到指定路径
 * @param path - 目标路径
 */
const navigateTo = (path: string) => {
  router.push(path);
};

/**
 * 切换主题
 */
const toggleTheme = () => {
  toggleDark();
};

/**
 * 切换全屏
 */
const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    await document.exitFullscreen();
    isFullscreen.value = false;
  }
};

/**
 * 切换语言
 */
const toggleLanguage = () => {
};

/**
 * 打开搜索
 */
const openSearch = () => {
};

/**
 * 监听键盘快捷键
 */
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="header-actions">
    <el-space :size="2">
      <!-- 搜索按钮 -->
      <!-- <div class="action-icon-btn" @click="openSearch">
        <el-icon :size="18"><Search /></el-icon>
      </div> -->

      <!-- 主题切换 -->
      <div class="action-icon-btn" @click="toggleTheme">
        <el-icon :size="18">
          <component :is="isDark ? Sunny : Moon" />
        </el-icon>
      </div>

      <!-- 全屏切换 -->
      <div class="action-icon-btn" @click="toggleFullscreen">
        <el-icon :size="18">
          <component :is="isFullscreen ? ScaleToOriginal : FullScreen" />
        </el-icon>
      </div>

      <!-- 消息通知 -->
      <!-- <el-badge :value="3" class="action-badge">
        <div class="action-icon-btn" @click="navigateTo('/monitor/overview')">
          <el-icon :size="18"><Bell /></el-icon>
        </div>
      </el-badge> -->

      <!-- 布局设置 -->
      <div class="action-icon-btn" @click="openLayoutSettings">
        <el-icon :size="18"><Setting /></el-icon>
      </div>
    </el-space>
  </div>
</template>

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

.action-badge {
  :deep(.el-badge__content) {
    right: 0;
    top: 0;
    border: none;
    background: #ff4d4f;
    font-weight: 600;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    font-size: 11px;
    transform: translate(25%, -25%);
  }
}
</style>
