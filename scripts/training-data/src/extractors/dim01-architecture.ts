import { join } from 'path';
import { existsSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractArchitectureDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  const skillDocs = [
    { path: '.trae/skills/mfw-guide/shared/project-structure.md', subcategory: '项目结构' },
    { path: '.trae/skills/mfw-guide/SKILL.md', subcategory: '红线与经验' },
    { path: '.trae/skills/mfw-guide/shared/coding-conventions.md', subcategory: '编码规范' },
    { path: '.trae/skills/mfw-guide/shared/apis-redline.md', subcategory: 'API红线' },
  ];

  for (const doc of skillDocs) {
    const fullPath = join(projectRoot, doc.path);
    if (!existsSync(fullPath)) continue;
    const parsed = parseMarkdown(fullPath);
    const sections = flattenSections(parsed.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim01-${doc.subcategory}-${section.title}`,
        dimension: 'dim01-architecture',
        subcategory: doc.subcategory,
        title: section.title,
        content: section.content,
        source: doc.path,
        sourcePath: doc.path,
        tags: [doc.subcategory, section.title],
      });
    }
  }

  knowledgePoints.push(...extractCoreCapabilities());
  knowledgePoints.push(...extractFrameworkBoundaries());
  knowledgePoints.push(...extractExperienceLessons());
  knowledgePoints.push(...extractApiAutoGeneration());

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim01-architecture' })),
    'dim01-architecture',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function extractCoreCapabilities(): KnowledgePoint[] {
  const capabilities = [
    { title: '用户管理', content: '创建/编辑/删除/软删除/状态管理/密码重置' },
    { title: '角色管理', content: '全局角色/应用类型角色/应用实例角色、内置角色、拥有者角色' },
    { title: '权限管理', content: '树形权限结构、PC/普通权限类型、位运算细粒度控制' },
    { title: '应用管理', content: '应用类型定义、应用实例创建、成员管理、权限池配置' },
    { title: '认证体系', content: 'JWT 登录/注册/刷新/登出、Token 自动刷新' },
    { title: '审计日志', content: '操作审计、模块分类、数据快照' },
    { title: '文件上传', content: '简单 URL 存储、图片/媒体/文件资源类型' },
    { title: '系统初始化', content: '一键初始化、种子数据' },
    { title: '前端框架', content: '自动路由扫描、权限菜单、组件库、主题系统、布局系统' },
  ];

  return capabilities.map(cap => ({
    id: `dim01-capability-${cap.title}`,
    dimension: 'dim01-architecture',
    subcategory: '核心能力',
    title: cap.title,
    content: cap.content,
    source: '',
    sourcePath: '',
    tags: ['核心能力', cap.title],
  }));
}

function extractFrameworkBoundaries(): KnowledgePoint[] {
  const boundaries = [
    { title: '不提供复杂文件存储', content: '仅简单 URL 存储，复杂需求需外部 OSS' },
    { title: '不提供消息队列', content: 'Redis 配置已预留但未使用' },
    { title: '不提供工作流引擎', content: '框架不支持工作流' },
    { title: '不提供实时通讯', content: '不支持 WebSocket' },
    { title: '不提供搜索引擎集成', content: '不集成 Elasticsearch 等搜索引擎' },
  ];

  return boundaries.map(b => ({
    id: `dim01-boundary-${b.title}`,
    dimension: 'dim01-architecture',
    subcategory: '框架边界',
    title: b.title,
    content: b.content,
    source: '',
    sourcePath: '',
    tags: ['框架边界', b.title],
  }));
}

function extractExperienceLessons(): KnowledgePoint[] {
  const lessons = [
    { title: 'apis/ 手写必被覆盖', content: '修改后端后运行 pnpm run api:build 重新生成' },
    { title: 'PowerShell 不支持 &&', content: '用 ; 分隔命令' },
    { title: '删除操作必须二次确认', content: 'ElMessageBox.confirm，catch 后 return' },
    { title: 'API 删除操作传 hintSuccess', content: 'API 删除操作传 { hintSuccess: true } 参数' },
    { title: '状态常量统一定义', content: 'const STATUS = { ENABLED: 1, DISABLED: 0 } as const' },
    { title: '前端路由自动扫描', content: '页面放在 views/ 下配置 index.ts 即自动注册' },
    { title: '审计拦截器当前仅输出日志', content: '未写入 sys_audit_logs' },
    { title: '获取用户信息用 @User()', content: '不要用 @Request() req.user' },
    { title: 'views/ 目录只允许存放页面路由组件', content: '弹窗/面板/表单等非路由组件放 components/' },
    { title: '导入路径必须从文件实际位置计算', content: '移动文件后必须立即修正所有导入' },
    { title: '组件默认导出 vs 命名导出', content: '默认导出用 import X from，命名导出用 import { X } from' },
    { title: '文字颜色必须使用 CSS 变量', content: 'var(--el-text-color-*)，禁止 color: inherit' },
    { title: '布局扩展组件放 components/layout/', content: '不是 views/' },
    { title: 'Redis 配置已预留但未使用', content: '业务层未使用 Redis' },
  ];

  return lessons.map(l => ({
    id: `dim01-lesson-${l.title}`,
    dimension: 'dim01-architecture',
    subcategory: '经验教训',
    title: l.title,
    content: l.content,
    source: '',
    sourcePath: '',
    tags: ['经验教训', l.title],
  }));
}

function extractApiAutoGeneration(): KnowledgePoint[] {
  return [
    {
      id: 'dim01-api-auto-gen',
      dimension: 'dim01-architecture',
      subcategory: 'API 自动生成',
      title: 'API 自动生成机制',
      content: 'moyan-mfw 使用 moyan-api 工具从后端 Swagger 自动生成前端 API 代码到 apis/ 目录。核心规则：禁止手动修改 apis/ 目录，任何修改都会被下次生成覆盖。修改后端后必须运行 pnpm run api:build 重新生成。',
      codeSnippet: 'pnpm run api:build',
      source: '',
      sourcePath: '',
      tags: ['API', 'moyan-api'],
    },
    {
      id: 'dim01-plop-gen',
      dimension: 'dim01-architecture',
      subcategory: '代码生成',
      title: 'plop 代码生成指令',
      content: '项目提供 pnpm gen:module / pnpm gen:page / pnpm gen:component 命令，通过交互式 prompt 收集模块元数据后输出结构化生成指令，由 AI Agent 据此生成代码。plop 只负责参数收集和指令输出，不直接生成文件。',
      codeSnippet: 'pnpm gen:module\npnpm gen:page\npnpm gen:component',
      source: '',
      sourcePath: '',
      tags: ['plop', '代码生成'],
    },
  ];
}
