/**
 * @fileoverview MfwDetail 详情展示组件统一导出
 * @description 提供详情面板、用户信息展示等组件
 *
 * @example
 * ```typescript
 * // 在 main.ts 中注册
 * import { MfwDetail } from 'moyan-mfw-base/frontend';
 * app.use(MfwDetail);
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <!-- 详情面板 -->
 *   <MfwDetailPanel
 *     :data="record"
 *     :items="detailItems"
 *     :columns="2"
 *     bordered
 *   />
 *
 *   <!-- 用户信息展示 -->
 *   <MfwUserFormat userId="123" mode="card" showDepartment />
 * </template>
 * ```
 */

import './style.scss';

import type { Plugin } from 'vue';
import MfwDetailPanel from './detail-panel';
import MfwUserFormat from './user-format';

export { MfwDetailPanel, MfwUserFormat };

export type * from './types';

export const MfwDetail: Plugin = {
  install(app) {
    app.component('mfw-detail-panel', MfwDetailPanel);
    app.component('mfw-user-format', MfwUserFormat);
  }
};

export default MfwDetail;