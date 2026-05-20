import type { RouteRecordRaw } from 'vue-router';
import { buildRoutesFromConfigs } from 'moyan-mfw-base/frontend';

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export const businessRoutes: RouteRecordRaw[] = buildRoutesFromConfigs(allConfigs, {
  minSegments: 1,
});
