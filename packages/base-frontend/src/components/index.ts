/**
 * @fileoverview 通用组件导出
 * @description
 * 存放业务通用的 UI 组件，这些组件可以在多个业务场景中复用。
 *
 * 命名规范：
 * - 所有通用组件必须使用 `Mfw` 前缀命名（Moyan Framework 的缩写）
 * - 组件名使用 PascalCase，例如：MfwButton, MfwDialog, MfwTable
 *
 * 示例：
 * ```vue
 * <script setup>
 * import { MfwButton } from 'moyan-mfw-base-frontend';
 * </script>
 *
 * <template>
 *   <MfwButton type="primary">点击</MfwButton>
 * </template>
 * ```
 */

// 展示类组件
export * from './display/mod';

// 反馈类组件
export * from './feedback/mod';

// 上传类组件
export * from './upload/mod';

// 表单类组件
export * from './form/form-card/mod';

// 表格类组件
export * from './table/table-list/mod';

// JSON 编辑器组件
export * from './editor/mod';

// 页面类组件
export * from './page/page-scene/mod';

// 选择器类组件
export * from './picker/mod';
