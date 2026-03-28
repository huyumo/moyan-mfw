/**
 * @fileoverview 视图页面自动加载
 * @description
 * 自动加载 views 目录下所有页面组件。
 *
 * 加载规则：
 * 1. 每个子目录被视为一个页面
 * 2. 按优先级加载：Index.vue > index.ts > index.tsx
 * 3. 如果目录下没有这三个类文件，则该目录不会被加载
 *
 * 导出格式：
 * - 按目录名驼峰命名导出，例如：
 *   - dashboard/ => DashboardPage
 *   - not-found/ => NotFoundPage
 *   - user-center/ => UserCenterPage
 */

const PAGE_FILES = import.meta.glob<{ default?: unknown }>('./*/Index.{vue,tsx,ts}', {
  eager: false,
  import: 'default',
});

const INDEX_TS_FILES = import.meta.glob<{ default?: unknown }>('./*/index.{ts,tsx}', {
  eager: false,
  import: 'default',
});

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
 * 获取所有已注册的页面组件
 */
export const pageModules: Record<string, () => Promise<unknown>> = { ...PAGE_FILES };

/**
 * 按目录名获取页面组件
 * @param dirName - 目录名
 * @returns 组件加载函数
 */
export function getPageModule(dirName: string): (() => Promise<unknown>) | undefined {
  const path = `./${dirName}/Index.vue`;
  const tsPath = `./${dirName}/index.ts`;
  const tsxPath = `./${dirName}/index.tsx`;

  return PAGE_FILES[path] || INDEX_TS_FILES[tsPath] || INDEX_TS_FILES[tsxPath];
}

/**
 * 获取所有页面组件名称列表
 */
export function getPageNames(): string[] {
  return Object.keys(PAGE_FILES)
    .map((path) => {
      const dirName = path.replace('./', '').split('/')[0];
      return dirNameToComponentName(dirName);
    })
    .sort();
}

// 导出所有页面组件（按目录名自动命名）
Object.entries(PAGE_FILES).forEach(([path, loader]) => {
  const dirName = path.replace('./', '').split('/')[0];
  const componentName = dirNameToComponentName(dirName);
  Object.defineProperty(exports, componentName, {
    get: () => () => loader().then((mod) => mod.default),
    enumerable: true,
    configurable: true,
  });
});

// 导出 index.ts / index.tsx 的页面
Object.entries(INDEX_TS_FILES).forEach(([path, loader]) => {
  const dirName = path.replace('./', '').split('/')[0];
  const componentName = dirNameToComponentName(dirName);
  if (!exports[componentName]) {
    Object.defineProperty(exports, componentName, {
      get: () => () => loader().then((mod) => mod.default),
      enumerable: true,
      configurable: true,
    });
  }
});
