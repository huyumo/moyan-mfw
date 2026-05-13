<template>
  <router-view v-slot="{ Component, route: viewRoute }">
    <component :is="Component" :key="viewRoute.fullPath" />
  </router-view>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

defineOptions({ name: 'MfwEmptyLayout' });

const route = useRoute();
</script>
