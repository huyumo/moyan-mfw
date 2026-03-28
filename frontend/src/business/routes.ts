/**
 * @fileoverview 业务路由配置。
 */

import type { RouteRecordRaw } from 'vue-router';

const RouteGroupView = () => import('./views/RouteGroupView.vue');
const OrderCenterPage = () => import('./views/order/OrderCenterPage.vue');
const ReportHubPage = () => import('./views/report/ReportHubPage.vue');

/**
 * 业务模块路由定义。
 */
export const businessRoutes: RouteRecordRaw[] = [
  {
    path: '/business',
    name: 'BusinessGroup',
    component: RouteGroupView,
    redirect: '/business/orders',
    meta: {
      title: '业务中心',
      menuLabel: '业务中心',
      menuIcon: 'Briefcase',
      menuOrder: 10,
    },
    children: [
      {
        path: 'orders',
        name: 'BusinessOrders',
        component: OrderCenterPage,
        meta: {
          title: '订单中心',
          menuLabel: '订单中心',
          menuIcon: 'Tickets',
          menuOrder: 1,
        },
      },
      {
        path: 'reports',
        name: 'BusinessReports',
        component: ReportHubPage,
        meta: {
          title: '报表中心',
          menuLabel: '报表中心',
          menuIcon: 'PieChart',
          menuOrder: 2,
          menuBadge: '新',
        },
      },
    ],
  },
  {
    path: '/monitor',
    name: 'MonitorGroup',
    component: RouteGroupView,
    redirect: '/monitor/overview',
    meta: {
      title: '运维中心',
      menuLabel: '运维中心',
      menuIcon: 'Monitor',
      menuOrder: 20,
    },
    children: [
      {
        path: 'overview',
        name: 'MonitorOverview',
        component: ReportHubPage,
        meta: {
          title: '运行概览',
          menuLabel: '运行概览',
          menuIcon: 'TrendCharts',
          menuOrder: 1,
        },
      },
    ],
  },
];
