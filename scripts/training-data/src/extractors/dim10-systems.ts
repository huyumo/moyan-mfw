import { join } from 'path';
import { existsSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractSystemsDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  const systems = [
    { name: '企业管理后台', capabilities: '用户/角色/权限、多应用、审计日志', path: 'sys 模块' },
    { name: 'SaaS 多租户平台', capabilities: '应用类型隔离、权限池、应用实例', path: 'multi-tenant.md' },
    { name: '供应商管理平台', capabilities: 'supplier 模块完整实现、业务权限扩展', path: 'backend/src/modules/supplier/' },
    { name: '运维监控平台', capabilities: '权限控制、健康检查、审计日志', path: 'monitor 模块' },
    { name: '内容管理系统 (CMS)', capabilities: '权限树、角色体系、菜单管理', path: 'sys/permission' },
    { name: '数据报表平台', capabilities: '分页查询、权限控制、角色分配', path: 'business/reports' },
    { name: '订单管理系统', capabilities: '业务权限（上架/发货/退款）、MfwListPage', path: 'business/orders' },
    { name: '安装向导系统', capabilities: '系统初始化、种子数据、一键部署', path: 'sys/install' },
    { name: '文件管理平台', capabilities: 'MfwUpload、图片裁剪、OSS 上传', path: 'components/upload' },
    { name: '主题定制平台', capabilities: '9 套主题、暗色模式、CSS 变量', path: 'styling-theming.md' },
  ];

  for (const sys of systems) {
    knowledgePoints.push({
      id: `dim10-system-${sys.name}`,
      dimension: 'dim10-systems',
      subcategory: '可构建系统',
      title: sys.name,
      content: `使用 moyan-mfw 可构建「${sys.name}」。\n\n关键能力：${sys.capabilities}\n相关源码：${sys.path}\n\n架构路径：利用框架的 ${sys.capabilities.split('、').slice(0, 2).join(' + ')} 作为核心，扩展业务模块实现。`,
      source: sys.path,
      sourcePath: sys.path,
      tags: ['可构建系统', sys.name],
    });
  }

  knowledgePoints.push({
    id: 'dim10-from-zero',
    dimension: 'dim10-systems',
    subcategory: '搭建流程',
    title: '从零到一搭建流程',
    content: '1. pnpm install 安装依赖\n2. 配置 .env（数据库/Redis/JWT）\n3. pnpm run dev:backend 启动后端\n4. 访问 /install 完成系统初始化\n5. pnpm run dev:frontend 启动前端\n6. 使用 pnpm gen:module 创建业务模块\n7. 使用 pnpm gen:page 创建业务页面\n8. pnpm run api:build 生成前端 API\n9. 配置应用类型和权限池\n10. 分配角色和权限',
    source: '',
    sourcePath: '',
    tags: ['搭建流程'],
  });

  knowledgePoints.push({
    id: 'dim10-combination',
    dimension: 'dim10-systems',
    subcategory: '系统组合',
    title: '多系统组合方案',
    content: 'moyan-mfw 支持通过多应用类型实现多系统组合：\n1. 创建不同的 AppType（如：内部管理 + 供应商门户）\n2. 为每个 AppType 配置独立的权限池\n3. 创建 App 实例，绑定 ownerId\n4. 添加成员并分配对应角色\n5. 前端通过 AppSelector 切换应用上下文',
    source: '',
    sourcePath: '',
    tags: ['组合方案', '多应用类型'],
  });

  const multiTenantPath = join(projectRoot, '.trae/skills/mfw-guide/auth/multi-tenant.md');
  if (existsSync(multiTenantPath)) {
    const doc = parseMarkdown(multiTenantPath);
    const sections = flattenSections(doc.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim10-multitenant-${section.title}`,
        dimension: 'dim10-systems',
        subcategory: '多租户实现',
        title: section.title,
        content: section.content,
        source: multiTenantPath,
        sourcePath: multiTenantPath,
        tags: ['多租户', section.title],
      });
    }
  }

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim10-systems' })),
    'dim10-systems',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}
