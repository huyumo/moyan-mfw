/**
 * @fileoverview 扩展包前端入口
 */
import { buildExtensionRoutes } from 'moyan-mfw-base/frontend';

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
});

export const TestExtRoutes = buildExtensionRoutes(allConfigs, 'test-ext', {
  namespaceName: '测试扩展',
});
