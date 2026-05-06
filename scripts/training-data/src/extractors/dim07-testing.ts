import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractTestingDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  const testingDocPath = join(projectRoot, '.trae/skills/mfw-guide/infra/testing-guide.md');
  if (existsSync(testingDocPath)) {
    const doc = parseMarkdown(testingDocPath);
    const sections = flattenSections(doc.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim07-testing-${section.title}`, dimension: 'dim07-testing',
        subcategory: '测试规范', title: section.title, content: section.content,
        source: testingDocPath, sourcePath: testingDocPath, tags: ['测试', section.title],
      });
    }
  }

  const testReadmePath = join(projectRoot, 'packages/base-backend/tests/README.md');
  if (existsSync(testReadmePath)) {
    const doc = parseMarkdown(testReadmePath);
    const sections = flattenSections(doc.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim07-testenv-${section.title}`, dimension: 'dim07-testing',
        subcategory: '测试环境', title: section.title, content: section.content,
        source: testReadmePath, sourcePath: testReadmePath, tags: ['测试环境', section.title],
      });
    }
  }

  knowledgePoints.push(...extractTestModules(projectRoot));
  knowledgePoints.push(...extractTestConfig(projectRoot));

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim07-testing' })),
    'dim07-testing',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function extractTestModules(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];
  const testDir = join(root, 'packages/base-backend/tests/integration');
  if (!existsSync(testDir)) return kps;

  const testFiles = readdirSync(testDir).filter(f => f.endsWith('.spec.ts'));
  for (const file of testFiles) {
    kps.push({
      id: `dim07-test-${file}`, dimension: 'dim07-testing',
      subcategory: '集成测试', title: `集成测试: ${file}`,
      content: `后端集成测试文件 ${file}，位于 packages/base-backend/tests/integration/。`,
      source: join(testDir, file), sourcePath: join(testDir, file), tags: ['集成测试', file],
    });
  }

  return kps;
}

function extractTestConfig(root: string): KnowledgePoint[] {
  return [
    { id: 'dim07-jest-config', dimension: 'dim07-testing', subcategory: '测试配置',
      title: 'Jest 配置', content: '后端使用 Jest 30 + ts-jest 进行集成测试。配置文件：packages/base-backend/jest.config.ts。测试环境需配置 .env.test 文件。', source: '', sourcePath: '', tags: ['Jest', '配置'] },
    { id: 'dim07-coverage', dimension: 'dim07-testing', subcategory: '测试配置',
      title: '覆盖率要求', content: '后端集成测试覆盖率要求 >= 70%。运行 pnpm test:cov 查看覆盖率报告。', source: '', sourcePath: '', tags: ['覆盖率'] },
    { id: 'dim07-test-utils', dimension: 'dim07-testing', subcategory: '测试工具',
      title: '测试工具链', content: '后端：Jest + ts-jest + supertest + @nestjs/testing。前端：vitest + @vue/test-utils + jsdom。测试工厂：test-app.factory.ts 提供完整的测试应用实例。', source: '', sourcePath: '', tags: ['工具链'] },
  ];
}
