import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';
import { businessRoutes } from './router';
import './permissions';

const admin = createBaseAdminApp({
  title: 'TestShop',
  routes: [...businessRoutes],
  layout: {
    layoutMode: 'dual',
    showTabs: true,
    colorMode: 'system',
    themePackage: 'default',
  },
  navigation: {
    brandName: 'TestShop',
    brandTagline: 'TestShop 业务项目',
    homePath: '/dashboard',
  },
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount('#app');
