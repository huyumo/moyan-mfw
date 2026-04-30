<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="keepAliveInclude" :max="20">
      <component :is="Component" :key="route.name" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'MfwEmptyLayout' });

const route = useRoute();
const router = useRouter();

const keepAliveInclude = computed(() => {
  return router.getRoutes()
    .filter(r => r.meta?.keepAlive)
    .map(r => (r.components?.default as any)?.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
});
</script>
