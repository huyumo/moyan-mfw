import { join } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';
import { generateControllerQAs, generateServiceQAs, generatePaginationQAs, generateModuleStandardQAs } from '../templates/backend-templates.js';

const SYS_MODULES = ['auth', 'user', 'role', 'permission', 'app', 'app-type', 'audit-log', 'upload', 'install'];

export function extractBackendModuleDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];
  const customQAs: any[] = [];

  for (const mod of SYS_MODULES) {
    const modPath = join(projectRoot, 'packages/base-backend/src/modules/sys', mod);
    if (!existsSync(modPath)) continue;

    const ctrlResult = extractControllersFromModule(projectRoot, mod, modPath);
    knowledgePoints.push(...ctrlResult.kps);
    customQAs.push(...ctrlResult.qas);

    const svcResult = extractServicesFromModule(projectRoot, mod, modPath);
    knowledgePoints.push(...svcResult.kps);
    customQAs.push(...svcResult.qas);

    knowledgePoints.push(...extractEntitiesFromModule(projectRoot, mod, modPath));
    knowledgePoints.push(...extractDTOsFromModule(projectRoot, mod, modPath));
  }

  const paginationKps = extractPaginationSpec(projectRoot);
  knowledgePoints.push(...paginationKps);

  const standardKps = extractModuleStandard(projectRoot);
  knowledgePoints.push(...standardKps);

  knowledgePoints.push(...extractSeedData(projectRoot));
  knowledgePoints.push(...extractExceptionTypes(projectRoot));

  customQAs.push(...generatePaginationQAs());
  customQAs.push(...generateModuleStandardQAs());

  const genericResult = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim03-backend-module' })),
    'dim03-backend-module',
    DEFAULT_CONFIG.angleWeights
  );

  const allQAs = [...customQAs, ...genericResult.qaPairs];

  return {
    dimension: 'dim03-backend-module',
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

function extractControllersFromModule(root: string, mod: string, modPath: string): { kps: KnowledgePoint[]; qas: any[] } {
  const kps: KnowledgePoint[] = [];
  const qas: any[] = [];
  const controllerFiles = findFiles(modPath, /\.controller\.ts$/);

  for (const file of controllerFiles) {
    const content = readFileSync(file, 'utf-8');
    const endpointMatches = [...content.matchAll(/@(Get|Post|Put|Patch|Delete)\(['"](.*?)['"]\).*?(?:async\s+)?(\w+)\s*\(/gs)];
    const endpoints = endpointMatches.map(m => `${m[1]} /${m[2]} → ${m[3]}`);

    kps.push({
      id: `dim03-ctrl-${mod}-${file}`,
      dimension: 'dim03-backend-module',
      subcategory: `Controller:${mod}`,
      title: `${mod} Controller`,
      content: `端点列表：\n${endpoints.join('\n')}`,
      codeSnippet: content.substring(0, 800),
      source: file, sourcePath: file, tags: ['Controller', mod],
    });

    qas.push(...generateControllerQAs(mod, endpoints, file));

    for (const m of endpointMatches) {
      kps.push({
        id: `dim03-endpoint-${mod}-${m[3]}`,
        dimension: 'dim03-backend-module',
        subcategory: `端点:${mod}`,
        title: `${mod} ${m[3]}()`,
        content: `HTTP ${m[1]} /${m[2]}，方法名 ${m[3]}()。属于 ${mod} 模块的 Controller。`,
        source: file, sourcePath: file, tags: ['端点', mod, m[3]],
      });
    }
  }

  return { kps, qas };
}

function extractServicesFromModule(root: string, mod: string, modPath: string): { kps: KnowledgePoint[]; qas: any[] } {
  const kps: KnowledgePoint[] = [];
  const qas: any[] = [];
  const serviceFiles = findFiles(modPath, /\.service\.ts$/);

  for (const file of serviceFiles) {
    const content = readFileSync(file, 'utf-8');
    const methodMatches = [...content.matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g)];
    const methods = methodMatches.map(m => m[1]).filter(n => n !== 'constructor' && !n.startsWith('_'));

    kps.push({
      id: `dim03-svc-${mod}`,
      dimension: 'dim03-backend-module',
      subcategory: `Service:${mod}`,
      title: `${mod} Service`,
      content: `方法列表：\n${methods.join('\n')}`,
      source: file, sourcePath: file, tags: ['Service', mod],
    });

    qas.push(...generateServiceQAs(mod, methods, file));
  }

  return { kps, qas };
}

function extractEntitiesFromModule(root: string, mod: string, modPath: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const entityDir = join(modPath, 'entities');
  if (!existsSync(entityDir)) return kps;

  for (const file of readdirSync(entityDir).filter(f => f.endsWith('.entity.ts'))) {
    const fullPath = join(entityDir, file);
    const content = readFileSync(fullPath, 'utf-8');
    const fieldMatches = [...content.matchAll(/@(\w+)(?:\([^)]*\))?\s*(?:public\s+)?(\w+)\s*[:?]/g)];
    const fields = fieldMatches.map(m => `${m[2]} (${m[1]})`);

    kps.push({
      id: `dim03-entity-${mod}-${file}`,
      dimension: 'dim03-backend-module',
      subcategory: `Entity:${mod}`,
      title: `${file.replace('.entity.ts', '')} Entity`,
      content: `字段：\n${fields.join('\n')}`,
      codeSnippet: content.substring(0, 500),
      source: fullPath, sourcePath: fullPath, tags: ['Entity', mod],
    });
  }

  return kps;
}

function extractDTOsFromModule(root: string, mod: string, modPath: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const dtoDir = join(modPath, 'dto');
  if (!existsSync(dtoDir)) return kps;

  const dtoFiles = findFiles(dtoDir, /\.dto\.ts$/);
  for (const file of dtoFiles) {
    const content = readFileSync(file, 'utf-8');
    const className = content.match(/export\s+class\s+(\w+)/)?.[1] || file;

    kps.push({
      id: `dim03-dto-${mod}-${className}`,
      dimension: 'dim03-backend-module',
      subcategory: `DTO:${mod}`,
      title: className,
      content: content.substring(0, 500),
      codeSnippet: content.substring(0, 300),
      source: file, sourcePath: file, tags: ['DTO', mod, className],
    });
  }

  return kps;
}

function extractPaginationSpec(root: string): KnowledgePoint[] {
  const docPath = join(root, '.trae/skills/mfw-guide/backend/pagination-query.md');
  if (!existsSync(docPath)) return [];
  const doc = parseMarkdown(docPath);
  const sections = flattenSections(doc.sections);
  return sections.map(s => ({
    id: `dim03-pagination-${s.title}`, dimension: 'dim03-backend-module',
    subcategory: 'PaginationX', title: s.title, content: s.content,
    source: docPath, sourcePath: docPath, tags: ['PaginationX', 'WhereBuilder'],
  }));
}

function extractModuleStandard(root: string): KnowledgePoint[] {
  const docPath = join(root, '.trae/skills/mfw-guide/backend/new-backend-module.md');
  if (!existsSync(docPath)) return [];
  const doc = parseMarkdown(docPath);
  const sections = flattenSections(doc.sections);
  return sections.map(s => ({
    id: `dim03-standard-${s.title}`, dimension: 'dim03-backend-module',
    subcategory: '模块规范', title: s.title, content: s.content,
    source: docPath, sourcePath: docPath, tags: ['规范'],
  }));
}

function extractSeedData(root: string): KnowledgePoint[] {
  return [{ id: 'dim03-seeds', dimension: 'dim03-backend-module', subcategory: '种子数据',
    title: '种子数据 8 步流程', content: '种子数据初始化包含8个步骤：1.创建角色 2.创建权限树 3.关联角色权限 4.创建管理员用户 5.分配管理员角色 6.创建应用类型 7.配置权限池 8.创建内置应用',
    source: join(root, 'packages/base-backend/src/database/seeds/index.ts'),
    sourcePath: join(root, 'packages/base-backend/src/database/seeds/index.ts'), tags: ['种子数据'] }];
}

function extractExceptionTypes(root: string): KnowledgePoint[] {
  return [
    { id: 'dim03-exceptions', dimension: 'dim03-backend-module', subcategory: '异常类型',
      title: '异常类型体系', content: 'moyan-mfw 提供以下异常类：\n- NotFoundError(\'资源名\') → 404\n- ForbiddenError() → 403\n- UnauthorizedError() → 401\n- BusinessException(msg) → 400\n- ConflictException(msg) → 409\n- BadRequestException(msg) → 400',
      source: join(root, 'packages/base-backend/src/common/exceptions/'),
      sourcePath: join(root, 'packages/base-backend/src/common/exceptions/'), tags: ['异常'] },
  ];
}

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}
