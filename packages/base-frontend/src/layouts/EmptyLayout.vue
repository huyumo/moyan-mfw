<template>
  <router-view v-slot="{ Component, route: viewRoute }">
    <keep-alive v-if="keepAliveEnabled" :max="20">
      <component :is="Component" :key="viewRoute.name" />
    </keep-alive>
    <component v-else :is="Component" :key="viewRoute.name" />
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLayoutStore } from '../store/layout-store';

defineOptions({ name: 'MfwEmptyLayout' });

const route = useRoute();
const layoutStore = useLayoutStore();

const keepAliveEnabled = computed(() => layoutStore.styleConfig.keepAlive);
</script>
