import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractCodeReviewDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  knowledgePoints.push(...extractRedLines(projectRoot));
  knowledgePoints.push(...extractESLintRules(projectRoot));
  knowledgePoints.push(...extractNamingConventions(projectRoot));
  knowledgePoints.push(...extractCommentConventions(projectRoot));

  // Extract from markdown docs if they exist
  const docSources = [
    { path: '.trae/skills/mfw-guide/shared/coding-conventions.md', subcategory: '编码规范文档' },
    { path: '.trae/skills/mfw-guide/shared/apis-redline.md', subcategory: 'API红线文档' },
  ];

  for (const doc of docSources) {
    const fullPath = join(projectRoot, doc.path);
    if (!existsSync(fullPath)) continue;
    const parsed = parseMarkdown(fullPath);
    const sections = flattenSections(parsed.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim05-doc-${doc.subcategory}-${section.title}`,
        dimension: 'dim05-code-review',
        subcategory: doc.subcategory,
        title: section.title,
        content: section.content,
        source: doc.path,
        sourcePath: doc.path,
        tags: [doc.subcategory, section.title],
      });
    }
  }

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim05-code-review' })),
    'dim05-code-review',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function extractRedLines(root: string): KnowledgePoint[] {
  const redLines = [
    {
      title: '禁止手动修改 apis/ 目录',
      content: 'apis/ 目录由 moyan-api 工具自动生成，手动修改必被覆盖。5种违规场景：1.API返回类型不正确 2.需要新增API方法 3.API路径不对 4.想加类型导出 5.改小注释。正确做法：修改后端后运行 pnpm run api:build。',
      codeSnippet: 'pnpm run api:build',
    },
    {
      title: '禁止 QueryBuilder 分页查询',
      content: '统一使用 PaginationX + WhereBuilder，基于原生 SQL，参数化防注入。例外：复杂关联查询/子查询 PaginationX 不支持时，可使用 QueryBuilder，但须经 Review 确认。',
    },
    {
      title: '禁止硬编码 JWT Secret',
      content: '当前为测试值，部署必须修改 JWT_SECRET 环境变量。',
    },
  ];

  return redLines.map(rl => ({
    id: `dim05-redline-${rl.title}`,
    dimension: 'dim05-code-review',
    subcategory: '红线规则',
    title: rl.title,
    content: rl.content,
    codeSnippet: rl.codeSnippet,
    source: '',
    sourcePath: '',
    tags: ['红线', rl.title],
  }));
}

function extractESLintRules(root: string): KnowledgePoint[] {
  const eslintPath = join(root, 'eslint.config.mjs');
  const rules = [
    {
      title: 'moyan/comment-compliance',
      content: '自定义 ESLint 规则，要求每个文件顶部必须有 @fileoverview + @description 注释。违反此规则将报错。',
    },
    {
      title: 'max-lines (1000/200)',
      content: 'TypeScript 文件最大 1000 行，类型文件最大 200 行。超过限制将报错。',
    },
    {
      title: 'TSX 组件 Mfw 前缀',
      content: 'TSX 组件命名规则：必须以 Mfw 前缀开头。',
    },
    {
      title: 'Controller 导入限制',
      content: 'Controller 文件中禁止：1.直接导入 @nestjs/swagger 2.使用 Req/Res/Request/Response 注解 3.导入 Mfw*Response 核心类型。',
    },
  ];

  return rules.map(r => ({
    id: `dim05-eslint-${r.title}`,
    dimension: 'dim05-code-review',
    subcategory: 'ESLint 规则',
    title: r.title,
    content: r.content,
    source: existsSync(eslintPath) ? eslintPath : '',
    sourcePath: existsSync(eslintPath) ? eslintPath : '',
    tags: ['ESLint', r.title],
  }));
}

function extractNamingConventions(root: string): KnowledgePoint[] {
  const conventions = [
    { title: '文件名 kebab-case', content: '所有文件名使用 kebab-case：user.service.ts / create-user.dto.ts' },
    { title: '类名 PascalCase', content: '类名使用 PascalCase：UserService / CreateUserDto' },
    { title: '函数/方法 camelCase', content: '函数和方法使用 camelCase：findById / handleAdd' },
    { title: '常量 UPPER_SNAKE_CASE', content: '常量使用 UPPER_SNAKE_CASE：STATUS.ENABLED / AUTH_TOKEN_KEY' },
    { title: '布尔变量 is/has/can 前缀', content: '布尔变量使用 is/has/can 前缀：isAuthenticated / hasPermission / canEdit' },
    { title: '事件处理 handle 前缀', content: '事件处理函数使用 handle 前缀：handleAdd / handleDelete / handleEdit' },
    { title: 'Entity 单数名词', content: 'Entity 类使用单数名词：User / AppType / RolePermission' },
    { title: '表名 snake_case 复数', content: '数据库表名使用 snake_case 复数：sys_users / sys_app_types' },
    { title: '权限编码 小写+冒号', content: '权限编码使用小写+冒号分隔：pc_root:sys:user' },
    { title: '组件注册名 Mfw 前缀', content: '组件注册名使用 PascalCase + Mfw 前缀：MfwFormCard' },
    { title: 'CSS 类名 mfw- 前缀', content: 'CSS 类名使用 BEM + mfw- 前缀：.mfw-card / .mfw-card__header' },
  ];

  return conventions.map(c => ({
    id: `dim05-naming-${c.title}`,
    dimension: 'dim05-code-review',
    subcategory: '命名规范',
    title: c.title,
    content: c.content,
    source: '',
    sourcePath: '',
    tags: ['命名', c.title],
  }));
}

function extractCommentConventions(root: string): KnowledgePoint[] {
  const commentRules = [
    {
      title: '文件顶部 @fileoverview + @description',
      content: '每个文件顶部必须有 @fileoverview 和 @description 注释。这是 moyan/comment-compliance ESLint 规则强制要求的。',
    },
    { title: '类/接口描述注释', content: '类和接口必须有描述注释。' },
    { title: '公共方法 JSDoc', content: '公共方法必须有 JSDoc，含 @param 和 @returns。' },
    { title: '常量定义注释', content: '常量定义使用 /** 注释 */ 格式。' },
    { title: '禁止无意义注释', content: '禁止如 // 赋值 这样的无意义注释。' },
  ];

  return commentRules.map(c => ({
    id: `dim05-comment-${c.title}`,
    dimension: 'dim05-code-review',
    subcategory: '注释规范',
    title: c.title,
    content: c.content,
    source: '',
    sourcePath: '',
    tags: ['注释', c.title],
  }));
}
