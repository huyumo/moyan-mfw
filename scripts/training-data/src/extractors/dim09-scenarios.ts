import { join } from 'path';
import { existsSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

const SKILL_DOCS = [
  { path: '.trae/skills/mfw-guide/auth/permission-debugging.md', scenarios: ['权限使用场景'] },
  { path: '.trae/skills/mfw-guide/auth/multi-tenant.md', scenarios: ['多租户使用场景'] },
  { path: '.trae/skills/mfw-guide/frontend/new-frontend-page.md', scenarios: ['前端页面配置场景'] },
  { path: '.trae/skills/mfw-guide/auth/routing-auth.md', scenarios: ['路由守卫场景'] },
  { path: '.trae/skills/mfw-guide/backend/new-backend-module.md', scenarios: ['业务权限扩展场景', '审计日志场景'] },
  { path: '.trae/skills/mfw-guide/frontend/form-reference.md', scenarios: ['搜索面板场景', '表单联动场景'] },
  { path: '.trae/skills/mfw-guide/frontend/styling-theming.md', scenarios: ['主题定制场景'] },
  { path: '.trae/skills/mfw-guide/shared/apis-redline.md', scenarios: ['API 自动生成场景'] },
  { path: '.trae/skills/mfw-guide/infra/deployment.md', scenarios: ['安装初始化场景'] },
  { path: 'backend/src/modules/supplier/', scenarios: ['成员档案扩展场景'] },
  { path: 'scripts/generators/plopfile.ts', scenarios: ['代码生成场景'] },
  { path: 'packages/base-frontend/src/components/upload/', scenarios: ['文件上传场景'] },
];

export function extractScenariosDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  for (const doc of SKILL_DOCS) {
    const fullPath = join(projectRoot, doc.path);
    if (doc.path.endsWith('.md') && existsSync(fullPath)) {
      const parsed = parseMarkdown(fullPath);
      const sections = flattenSections(parsed.sections);
      for (const section of sections) {
        if (hasScenarioContent(section.content)) {
          knowledgePoints.push({
            id: `dim09-${doc.scenarios[0]}-${section.title}`,
            dimension: 'dim09-scenarios',
            subcategory: doc.scenarios[0],
            title: section.title,
            content: section.content,
            source: doc.path,
            sourcePath: doc.path,
            tags: doc.scenarios,
          });
        }
      }
    } else {
      knowledgePoints.push({
        id: `dim09-${doc.scenarios[0]}-overview`,
        dimension: 'dim09-scenarios',
        subcategory: doc.scenarios[0],
        title: `${doc.scenarios[0]}概述`,
        content: `源码路径：${doc.path}，场景类型：${doc.scenarios.join('、')}`,
        source: doc.path,
        sourcePath: doc.path,
        tags: doc.scenarios,
      });
    }
  }

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim09-scenarios' })),
    'dim09-scenarios',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function hasScenarioContent(content: string): boolean {
  const scenarioKeywords = ['场景', '用法', '示例', '使用', '配置', '创建', '实现', '流程', '步骤', '何时', '什么时候'];
  return scenarioKeywords.some(kw => content.includes(kw)) && content.trim().length > 20;
}
