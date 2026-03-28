/**
 * @fileoverview 视图页面自动加载
 * @description
 * 自动加载 views 目录下所有页面组件。
 *
 * 加载规则：
 * 1. 每个子目录被视为一个页面
 * 2. 按优先级加载：Index.vue > index.ts > index.tsx
 * 3. 如果目录下没有这三类文件，则该目录不会被加载
 *
 * 导出格式：
 * - 按目录名驼峰命名导出，例如：
 *   - dashboard/ => DashboardPage
 *   - not-found/ => NotFoundPage
 *   - user-center/ => UserCenterPage
 */

/**
 * 自动加载所有 Index.vue | index.ts | index.tsx 文件
 */
const viewModules = import.meta.glob(
  './*/Index.{vue,ts,tsx}',
  { eager: false }
);

/**
 * 将目录名转换为驼峰命名的页面组件名
 * @param dirName - 目录名（如 dashboard, not-found）
 * @returns 组件名（如 DashboardPage, NotFoundPage）
 */
function dirNameToComponentName(dirName: string): string {
  return (
    dirName
      .split('/')
      .pop()
      ?.split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Page'
  );
}

/**
 * 按目录名获取页面组件
 * @param dirName - 目录名
 * @returns 组件加载函数
 */
export function getPageModule(dirName: string) {
  const path = `./${dirName}/Index.vue`;
  return viewModules[path] as (() => Promise<unknown>) | undefined;
}

/**
 * 获取所有已注册的页面组件
 */
export const pageModules = viewModules;

/**
 * 获取所有页面组件名称列表
 */
export function getPageNames(): string[] {
  return Object.keys(viewModules)
    .map((path) => {
      const dirName = path.replace('./', '').split('/')[0];
      return dirNameToComponentName(dirName);
    })
    .sort();
}
