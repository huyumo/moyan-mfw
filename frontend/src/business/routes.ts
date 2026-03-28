/**
 * @fileoverview 业务路由配置。
 *
 * 路由和菜单自动生成，无需手动配置。
 * 只需在 views/ 目录下创建页面目录和 index.ts 配置文件即可。
 *
 * 目录结构示例：
 *   views/
 *     business/
 *       orders/
 *         Index.vue      - 页面组件
 *         index.ts       - 配置文件 (导出 page, path, name 等)
 *       reports/
 *         Index.vue
 *         index.ts
 *
 * 配置文件格式 (index.ts):
 *   import Orders from './Index.vue';
 *   export default {
 *     page: Orders,
 *     path: 'orders',
 *     name: '订单中心',
 *     icon: 'Tickets',
 *     auth: true,
 *     order: 1
 *   };
 */

// 路由和菜单从 views/**/index.ts 自动生成
// 无需在此处导出额外配置
