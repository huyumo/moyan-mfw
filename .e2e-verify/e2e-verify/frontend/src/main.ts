import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';
import 'moyan-mfw-base/frontend/style.css';
import 'moyan-mfw-extension-ad/frontend/style.css';
import { HeaderCommonActions } from './components/Layout';
import { businessRoutes } from './router';
import { adRoutes } from 'moyan-mfw-extension-ad/frontend';
import { AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/shared';
import './permissions';

registerPermissionValues([...AD_EXTENSION_PERMISSION_VALUES]);

const admin = createBaseAdminApp({
  title: 'E2eVerify',
  routes: [...businessRoutes, ...adRoutes],
  layout: {
    layoutMode: 'dual',
    showTabs: true,
    colorMode: 'system',
    themePackage: 'default',
  },
  navigation: {
    brandName: 'E2eVerify',
    brandTagline: 'E2eVerify 业务项目',
    homePath: '/dashboard',
  },
  layoutExtensions: {
    headerCommon: HeaderCommonActions,
  },
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount('#app');
