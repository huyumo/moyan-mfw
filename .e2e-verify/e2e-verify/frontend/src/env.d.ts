/// <reference types="vite/client" />
import type { RouteRecordRaw } from 'vue-router';

declare module 'moyan-mfw-base/frontend' {
  export function createBaseAdminApp(options: unknown): {
    fetchPermissionValues(): Promise<unknown[]>;
    initPermissionCache(values: unknown[]): void;
    initPermissionValues(values: unknown[]): void;
    mount(selector: string): Promise<void>;
  };
  export function registerPermissionValues(values: unknown[]): void;
  export function definePageConfig(config: unknown): unknown;
  export function buildRoutesFromConfigs(configs: unknown[], ctx?: unknown): RouteRecordRaw[];
  export function createBusinessPageConfigFn(permPrefix: string): (page: unknown) => unknown;
}

declare module 'moyan-mfw-base/frontend/style.css' {
  const content: string;
  export default content;
}

declare module 'moyan-mfw-extension-ad/frontend' {
  export const adRoutes: RouteRecordRaw[];
}

declare module 'moyan-mfw-extension-ad/shared' {
  export const AD_EXTENSION_PERMISSION_VALUES: bigint[];
}
