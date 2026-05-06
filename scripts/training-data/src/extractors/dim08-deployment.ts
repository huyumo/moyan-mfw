import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { ExtractionResult, KnowledgePoint } from '../types.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';

export function extractDeploymentDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];

  const deployDocPath = join(projectRoot, '.trae/skills/mfw-guide/infra/deployment.md');
  if (existsSync(deployDocPath)) {
    const doc = parseMarkdown(deployDocPath);
    const sections = flattenSections(doc.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim08-deploy-${section.title}`, dimension: 'dim08-deployment',
        subcategory: '部署指南', title: section.title, content: section.content,
        source: deployDocPath, sourcePath: deployDocPath, tags: ['部署', section.title],
      });
    }
  }

  const errorDocPath = join(projectRoot, '.trae/skills/mfw-guide/infra/error-diagnosis.md');
  if (existsSync(errorDocPath)) {
    const doc = parseMarkdown(errorDocPath);
    const sections = flattenSections(doc.sections);
    for (const section of sections) {
      knowledgePoints.push({
        id: `dim08-error-${section.title}`, dimension: 'dim08-deployment',
        subcategory: '错误诊断', title: section.title, content: section.content,
        source: errorDocPath, sourcePath: errorDocPath, tags: ['错误诊断', section.title],
      });
    }
  }

  knowledgePoints.push(...extractDockerConfig(projectRoot));
  knowledgePoints.push(...extractEnvVars(projectRoot));

  const result = generateQAPairs(
    knowledgePoints.map(kp => ({ ...kp, dimension: 'dim08-deployment' })),
    'dim08-deployment',
    DEFAULT_CONFIG.angleWeights
  );

  return result;
}

function extractDockerConfig(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];

  const dockerfilePath = join(root, 'packages/base-backend/Dockerfile');
  if (existsSync(dockerfilePath)) {
    const content = readFileSync(dockerfilePath, 'utf-8');
    kps.push({
      id: 'dim08-dockerfile', dimension: 'dim08-deployment', subcategory: 'Docker',
      title: 'Docker 三阶段构建', content: `Dockerfile 采用三阶段构建：\n1. 构建阶段（build）— 安装依赖、编译 TypeScript\n2. 生产依赖阶段（prod-deps）— 仅安装生产依赖\n3. 运行阶段（run）— 最小化镜像，仅包含运行时文件\n\nDockerfile 内容摘要：\n${content.substring(0, 500)}`,
      codeSnippet: content.substring(0, 300),
      source: dockerfilePath, sourcePath: dockerfilePath, tags: ['Docker', 'Dockerfile'],
    });
  }

  const composePath = join(root, 'backend/docker-compose.yml');
  if (existsSync(composePath)) {
    const content = readFileSync(composePath, 'utf-8');
    kps.push({
      id: 'dim08-docker-compose', dimension: 'dim08-deployment', subcategory: 'Docker',
      title: 'Docker Compose 配置', content: `docker-compose.yml 提供 MySQL 8.0 + Redis 7 的开发环境配置：\n${content.substring(0, 500)}`,
      codeSnippet: content.substring(0, 300),
      source: composePath, sourcePath: composePath, tags: ['Docker', 'Compose'],
    });
  }

  return kps;
}

function extractEnvVars(root: string): KnowledgePoint[] {
  const kps: KnowledgePoint[] = [];

  const backendEnvPath = join(root, 'backend/.env.example');
  if (existsSync(backendEnvPath)) {
    const content = readFileSync(backendEnvPath, 'utf-8');
    const vars = content.split('\n').filter(l => l.includes('=') && !l.startsWith('#'));
    kps.push({
      id: 'dim08-backend-env', dimension: 'dim08-deployment', subcategory: '环境变量',
      title: '后端环境变量（27个）', content: `后端环境变量配置：\n${vars.join('\n')}`,
      source: backendEnvPath, sourcePath: backendEnvPath, tags: ['环境变量', '后端'],
    });
  }

  const frontendEnvPath = join(root, 'frontend/.env.example');
  if (existsSync(frontendEnvPath)) {
    const content = readFileSync(frontendEnvPath, 'utf-8');
    const vars = content.split('\n').filter(l => l.includes('=') && !l.startsWith('#'));
    kps.push({
      id: 'dim08-frontend-env', dimension: 'dim08-deployment', subcategory: '环境变量',
      title: '前端环境变量（5个）', content: `前端环境变量配置：\n${vars.join('\n')}`,
      source: frontendEnvPath, sourcePath: frontendEnvPath, tags: ['环境变量', '前端'],
    });
  }

  return kps;
}
