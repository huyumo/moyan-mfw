import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractBusinessDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  knowledgePoints.push(...extractSupplierModule(projectRoot));
  knowledgePoints.push(...extractBusinessPages(projectRoot));
  knowledgePoints.push(...extractAppTypeConfig(projectRoot));
  knowledgePoints.push(...extractBusinessPermissions(projectRoot));

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim06-business' })),
    'dim06-business',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function extractSupplierModule(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const supplierDir = join(root, 'backend/src/modules/supplier');
  if (!existsSync(supplierDir)) return kps;

  const files = findFiles(supplierDir, /\.ts$/);
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const fileName = file.split('\\').pop()?.split('/').pop() || '';
    kps.push({
      id: `dim06-supplier-${fileName}`,
      dimension: 'dim06-business',
      subcategory: '供应商模块',
      title: `supplier/${fileName}`,
      content: content.substring(0, 500),
      codeSnippet: content.substring(0, 300),
      source: file,
      sourcePath: file,
      tags: ['supplier', fileName],
    });
  }

  kps.push({
    id: 'dim06-supplier-overview',
    dimension: 'dim06-business',
    subcategory: '供应商模块',
    title: '供应商模块完整实现',
    content: 'supplier 是 moyan-mfw 的业务模块示例，包含完整的 Controller/Service/Entity/DTO 实现。文件列表：\n' + files.map(f => '- ' + f).join('\n'),
    source: supplierDir,
    sourcePath: supplierDir,
    tags: ['supplier', '业务模块'],
  });

  return kps;
}

function extractBusinessPages(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const businessDir = join(root, 'frontend/src/views/business');
  if (!existsSync(businessDir)) return kps;

  const pages = ['orders', 'reports'];
  for (const page of pages) {
    const pageDir = join(businessDir, page);
    if (!existsSync(pageDir)) continue;
    kps.push({
      id: `dim06-business-page-${page}`,
      dimension: 'dim06-business',
      subcategory: '业务页面',
      title: `${page} 业务页面`,
      content: `前端业务页面，位于 frontend/src/views/business/${page}/。`,
      source: pageDir,
      sourcePath: pageDir,
      tags: ['业务页面', page],
    });
  }

  return kps;
}

function extractAppTypeConfig(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const configPath = join(root, 'backend/src/app-types.config.ts');
  if (!existsSync(configPath)) return kps;

  const content = readFileSync(configPath, 'utf-8');
  kps.push({
    id: 'dim06-app-types-config',
    dimension: 'dim06-business',
    subcategory: '应用类型配置',
    title: 'app-types.config.ts',
    content: `业务应用类型配置文件，定义了业务级别的 AppType：\n${content.substring(0, 500)}`,
    codeSnippet: content.substring(0, 300),
    source: configPath,
    sourcePath: configPath,
    tags: ['应用类型', '配置'],
  });

  return kps;
}

function extractBusinessPermissions(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const permPath = join(root, 'backend/src/permissions.ts');
  if (!existsSync(permPath)) return kps;

  const content = readFileSync(permPath, 'utf-8');
  kps.push({
    id: 'dim06-business-permissions',
    dimension: 'dim06-business',
    subcategory: '业务权限',
    title: '业务权限值定义',
    content: `业务级别的权限值，定义在 backend/src/permissions.ts 中：\n${content.substring(0, 500)}`,
    codeSnippet: content.substring(0, 300),
    source: permPath,
    sourcePath: permPath,
    tags: ['业务权限'],
  });

  return kps;
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
