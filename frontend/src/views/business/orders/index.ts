import Orders from './Index.vue';
import { defineBusinessPageConfig } from '../../../permissions';

export default defineBusinessPageConfig({
  page: Orders,
  path: 'orders',
  name: '订单中心',
  icon: 'Tickets',
  auth: true,
  order: 1,
  permissions: ['发货', '充值', '接待', '添加'],
});