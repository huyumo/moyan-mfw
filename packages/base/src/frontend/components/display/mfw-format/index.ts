/**
 * @fileoverview MfwFormat 格式化组件统一导出
 * @description 提供日期、图片、字典、标签等数据格式化展示组件
 *
 * @example
 * ```typescript
 * // 在 main.ts 中注册
 * import { MfwFormat } from 'moyan-mfw-base/frontend';
 * app.use(MfwFormat);
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <!-- 日期格式化 -->
 *   <MfwDateFormat value="2026-03-29" fmt="YYYY-MM-DD" />
 *   <MfwDateFormat :value="new Date()" fmt="YYYY-MM-DD HH:mm:ss" />
 *
 *   <!-- 图片格式化 -->
 *   <MfwImageFormat value="https://example.com/image.jpg" :width="100" />
 *
 *   <!-- 字典格式化 -->
 *   <MfwDictFormat value="1" :dict="[{ value: 1, label: '启用' }]" as-tag />
 *
 *   <!-- 标签格式化 -->
 *   <MfwTagFormat value="已完成" type="success" />
 * </template>
 * ```
 */

import './style.scss';

import type { Plugin } from 'vue';
import MfwDateFormat from './date-format';
import MfwImageFormat from './image-format';
import MfwDictFormat from './dict-format';
import MfwTagFormat from './tag-format';

// 导出组件
export { MfwDateFormat, MfwImageFormat, MfwDictFormat, MfwTagFormat };

// 导出类型
export type * from './types';

/**
 * 格式化组件插件
 */
export const MfwFormat: Plugin = {
  install(app) {
    app.component('mfw-date-format', MfwDateFormat);
    app.component('mfw-image-format', MfwImageFormat);
    app.component('mfw-dict-format', MfwDictFormat);
    app.component('mfw-tag-format', MfwTagFormat);
  }
};

export default MfwFormat;
