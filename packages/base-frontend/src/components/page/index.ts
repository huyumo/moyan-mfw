/**
 * @fileoverview 页面类组件导出
 */

export * from './page-wrapper/mod';
export * from './list-page/mod';

// 向后兼容：MfwPageScene 指向 MfwListPage
export { MfwListPage as MfwPageScene } from './list-page/mod';
export type * from './list-page/types';
