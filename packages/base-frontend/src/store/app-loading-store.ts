/**
 * @fileoverview 应用加载状态管理
 * @description 管理应用初始化、路由切换等场景的加载状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppLoadingStore = defineStore('app-loading', () => {
  const isLoading = ref(false);
  const loadingText = ref('正在加载...');

  function showLoading(text = '正在加载...') {
    loadingText.value = text;
    isLoading.value = true;
    const placeholder = document.getElementById('loading-placeholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }
  }

  function hideLoading() {
    isLoading.value = false;
    const placeholder = document.getElementById('loading-placeholder');
    if (placeholder) {
      placeholder.classList.add('hidden');
    }
  }

  return {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
  };
});
