import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import type { ExtractionResult, KnowledgePoint, QAPair } from '../types.js';
import { ASTParser } from '../utils/ast-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';
import { generateComponentQAs } from '../templates/component-templates.js';
import type { ComponentProp } from '../templates/component-templates.js';

const COMPONENT_DIRS = [
  { category: '页面组件', path: 'packages/base-frontend/src/components/page', components: ['list-page', 'card-list-page', 'search-panel', 'page-wrapper'] },
  { category: '表单组件', path: 'packages/base-frontend/src/components/form', components: ['form-card'] },
  { category: '反馈组件', path: 'packages/base-frontend/src/components/feedback', components: ['popup'] },
  { category: '表格组件', path: 'packages/base-frontend/src/components/table', components: ['table-list', 'action-buttons'] },
  { category: '上传组件', path: 'packages/base-frontend/src/components/upload', components: ['upload'] },
  { category: '编辑器组件', path: 'packages/base-frontend/src/components/editor', components: ['json-editor', 'md-editor', 'quill-editor'] },
  { category: '选择器组件', path: 'packages/base-frontend/src/components/picker', components: ['app-selector', 'icon-picker', 'user-picker', 'radio-group'] },
  { category: '展示组件', path: 'packages/base-frontend/src/components/display', components: ['mfw-card-panel', 'mfw-detail', 'mfw-format', 'particle-background'] },
  { category: '业务组件', path: 'packages/base-frontend/src/components/business', components: ['app-selector-dialog', 'builtin-role-dialog', 'permission-manager', 'permission-pool-panel', 'permission-tree', 'permission-value-panel', 'role-card', 'role-permission-panel', 'rolo-form'] },
  { category: '布局组件', path: 'packages/base-frontend/src/components/layout', components: ['password-change-form', 'profile-panel'] },
];

export function extractFrontendDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];
  const qaPairs: QAPair[] = [];

  for (const dir of COMPONENT_DIRS) {
    for (const comp of dir.components) {
      const compPath = join(projectRoot, dir.path, comp);
      const typesPath = join(compPath, 'types.ts');

      if (existsSync(typesPath)) {
        try {
          const astParser = new ASTParser();
          const interfaces = astParser.extractAllInterfaces(typesPath);

          for (const iface of interfaces) {
            knowledgePoints.push({
              id: `dim04-${comp}-${iface.title}`,
              dimension: 'dim04-frontend',
              subcategory: `${dir.category}:${comp}`,
              title: iface.title,
              content: iface.content,
              codeSnippet: iface.codeSnippet,
              source: typesPath,
              sourcePath: typesPath,
              tags: [dir.category, comp, iface.title],
            });
          }

          const componentQAs = generateComponentQAsFromTypes(dir.category, comp, typesPath);
          qaPairs.push(...componentQAs);
        } catch {
          // AST parsing may fail for some components
        }
      } else {
        knowledgePoints.push({
          id: `dim04-${comp}-overview`,
          dimension: 'dim04-frontend',
          subcategory: `${dir.category}:${comp}`,
          title: `${comp} 组件`,
          content: `${dir.category}组件，位于 ${dir.path}/${comp}。缺少 types.ts，需从源码手动提取。`,
          source: compPath,
          sourcePath: compPath,
          tags: [dir.category, comp],
        });
      }
    }
  }

  knowledgePoints.push(...extractHooks(projectRoot));
  knowledgePoints.push(...extractStores(projectRoot));
  knowledgePoints.push(...extractUtils(projectRoot));

  const genericResult = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim04-frontend' })),
    'dim04-frontend',
    DEFAULT_CONFIG.angleWeights
  );

  const allQAs = [...qaPairs, ...genericResult.qaPairs];

  return {
    dimension: 'dim04-frontend',
    knowledgePoints,
    qaPairs: allQAs,
    stats: {
      totalKnowledgePoints: knowledgePoints.length,
      totalQAPairs: allQAs.length,
      byAngle: genericResult.stats.byAngle,
      bySubcategory: genericResult.stats.bySubcategory,
    },
  };
}

function generateComponentQAsFromTypes(category: string, comp: string, typesPath: string): QAPair[] {
  try {
    const astParser = new ASTParser();
    const allIfaces = astParser.extractAllInterfaces(typesPath);
    const propsIface = allIfaces.find(i => i.title.endsWith('Props'));
    const emitsIface = allIfaces.find(i => i.title.endsWith('Emits'));
    const slotsIface = allIfaces.find(i => i.title.endsWith('Slots'));
    const exposeIface = allIfaces.find(i => i.title.endsWith('Instance'));

    const componentName = propsIface?.title.replace('Props', '') || `Mfw${comp.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;

    let props: ComponentProp[] = [];
    if (propsIface?.content) {
      try {
        props = JSON.parse(propsIface.content).map((p: any) => ({
          name: p.name, type: p.type, required: !p.optional,
          description: p.jsDoc || undefined,
        }));
      } catch { /* content not valid JSON */ }
    }

    return generateComponentQAs({
      name: componentName,
      category,
      props,
      emits: [],
      slots: [],
      expose: [],
      sourcePath: typesPath,
    });
  } catch {
    return [];
  }
}

function extractHooks(root: string): KnowledgePoint[] {
  return [
    { id: 'dim04-usePermission', dimension: 'dim04-frontend', subcategory: 'Hooks', title: 'usePermission Hook', content: '前端权限检查核心 Hook，提供 hasPermissionValue/hasAnyPermissionValue/hasAllPermissionValues/getCurrentPermCode 四个方法。', codeSnippet: `const { hasPermissionValue } = usePermission();`, source: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'), sourcePath: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'), tags: ['Hook'] },
    { id: 'dim04-useThemeSwitch', dimension: 'dim04-frontend', subcategory: 'Hooks', title: 'useThemeSwitch', content: '主题切换 composable，提供 setTheme/currentTheme/availableThemes/initTheme。', source: join(root, 'packages/base-frontend/src/composables/use-theme-switch.ts'), sourcePath: join(root, 'packages/base-frontend/src/composables/use-theme-switch.ts'), tags: ['composable'] },
    { id: 'dim04-useColorMode', dimension: 'dim04-frontend', subcategory: 'Hooks', title: 'useColorMode', content: '颜色模式切换 composable，基于 VueUse useDark，支持 View Transitions API 圆形扩散动画。', source: join(root, 'packages/base-frontend/src/composables/use-color-mode.ts'), sourcePath: join(root, 'packages/base-frontend/src/composables/use-color-mode.ts'), tags: ['composable'] },
  ];
}

function extractStores(root: string): KnowledgePoint[] {
  return [
    { id: 'dim04-authStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useAuthStore', content: '认证状态管理（Pinia Setup Store），管理 token/用户信息/应用列表/权限菜单/路由权限映射。', source: join(root, 'packages/base-frontend/src/store/auth-store.ts'), sourcePath: join(root, 'packages/base-frontend/src/store/auth-store.ts'), tags: ['Store'] },
    { id: 'dim04-layoutStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useLayoutStore', content: '布局状态管理（Pinia Options Store），整合偏好设置和标签页管理，拆分为4个文件。', source: join(root, 'packages/base-frontend/src/store/layout-store.ts'), sourcePath: join(root, 'packages/base-frontend/src/store/layout-store.ts'), tags: ['Store'] },
    { id: 'dim04-appLoadingStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useAppLoadingStore', content: '应用加载状态管理。', source: join(root, 'packages/base-frontend/src/store/app-loading-store.ts'), sourcePath: join(root, 'packages/base-frontend/src/store/app-loading-store.ts'), tags: ['Store'] },
  ];
}

function extractUtils(root: string): KnowledgePoint[] {
  return [
    { id: 'dim04-permissions-util', dimension: 'dim04-frontend', subcategory: '工具函数', title: 'permissions.ts 工具集', content: '前端权限常量与位运算工具集：buildPerValue/parsePerValue/hasPermission/getPermValue/getPermissionOptions/createBusinessPageConfigFn/registerPermissionValues/setPermissionConfig。', source: join(root, 'packages/base-frontend/src/utils/permissions.ts'), sourcePath: join(root, 'packages/base-frontend/src/utils/permissions.ts'), tags: ['utils'] },
    { id: 'dim04-image-util', dimension: 'dim04-frontend', subcategory: '工具函数', title: 'image.ts', content: 'getImageSrc() 从图片资源中提取 URL。', source: join(root, 'packages/base-frontend/src/utils/image.ts'), sourcePath: join(root, 'packages/base-frontend/src/utils/image.ts'), tags: ['utils'] },
  ];
}
