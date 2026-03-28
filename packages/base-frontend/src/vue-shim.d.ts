/**
 * @fileoverview 文件职责说明。
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}

/**
 * Vite import.meta.glob 类型补充。
 */
interface ImportMeta {
  glob: (
    pattern: string | string[],
    options?: { eager?: boolean; import?: string; query?: string },
  ) => Record<string, unknown>;
}
