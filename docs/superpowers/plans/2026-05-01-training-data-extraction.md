# moyan-mfw 训练数据提取 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 moyan-mfw 项目源码中自动化提取 10,000+ 条 SFT 训练数据，生成 MiniMind 兼容的 JSONL 文件

**Architecture:** 构建一套 TypeScript 提取脚本管道：源码解析（ts-morph AST + Markdown parser）→ 知识点提取 → 多角度 Q&A 生成 → 质量校验 → JSONL 输出。分 3 批迭代，每批包含提取、校验、合并 3 个阶段。

**Tech Stack:** TypeScript, ts-morph (AST), gray-matter (Markdown), tiktoken (token 计数), Node.js

**Spec:** `docs/superpowers/specs/2026-05-01-training-data-extraction-design.md`

---

## 文件结构

```
scripts/training-data/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                          # 主入口 - 编排所有提取器
│   ├── types.ts                          # 共享类型定义
│   ├── utils/
│   │   ├── ast-parser.ts                 # TypeScript AST 解析（ts-morph）
│   │   ├── markdown-parser.ts            # Markdown + YAML front matter 解析
│   │   ├── qa-generator.ts              # 多角度 Q&A 生成引擎
│   │   ├── jsonl-formatter.ts           # JSONL 输出格式化
│   │   ├── token-counter.ts             # Token 长度估算
│   │   └── validator.ts                 # 质量校验（去重/长度/准确性）
│   ├── extractors/
│   │   ├── dim01-architecture.ts
│   │   ├── dim02-permission.ts
│   │   ├── dim03-backend-module.ts
│   │   ├── dim04-frontend.ts
│   │   ├── dim05-code-review.ts
│   │   ├── dim06-business.ts
│   │   ├── dim07-testing.ts
│   │   ├── dim08-deployment.ts
│   │   ├── dim09-scenarios.ts
│   │   └── dim10-systems.ts
│   └── templates/
│       ├── permission-templates.ts
│       ├── component-templates.ts
│       ├── backend-templates.ts
│       └── scenario-templates.ts
├── output/                               # 生成的 JSONL 文件
│   ├── dim01-architecture.jsonl
│   ├── ...（每个维度一个文件）
│   ├── batch01.jsonl
│   ├── batch02.jsonl
│   └── batch03.jsonl
└── data/
    ├── manual-supplements/               # 人工编排的补充数据
    └── test-set/                         # 预留测试集（不参与训练）
        └── test-set.jsonl
```

---

## Task 1: 项目脚手架搭建

**Files:**
- Create: `scripts/training-data/package.json`
- Create: `scripts/training-data/tsconfig.json`
- Create: `scripts/training-data/src/types.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "moyan-mfw-training-data",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "extract": "tsx src/index.ts",
    "extract:batch1": "tsx src/index.ts --batch 1",
    "extract:batch2": "tsx src/index.ts --batch 2",
    "extract:batch3": "tsx src/index.ts --batch 3",
    "validate": "tsx src/index.ts --validate-only",
    "stats": "tsx src/index.ts --stats"
  },
  "dependencies": {
    "ts-morph": "^21.0.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "output"]
}
```

- [ ] **Step 3: 创建共享类型定义 types.ts**

```typescript
export interface QAPair {
  conversations: Conversation[];
  metadata?: QAMetadata;
}

export interface Conversation {
  role: 'user' | 'assistant';
  content: string;
}

export interface QAMetadata {
  dimension: string;
  subcategory: string;
  source: string;
  angle: QAAngle;
  timestamp: string;
}

export type QAAngle =
  | 'what'
  | 'how'
  | 'when'
  | 'caution'
  | 'compare'
  | 'troubleshoot';

export interface KnowledgePoint {
  id: string;
  dimension: string;
  subcategory: string;
  title: string;
  content: string;
  codeSnippet?: string;
  source: string;
  sourcePath: string;
  tags: string[];
}

export interface ExtractionResult {
  dimension: string;
  knowledgePoints: KnowledgePoint[];
  qaPairs: QAPair[];
  stats: {
    totalKnowledgePoints: number;
    totalQAPairs: number;
    byAngle: Record<QAAngle, number>;
    bySubcategory: Record<string, number>;
  };
}

export interface ValidationResult {
  total: number;
  passed: number;
  failed: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  rule: string;
  message: string;
  content: string;
}

export interface ValidationWarning {
  line: number;
  rule: string;
  message: string;
}

export interface ExtractorConfig {
  projectRoot: string;
  outputPath: string;
  batchSize?: number;
  maxTokensPerEntry: number;
  angleWeights: Record<QAAngle, number>;
}

export const DEFAULT_CONFIG: ExtractorConfig = {
  projectRoot: '',
  outputPath: '',
  maxTokensPerEntry: 2048,
  angleWeights: {
    what: 1,
    how: 1,
    when: 1,
    caution: 0.5,
    compare: 0.3,
    troubleshoot: 0.3,
  },
};

export const DIMENSIONS = [
  'dim01-architecture',
  'dim02-permission',
  'dim03-backend-module',
  'dim04-frontend',
  'dim05-code-review',
  'dim06-business',
  'dim07-testing',
  'dim08-deployment',
  'dim09-scenarios',
  'dim10-systems',
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const BATCH_MAP: Record<number, Dimension[]> = {
  1: ['dim02-permission', 'dim04-frontend', 'dim03-backend-module', 'dim09-scenarios'],
  2: ['dim05-code-review', 'dim01-architecture', 'dim10-systems', 'dim06-business'],
  3: ['dim07-testing', 'dim08-deployment'],
};
```

- [ ] **Step 4: 安装依赖**

Run: `cd scripts/training-data && pnpm install`
Expected: 依赖安装成功

- [ ] **Step 5: 提交**

```bash
git add scripts/training-data/
git commit -m "feat(training-data): scaffold extraction scripts"
```

---

## Task 2: 核心工具函数 - JSONL 格式化器

**Files:**
- Create: `scripts/training-data/src/utils/jsonl-formatter.ts`

- [ ] **Step 1: 实现 JSONL 格式化器**

```typescript
import type { QAPair, ValidationResult, ValidationError, ValidationWarning } from '../types.js';

export function formatQAtoJSONL(qa: QAPair): string {
  const output: QAPair = {
    conversations: qa.conversations.map((c) => ({
      role: c.role,
      content: c.content,
    })),
  };
  return JSON.stringify(output, null, 0);
}

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'path';

export function writeJSONL(qaPairs: QAPair[], filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const lines = qaPairs.map(formatQAtoJSONL).join('\n');
  writeFileSync(filePath, lines + '\n', 'utf-8');
}

export function readJSONL(filePath: string): QAPair[] {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string, index: number) => {
      try {
        return JSON.parse(line) as QAPair;
      } catch {
        throw new Error(`Invalid JSON at line ${index + 1} in ${filePath}`);
      }
    });
}

export function mergeJSONLFiles(filePaths: string[], outputPath: string): void {
  const allPairs: QAPair[] = [];
  for (const fp of filePaths) {
    allPairs.push(...readJSONL(fp));
  }
  writeJSONL(allPairs, outputPath);
}

export function splitTestSet(
  qaPairs: QAPair[],
  testRatio: number = 0.05
): { train: QAPair[]; test: QAPair[] } {
  const shuffled = [...qaPairs].sort(() => Math.random() - 0.5);
  const testCount = Math.max(50, Math.floor(shuffled.length * testRatio));
  return {
    test: shuffled.slice(0, testCount),
    train: shuffled.slice(testCount),
  };
}
```

- [ ] **Step 2: 验证 JSONL 格式正确性**

Run: `cd scripts/training-data && tsx -e "import {formatQAtoJSONL} from './src/utils/jsonl-formatter.js'; const qa = {conversations: [{role: 'user', content: 'test'}, {role: 'assistant', content: 'answer'}]}; console.log(formatQAtoJSONL(qa));"`
Expected: 输出合法 JSONL 行

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/jsonl-formatter.ts
git commit -m "feat(training-data): add JSONL formatter utility"
```

---

## Task 3: 核心工具函数 - Token 计数器

**Files:**
- Create: `scripts/training-data/src/utils/token-counter.ts`

- [ ] **Step 1: 实现 Token 计数器**

```typescript
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const codeChars = (text.match(/[a-zA-Z0-9_]/g) || []).length;
  const otherChars = text.length - chineseChars - codeChars;
  return Math.ceil(
    chineseChars * 1.5 + codeChars / 4 + otherChars / 3
  );
}

export function truncateToTokenLimit(
  content: string,
  maxTokens: number = 2048
): string {
  const tokens = estimateTokens(content);
  if (tokens <= maxTokens) return content;
  const ratio = maxTokens / tokens;
  const targetLength = Math.floor(content.length * ratio * 0.95);
  const truncated = content.substring(0, targetLength);
  const lastNewline = truncated.lastIndexOf('\n');
  return lastNewline > targetLength * 0.8
    ? truncated.substring(0, lastNewline) + '\n...'
    : truncated + '...';
}

export function validateTokenLength(content: string, maxTokens: number = 2048): boolean {
  return estimateTokens(content) <= maxTokens;
}
```

- [ ] **Step 2: 验证 Token 计数准确性**

Run: `cd scripts/training-data && tsx -e "import {estimateTokens} from './src/utils/token-counter.js'; console.log(estimateTokens('moyan-mfw 中 MfwListPage 的 showPagination 属性是什么？')); console.log(estimateTokens('const x = 1 + 2;'));"`
Expected: 中文输出约 15-20 tokens，英文代码约 3-5 tokens

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/token-counter.ts
git commit -m "feat(training-data): add token counter utility"
```

---

## Task 4: 核心工具函数 - TypeScript AST 解析器

**Files:**
- Create: `scripts/training-data/src/utils/ast-parser.ts`

- [ ] **Step 1: 实现 AST 解析器**

```typescript
import { Project, SourceFile, InterfaceDeclaration, TypeAliasDeclaration, SyntaxKind, PropertySignature, MethodDeclaration } from 'ts-morph';
import type { KnowledgePoint } from '../types.js';

export class ASTParser {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        strict: true,
        esModuleInterop: true,
        target: 99,
        module: 99,
        moduleResolution: 2,
      },
    });
  }

  addSourceFile(filePath: string): SourceFile {
    return this.project.addSourceFileAtPath(filePath);
  }

  extractInterfaceProperties(
    filePath: string,
    interfaceName: string
  ): KnowledgePoint[] {
    const sourceFile = this.addSourceFile(filePath);
    const iface = sourceFile.getInterface(interfaceName);
    if (!iface) return [];

    return iface.getProperties().map((prop: PropertySignature) => ({
      id: `${filePath}::${interfaceName}::${prop.getName()}`,
      dimension: '',
      subcategory: interfaceName,
      title: prop.getName(),
      content: this.formatPropertyInfo(prop),
      codeSnippet: prop.getText(),
      source: filePath,
      sourcePath: filePath,
      tags: [interfaceName, prop.getName()],
    }));
  }

  extractTypeAlias(
    filePath: string,
    typeName: string
  ): KnowledgePoint | null {
    const sourceFile = this.addSourceFile(filePath);
    const typeAlias = sourceFile.getTypeAlias(typeName);
    if (!typeAlias) return null;

    return {
      id: `${filePath}::${typeName}`,
      dimension: '',
      subcategory: typeName,
      title: typeName,
      content: this.formatTypeAliasInfo(typeAlias),
      codeSnippet: typeAlias.getText(),
      source: filePath,
      sourcePath: filePath,
      tags: [typeName],
    };
  }

  extractAllInterfaces(filePath: string): KnowledgePoint[] {
    const sourceFile = this.addSourceFile(filePath);
    const results: KnowledgePoint[] = [];

    sourceFile.getInterfaces().forEach((iface) => {
      const props = iface.getProperties().map((prop: PropertySignature) => ({
        name: prop.getName(),
        type: prop.getType().getText(prop),
        optional: prop.hasQuestionToken(),
        jsDoc: prop.getJsDocs()?.[0]?.getDescription() || '',
      }));

      results.push({
        id: `${filePath}::${iface.getName()}`,
        dimension: '',
        subcategory: iface.getName(),
        title: iface.getName(),
        content: JSON.stringify(props, null, 2),
        codeSnippet: iface.getText(),
        source: filePath,
        sourcePath: filePath,
        tags: [iface.getName()],
      });
    });

    return results;
  }

  extractClassMethods(filePath: string, className: string): KnowledgePoint[] {
    const sourceFile = this.addSourceFile(filePath);
    const cls = sourceFile.getClass(className);
    if (!cls) return [];

    return cls.getMethods().map((method: MethodDeclaration) => ({
      id: `${filePath}::${className}::${method.getName()}`,
      dimension: '',
      subcategory: className,
      title: method.getName(),
      content: method.getText(),
      codeSnippet: method.getText(),
      source: filePath,
      sourcePath: filePath,
      tags: [className, method.getName()],
    }));
  }

  private formatPropertyInfo(prop: PropertySignature): string {
    const name = prop.getName();
    const type = prop.getType().getText(prop);
    const optional = prop.hasQuestionToken() ? '（可选）' : '（必填）';
    const jsDoc = prop.getJsDocs()?.[0]?.getDescription() || '';
    return `${name}: ${type}${optional}${jsDoc ? ' - ' + jsDoc : ''}`;
  }

  private formatTypeAliasInfo(typeAlias: TypeAliasDeclaration): string {
    return `type ${typeAlias.getName()} = ${typeAlias.getTypeNode()?.getText() || 'unknown'}`;
  }
}
```

- [ ] **Step 2: 验证 AST 解析器能读取组件类型**

Run: `cd scripts/training-data && tsx -e "import {ASTParser} from './src/utils/ast-parser.js'; const p = new ASTParser(); const results = p.extractAllInterfaces('../../packages/base-frontend/src/components/page/list-page/types.ts'); console.log(JSON.stringify(results.map(r => r.title)));"`
Expected: 输出包含 MfwListPageProps, MfwListPageEmits 等接口名

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/ast-parser.ts
git commit -m "feat(training-data): add TypeScript AST parser utility"
```

---

## Task 5: 核心工具函数 - Markdown 解析器

**Files:**
- Create: `scripts/training-data/src/utils/markdown-parser.ts`

- [ ] **Step 1: 实现 Markdown 解析器**

```typescript
import { readFileSync } from 'fs';
import matter from 'gray-matter';

export interface MarkdownSection {
  level: number;
  title: string;
  content: string;
  children: MarkdownSection[];
  frontMatter?: Record<string, any>;
}

export interface ParsedMarkdown {
  frontMatter: Record<string, any>;
  sections: MarkdownSection[];
  rawContent: string;
}

export function parseMarkdown(filePath: string): ParsedMarkdown {
  const raw = readFileSync(filePath, 'utf-8');
  const { data: frontMatter, content } = matter(raw);
  const sections = parseSections(content);
  return { frontMatter, sections, rawContent: content };
}

function parseSections(content: string): MarkdownSection[] {
  const lines = content.split('\n');
  const root: MarkdownSection[] = [];
  const stack: { level: number; section: MarkdownSection }[] = [];

  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      if (stack.length > 0) {
        stack[stack.length - 1].section.content = currentContent.join('\n').trim();
      }
      currentContent = [];

      const section: MarkdownSection = {
        level,
        title,
        content: '',
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].section.children.push(section);
      } else {
        root.push(section);
      }

      stack.push({ level, section });
    } else {
      currentContent.push(line);
    }
  }

  if (stack.length > 0) {
    stack[stack.length - 1].section.content = currentContent.join('\n').trim();
  }

  return root;
}

export function flattenSections(sections: MarkdownSection[]): Array<{
  title: string;
  content: string;
  level: number;
  path: string;
}> {
  const result: Array<{ title: string; content: string; level: number; path: string }> = [];

  function walk(sections: MarkdownSection[], parentPath: string = '') {
    for (const section of sections) {
      const path = parentPath ? `${parentPath} > ${section.title}` : section.title;
      if (section.content.trim()) {
        result.push({
          title: section.title,
          content: section.content,
          level: section.level,
          path,
        });
      }
      walk(section.children, path);
    }
  }

  walk(sections);
  return result;
}

export function extractCodeBlocks(content: string): Array<{
  language: string;
  code: string;
}> {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }
  return blocks;
}
```

- [ ] **Step 2: 验证 Markdown 解析器能解析 Skill 文档**

Run: `cd scripts/training-data && tsx -e "import {parseMarkdown, flattenSections} from './src/utils/markdown-parser.js'; const doc = parseMarkdown('../../.trae/skills/mfw-guide/SKILL.md'); const flat = flattenSections(doc.sections); console.log(flat.length, 'sections'); console.log(flat.map(s => s.title));"`
Expected: 输出 Skill 文档的章节标题列表

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/markdown-parser.ts
git commit -m "feat(training-data): add Markdown parser utility"
```

---

## Task 6: 核心工具函数 - Q&A 生成引擎

**Files:**
- Create: `scripts/training-data/src/utils/qa-generator.ts`

- [ ] **Step 1: 实现 Q&A 生成引擎**

```typescript
import type { KnowledgePoint, QAPair, QAAngle, QAMetadata, ExtractionResult } from '../types.js';
import { estimateTokens, truncateToTokenLimit } from './token-counter.js';

interface QATemplate {
  angle: QAAngle;
  questionTemplate: (kp: KnowledgePoint) => string;
  answerTemplate: (kp: KnowledgePoint) => string;
}

const DEFAULT_TEMPLATES: Record<string, QATemplate[]> = {
  default: [
    {
      angle: 'what',
      questionTemplate: (kp) => `moyan-mfw 中${kp.title}是什么？`,
      answerTemplate: (kp) => {
        let answer = `${kp.title}是 moyan-mfw 框架中的${kp.subcategory}，${kp.content}`;
        if (kp.codeSnippet) {
          answer += `\n\n示例：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\``;
        }
        return answer;
      },
    },
    {
      angle: 'how',
      questionTemplate: (kp) => `如何在 moyan-mfw 中使用${kp.title}？`,
      answerTemplate: (kp) => {
        let answer = `使用${kp.title}的方法：\n${kp.content}`;
        if (kp.codeSnippet) {
          answer += `\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\``;
        }
        return answer;
      },
    },
    {
      angle: 'when',
      questionTemplate: (kp) => `什么时候应该使用 moyan-mfw 的${kp.title}？`,
      answerTemplate: (kp) =>
        `${kp.title}适用于以下场景：\n${kp.content}${kp.codeSnippet ? `\n\n典型用法：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\`` : ''}`,
    },
    {
      angle: 'caution',
      questionTemplate: (kp) => `使用 moyan-mfw 的${kp.title}有什么注意事项？`,
      answerTemplate: (kp) => {
        const cautions = extractCautions(kp.content);
        if (cautions.length === 0) {
          return `使用${kp.title}时需注意：\n${kp.content}`;
        }
        return `使用${kp.title}时需注意：\n${cautions.join('\n')}`;
      },
    },
    {
      angle: 'compare',
      questionTemplate: (kp) => `${kp.title}和相似概念有什么区别？`,
      answerTemplate: (kp) =>
        `${kp.title}的区别与辨析：\n${kp.content}${kp.codeSnippet ? `\n\n参考实现：\n\`\`\`typescript\n${kp.codeSnippet}\n\`\`\`` : ''}`,
    },
    {
      angle: 'troubleshoot',
      questionTemplate: (kp) => `${kp.title}常见问题如何排查？`,
      answerTemplate: (kp) =>
        `${kp.title}常见问题排查：\n${kp.content}`,
    },
  ],
};

function extractCautions(content: string): string[] {
  const cautions: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('✋') || line.includes('禁止') || line.includes('不要') || line.includes('注意') || line.includes('红线') || line.includes('反模式')) {
      cautions.push(line.replace(/^[>\-\s]*/, '').trim());
    }
  }
  return cautions;
}

export function generateQAPairs(
  knowledgePoints: KnowledgePoint[],
  dimension: string,
  angleWeights: Record<QAAngle, number>,
  customTemplates?: QATemplate[]
): ExtractionResult {
  const templates = customTemplates || DEFAULT_TEMPLATES.default;
  const qaPairs: QAPair[] = [];
  const byAngle: Record<string, number> = { what: 0, how: 0, when: 0, caution: 0, compare: 0, troubleshoot: 0 };
  const bySubcategory: Record<string, number> = {};

  for (const kp of knowledgePoints) {
    const subcategoryCount = bySubcategory[kp.subcategory] || 0;

    for (const template of templates) {
      const weight = angleWeights[template.angle];
      if (weight < 1 && Math.random() > weight) continue;

      const question = template.questionTemplate(kp);
      let answer = template.answerTemplate(kp);

      if (estimateTokens(question + answer) > 2048) {
        answer = truncateToTokenLimit(answer, 1800);
      }

      const qa: QAPair = {
        conversations: [
          { role: 'user', content: question },
          { role: 'assistant', content: answer },
        ],
        metadata: {
          dimension,
          subcategory: kp.subcategory,
          source: kp.source,
          angle: template.angle,
          timestamp: new Date().toISOString(),
        },
      };

      qaPairs.push(qa);
      byAngle[template.angle]++;
      bySubcategory[kp.subcategory] = subcategoryCount + 1;
    }
  }

  return {
    dimension,
    knowledgePoints,
    qaPairs,
    stats: {
      totalKnowledgePoints: knowledgePoints.length,
      totalQAPairs: qaPairs.length,
      byAngle: byAngle as Record<QAAngle, number>,
      bySubcategory,
    },
  };
}
```

- [ ] **Step 2: 验证 Q&A 生成引擎**

Run: `cd scripts/training-data && tsx -e "import {generateQAPairs} from './src/utils/qa-generator.js'; const kps = [{id:'1',dimension:'test',subcategory:'MfwListPage',title:'MfwListPage',content:'列表页面组件',codeSnippet:'<MfwListPage />',source:'test',sourcePath:'test',tags:[]}]; const result = generateQAPairs(kps,'test',{what:1,how:1,when:1,caution:0.5,compare:0.3,troubleshoot:0.3}); console.log(result.stats);"`
Expected: 输出统计信息，约 3-5 条 Q&A

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/qa-generator.ts
git commit -m "feat(training-data): add Q&A generation engine"
```

---

## Task 7: 核心工具函数 - 质量校验器

**Files:**
- Create: `scripts/training-data/src/utils/validator.ts`

- [ ] **Step 1: 实现质量校验器**

```typescript
import type { QAPair, ValidationResult, ValidationError, ValidationWarning } from '../types.js';
import { estimateTokens } from './token-counter.js';

export function validateJSONL(qaPairs: QAPair[], maxTokens: number = 2048): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let passed = 0;

  const seenQuestions = new Set<string>();

  for (let i = 0; i < qaPairs.length; i++) {
    const qa = qaPairs[i];
    const line = i + 1;

    if (!qa.conversations || qa.conversations.length < 2) {
      errors.push({ line, rule: 'min_conversations', message: '对话至少需要2轮', content: JSON.stringify(qa).substring(0, 100) });
      continue;
    }

    const userMsg = qa.conversations[0];
    const assistantMsg = qa.conversations[1];

    if (userMsg.role !== 'user') {
      errors.push({ line, rule: 'role_order', message: '第一条消息必须是 user', content: userMsg.role });
    }

    if (assistantMsg.role !== 'assistant') {
      errors.push({ line, rule: 'role_order', message: '第二条消息必须是 assistant', content: assistantMsg.role });
    }

    if (!userMsg.content || userMsg.content.trim().length < 5) {
      errors.push({ line, rule: 'question_length', message: '问题内容过短', content: userMsg.content?.substring(0, 50) || '' });
    }

    if (!assistantMsg.content || assistantMsg.content.trim().length < 10) {
      errors.push({ line, rule: 'answer_length', message: '回答内容过短', content: assistantMsg.content?.substring(0, 50) || '' });
    }

    const totalTokens = estimateTokens(userMsg.content + assistantMsg.content);
    if (totalTokens > maxTokens) {
      errors.push({ line, rule: 'token_length', message: `总 token 数 ${totalTokens} 超过限制 ${maxTokens}`, content: `tokens=${totalTokens}` });
    }

    const questionKey = userMsg.content.trim().substring(0, 100);
    if (seenQuestions.has(questionKey)) {
      warnings.push({ line, rule: 'duplicate_question', message: '重复问题' });
    }
    seenQuestions.add(questionKey);

    if (assistantMsg.content.includes('TODO') || assistantMsg.content.includes('FIXME')) {
      warnings.push({ line, rule: 'placeholder_content', message: '回答包含占位符' });
    }

    passed++;
  }

  return {
    total: qaPairs.length,
    passed: passed - errors.length,
    failed: errors.length,
    errors,
    warnings,
  };
}

export function printValidationReport(result: ValidationResult): void {
  console.log(`\n========== 质量校验报告 ==========`);
  console.log(`总计: ${result.total} 条`);
  console.log(`通过: ${result.passed} 条`);
  console.log(`失败: ${result.failed} 条`);
  console.log(`警告: ${result.warnings.length} 条`);

  if (result.errors.length > 0) {
    console.log(`\n--- 错误 (${result.errors.length}) ---`);
    for (const err of result.errors.slice(0, 20)) {
      console.log(`  行${err.line} [${err.rule}]: ${err.message}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... 还有 ${result.errors.length - 20} 条错误`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n--- 警告 (${result.warnings.length}) ---`);
    for (const warn of result.warnings.slice(0, 10)) {
      console.log(`  行${warn.line} [${warn.rule}]: ${warn.message}`);
    }
    if (result.warnings.length > 10) {
      console.log(`  ... 还有 ${result.warnings.length - 10} 条警告`);
    }
  }
}
```

- [ ] **Step 2: 验证校验器能检测问题**

Run: `cd scripts/training-data && tsx -e "import {validateJSONL} from './src/utils/validator.js'; const bad = [{conversations:[{role:'user',content:'hi'},{role:'assistant',content:'ok'}]}]; const result = validateJSONL(bad); console.log(result);"`
Expected: 检测到 question_length 和 answer_length 错误

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/utils/validator.ts
git commit -m "feat(training-data): add quality validator utility"
```

---

## Task 8: 提取器 - 维度 2：权限系统深度（~1,200 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim02-permission.ts`
- Create: `scripts/training-data/src/templates/permission-templates.ts`

这是最核心、最复杂的维度。提取源覆盖：
- `packages/base-backend/src/common/constants/permissions.ts` — 9 种权限值 + 工具函数
- `packages/base-backend/src/common/decorators/require-permission.decorator.ts` — 装饰器模式
- `packages/base-backend/src/common/guards/permission.guard.ts` — 守卫实现
- `packages/base-backend/src/common/guards/auth.guard.ts` — 认证守卫
- `.trae/skills/mfw-guide/auth/permission-debugging.md` — 排查指南
- `.trae/skills/mfw-guide/auth/multi-tenant.md` — 多租户权限
- `.trae/skills/mfw-guide/auth/routing-auth.md` — 前端权限控制
- `packages/base-frontend/src/utils/permissions.ts` — 前端权限工具
- `packages/base-frontend/src/hooks/usePermission.ts` — 前端权限 Hook

- [ ] **Step 1: 创建权限 Q&A 模板**

```typescript
import type { KnowledgePoint, QAPair, QAAngle } from '../types.js';

export interface PermissionKnowledgePoint extends KnowledgePoint {
  permissionCategory: 'value-system' | 'decorator' | 'guard' | 'frontend' | 'multi-tenant' | 'debugging';
}

export function generatePermissionQAs(kps: PermissionKnowledgePoint[]): QAPair[] {
  const pairs: QAPair[] = [];

  for (const kp of kps) {
    pairs.push(...generateByCategory(kp));
  }

  return pairs;
}

function generateByCategory(kp: PermissionKnowledgePoint): QAPair[] {
  const pairs: QAPair[] = [];

  switch (kp.permissionCategory) {
    case 'value-system':
      pairs.push(...generatePermissionValueQAs(kp));
      break;
    case 'decorator':
      pairs.push(...generateDecoratorQAs(kp));
      break;
    case 'guard':
      pairs.push(...generateGuardQAs(kp));
      break;
    case 'frontend':
      pairs.push(...generateFrontendPermQAs(kp));
      break;
    case 'multi-tenant':
      pairs.push(...generateMultiTenantQAs(kp));
      break;
    case 'debugging':
      pairs.push(...generateDebuggingQAs(kp));
      break;
  }

  return pairs;
}

function generatePermissionValueQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中${kp.title}的权限值是多少？如何计算？` },
        { role: 'assistant', content: `${kp.title}的权限值采用位运算（BigInt）表示：\n\n${kp.content}\n\n权限值计算原理：每个权限值 = 1n << index（左移位），使用 BigInt 位与运算（&）检查权限，位或运算（|）合并权限。` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `如何在 moyan-mfw 中使用${kp.title}？` },
        { role: 'assistant', content: `使用${kp.title}的方式：\n\n${kp.content}\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet || '// 参见源码'}\n\`\`\`` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 权限系统中${kp.title}有什么注意事项？` },
        { role: 'assistant', content: `注意事项：\n1. 权限值使用 BigInt 类型，不是普通数字\n2. 位运算检查：\`(userValue & requiredValue) !== 0n\`\n3. isDeveloper=1 时后端跳过权限检查\n4. 前端需通过 usePermission 或 v-permission 检查\n5. 业务权限需通过 registerPermissionValues() 注册` },
      ],
    },
  ];
}

function generateDecoratorQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中${kp.title}装饰器怎么用？` },
        { role: 'assistant', content: `${kp.title}装饰器的使用方法：\n\n${kp.content}\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet || '// 参见 require-permission.decorator.ts'}\n\`\`\`\n\n支持两种调用形式：\n1. 对象形式：\`@RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })\`\n2. 简写形式：\`@RequirePermission('pc_root:sys:user', ['添加'])\`` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中 @RequirePermission 和 @Public 有什么区别？` },
        { role: 'assistant', content: `区别如下：\n- @RequirePermission：要求用户拥有指定权限才能访问，支持 permCode + permissionValue 细粒度控制\n- @Public：标记接口无需认证即可访问，跳过 AuthGuard\n- @SkipPermission：跳过权限检查但需认证\n\n使用场景：\n- @RequirePermission：所有需要权限控制的接口\n- @Public：登录、注册、系统初始化等公开接口\n- @SkipPermission：需认证但不需要权限检查的内部方法` },
      ],
    },
  ];
}

function generateGuardQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 的${kp.title}执行流程是什么？` },
        { role: 'assistant', content: `${kp.title}的执行流程：\n\n${kp.content}` },
      ],
    },
  ];
}

function generateFrontendPermQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 前端如何进行权限控制？` },
        { role: 'assistant', content: `前端权限控制方式：\n\n${kp.content}\n\n三种方式：\n1. v-permission 指令：\`<el-button v-permission="'添加'">新增</el-button>\`\n2. usePermission Hook：\`const { hasPermission } = usePermission()\`\n3. renderActionButtons：自动根据权限隐藏按钮` },
      ],
    },
  ];
}

function generateMultiTenantQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 多租户权限的${kp.title}怎么理解？` },
        { role: 'assistant', content: `${kp.content}\n\n三层模型：AppType → App → AppMember，权限池限定应用类型可用权限范围，角色可绑定全局/应用类型级/应用实例级作用域。` },
      ],
    },
  ];
}

function generateDebuggingQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 权限排查：${kp.title}` },
        { role: 'assistant', content: `${kp.content}\n\n排查路径：Token有效性 → 角色权限 → 权限池配置 → permissionValue位运算 → 前端权限指令` },
      ],
    },
  ];
}
```

- [ ] **Step 2: 实现维度 2 提取器**

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ExtractionResult, QAPair, QAAngle } from '../types.js';
import { ASTParser } from '../utils/ast-parser.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';
import type { PermissionKnowledgePoint } from '../templates/permission-templates.js';
import { generatePermissionQAs } from '../templates/permission-templates.js';

export function extractPermissionDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: PermissionKnowledgePoint[] = [];

  knowledgePoints.push(...extractPermissionValues(projectRoot));
  knowledgePoints.push(...extractDecorators(projectRoot));
  knowledgePoints.push(...extractGuards(projectRoot));
  knowledgePoints.push(...extractFrontendPermissions(projectRoot));
  knowledgePoints.push(...extractMultiTenant(projectRoot));
  knowledgePoints.push(...extractDebugging(projectRoot));

  const templateQAs = generatePermissionQAs(knowledgePoints);
  const genericResult = generateQAPairs(
    knowledgePoints.map((kp) => ({ ...kp, dimension: 'dim02-permission' })),
    'dim02-permission',
    DEFAULT_CONFIG.angleWeights
  );

  const allQAs = [...templateQAs, ...genericResult.qaPairs];

  return {
    dimension: 'dim02-permission',
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

function extractPermissionValues(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];
  const permFile = join(root, 'packages/base-backend/src/common/constants/permissions.ts');
  const content = readFileSync(permFile, 'utf-8');

  const defaultPerms = [
    { name: '添加', value: '1n (1n << 0)', desc: '创建资源权限' },
    { name: '编辑', value: '2n (1n << 1)', desc: '修改资源权限' },
    { name: '删除', value: '4n (1n << 2)', desc: '删除资源权限' },
    { name: '导出', value: '8n (1n << 3)', desc: '导出数据权限' },
    { name: '导入', value: '16n (1n << 4)', desc: '导入数据权限' },
  ];

  for (const perm of defaultPerms) {
    kps.push({
      id: `perm-value-default-${perm.name}`,
      dimension: 'dim02-permission',
      subcategory: '默认权限值',
      title: `默认权限值「${perm.name}」`,
      content: `${perm.name}的位运算值为 ${perm.value}，${perm.desc}。在 @RequirePermission 中使用：permissionValue: ['${perm.name}']`,
      codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:xxx', permissionValue: ['${perm.name}'] })`,
      source: permFile,
      sourcePath: permFile,
      tags: ['权限值', perm.name, '默认'],
      permissionCategory: 'value-system',
    });
  }

  const extPerms = [
    { name: '审批', value: '32n (1n << 5)', desc: '审批流程权限' },
    { name: '拒绝', value: '64n (1n << 6)', desc: '拒绝操作权限' },
    { name: '发布', value: '128n (1n << 7)', desc: '发布操作权限' },
    { name: '归档', value: '256n (1n << 8)', desc: '归档操作权限' },
  ];

  for (const perm of extPerms) {
    kps.push({
      id: `perm-value-ext-${perm.name}`,
      dimension: 'dim02-permission',
      subcategory: '扩展权限值',
      title: `扩展权限值「${perm.name}」`,
      content: `${perm.name}的位运算值为 ${perm.value}，${perm.desc}。属于扩展权限，非默认提供，需在业务权限中按需使用。`,
      codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:xxx', permissionValue: ['${perm.name}'] })`,
      source: permFile,
      sourcePath: permFile,
      tags: ['权限值', perm.name, '扩展'],
      permissionCategory: 'value-system',
    });
  }

  kps.push({
    id: 'perm-buildPerValue',
    dimension: 'dim02-permission',
    subcategory: '权限值工具函数',
    title: 'buildPerValue 函数',
    content: 'buildPerValue(names) 函数将权限名称数组转换为合并的 BigInt 值。例如 buildPerValue(["添加","编辑"]) 返回 3n (1n | 2n)。',
    codeSnippet: `const permValue = buildPerValue(['添加', '编辑']); // 3n`,
    source: permFile,
    sourcePath: permFile,
    tags: ['工具函数', 'buildPerValue'],
    permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-parsePerValue',
    dimension: 'dim02-permission',
    subcategory: '权限值工具函数',
    title: 'parsePerValue 函数',
    content: 'parsePerValue(value) 函数将 BigInt 权限值解析为权限名称数组。例如 parsePerValue(3n) 返回 ["添加","编辑"]。',
    codeSnippet: `const names = parsePerValue(3n); // ['添加', '编辑']`,
    source: permFile,
    sourcePath: permFile,
    tags: ['工具函数', 'parsePerValue'],
    permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-hasPermission',
    dimension: 'dim02-permission',
    subcategory: '权限值工具函数',
    title: 'hasPermission 函数',
    content: 'hasPermission(userValue, requiredValue) 函数通过位与运算检查用户是否拥有指定权限。(userValue & requiredValue) !== 0n 为 true 则拥有权限。',
    codeSnippet: `if (hasPermission(userPermValue, buildPerValue(['删除']))) {\n  // 用户有删除权限\n}`,
    source: permFile,
    sourcePath: permFile,
    tags: ['工具函数', 'hasPermission'],
    permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-registerPermissionValues',
    dimension: 'dim02-permission',
    subcategory: '业务权限扩展',
    title: 'registerPermissionValues 函数',
    content: 'registerPermissionValues(values) 函数注册自定义业务权限值。例如供应商模块的上架(512n)、发货(1024n)、退款(2048n)。',
    codeSnippet: `registerPermissionValues([\n  { name: '上架', value: 512n },\n  { name: '发货', value: 1024n },\n  { name: '退款', value: 2048n },\n]);`,
    source: permFile,
    sourcePath: permFile,
    tags: ['业务权限', 'registerPermissionValues'],
    permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-createBusinessDecorator',
    dimension: 'dim02-permission',
    subcategory: '业务权限扩展',
    title: 'createBusinessPermissionDecorator 工厂',
    content: 'createBusinessPermissionDecorator<T>() 创建类型安全的业务权限装饰器工厂。返回的函数可生成绑定了业务权限值的装饰器，实现类型安全的 permissionValue 检查。',
    codeSnippet: `const RequireSupplierPermission = createBusinessPermissionDecorator<SupplierPermissionValue>();\n\n@RequireSupplierPermission({ permCode: 'pc_root:supplier', permissionValue: ['上架'] })`,
    source: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
    tags: ['装饰器', 'createBusinessPermissionDecorator', '业务权限'],
    permissionCategory: 'decorator',
  });

  return kps;
}

function extractDecorators(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];
  const decoratorFile = join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts');

  kps.push({
    id: 'perm-RequirePermission',
    dimension: 'dim02-permission',
    subcategory: '权限装饰器',
    title: '@RequirePermission 装饰器',
    content: '@RequirePermission 用于在 Controller 方法上声明所需权限。支持 permCode（权限编码）和 permissionValue（权限值数组）。多个 @RequirePermission 装饰器在同一方法上使用 OR 逻辑。',
    codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })\nasync create(@Body() dto: CreateUserDto) { ... }\n\n// 简写形式\n@RequirePermission('pc_root:sys:user', ['编辑'])\nasync update(@Body() dto: UpdateUserDto) { ... }`,
    source: decoratorFile,
    sourcePath: decoratorFile,
    tags: ['装饰器', 'RequirePermission'],
    permissionCategory: 'decorator',
  });

  kps.push({
    id: 'perm-Public',
    dimension: 'dim02-permission',
    subcategory: '权限装饰器',
    title: '@Public 装饰器',
    content: '@Public() 标记接口无需认证即可访问。AuthGuard 检测到 @Public() 后直接放行，不解析 JWT。适用于登录、注册、系统初始化等公开接口。',
    codeSnippet: `@Public()\n@Post('login')\nasync login(@Body() dto: LoginDto) { ... }`,
    source: join(root, 'packages/base-backend/src/common/decorators/public.decorator.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/decorators/public.decorator.ts'),
    tags: ['装饰器', 'Public'],
    permissionCategory: 'decorator',
  });

  kps.push({
    id: 'perm-SkipPermission',
    dimension: 'dim02-permission',
    subcategory: '权限装饰器',
    title: '@SkipPermission 装饰器',
    content: '@SkipPermission() 跳过权限检查但要求认证（需有效 JWT）。与 @Public() 不同：@Public() 跳过认证，@SkipPermission() 跳过权限但不跳过认证。适用于需认证但不需要特定权限的内部方法。',
    codeSnippet: `@SkipPermission()\n@Get('internal-status')\nasync getInternalStatus(@User() user: UserDto) { ... }`,
    source: join(root, 'packages/base-backend/src/common/decorators/skip-permission.decorator.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/decorators/skip-permission.decorator.ts'),
    tags: ['装饰器', 'SkipPermission'],
    permissionCategory: 'decorator',
  });

  return kps;
}

function extractGuards(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];

  kps.push({
    id: 'perm-AuthGuard',
    dimension: 'dim02-permission',
    subcategory: '认证守卫',
    title: 'AuthGuard 认证守卫',
    content: 'AuthGuard 从请求头提取 Bearer Token，验证 JWT 签名和过期时间，将解码后的用户信息（id, username, roleIds）注入 request.user。标记 @Public() 的接口跳过认证。',
    codeSnippet: `@UseGuards(AuthGuard)\n@Controller('users')\nexport class UserController { ... }`,
    source: join(root, 'packages/base-backend/src/common/guards/auth.guard.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/guards/auth.guard.ts'),
    tags: ['守卫', 'AuthGuard', 'JWT'],
    permissionCategory: 'guard',
  });

  kps.push({
    id: 'perm-PermissionGuard',
    dimension: 'dim02-permission',
    subcategory: '权限守卫',
    title: 'PermissionGuard 权限守卫',
    content: 'PermissionGuard 执行流程：\n1. 检查 @SkipPermission → 跳过\n2. 获取所有 @RequirePermission 元数据（OR 逻辑）\n3. 检查 isDeveloper=1 → 直接放行\n4. 查询 RolePermission（whereIn roleIds）\n5. 构建 userPermissionMap（permCode → BigInt OR 合并）\n6. 逐个检查：(userValue & requiredValue) !== 0n\n7. 任一装饰器满足即通过',
    codeSnippet: `@UseGuards(AuthGuard, PermissionGuard)\n@Controller('xxx')\nexport class XxxController { ... }`,
    source: join(root, 'packages/base-backend/src/common/guards/permission.guard.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/guards/permission.guard.ts'),
    tags: ['守卫', 'PermissionGuard', '位运算'],
    permissionCategory: 'guard',
  });

  return kps;
}

function extractFrontendPermissions(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];

  kps.push({
    id: 'perm-usePermission',
    dimension: 'dim02-permission',
    subcategory: '前端权限控制',
    title: 'usePermission Hook',
    content: 'usePermission() 是前端权限检查核心 Hook，提供 4 个方法：\n1. hasPermissionValue(options) — 检查当前用户是否拥有指定权限\n2. hasAnyPermissionValue(values) — OR 逻辑，满足任一即 true\n3. hasAllPermissionValues(values) — AND 逻辑，全部满足才 true\n4. getCurrentPermCode() — 获取当前权限编码',
    codeSnippet: `const { hasPermissionValue, hasAnyPermissionValue } = usePermission();\n\nif (hasPermissionValue({ value: ['编辑'] })) {\n  // 显示编辑按钮\n}`,
    source: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'),
    sourcePath: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'),
    tags: ['前端', 'usePermission', 'Hook'],
    permissionCategory: 'frontend',
  });

  kps.push({
    id: 'perm-v-permission',
    dimension: 'dim02-permission',
    subcategory: '前端权限控制',
    title: 'v-permission 指令',
    content: 'v-permission 是前端权限指令，根据用户权限自动隐藏/显示元素。支持字符串和对象两种形式。',
    codeSnippet: `<!-- 字符串形式 -->\n<el-button v-permission="'添加'">新增</el-button>\n\n<!-- 对象形式 -->\n<el-button v-permission="{ value: ['编辑'] }">编辑</el-button>`,
    source: join(root, 'packages/base-frontend/src/directives/'),
    sourcePath: join(root, 'packages/base-frontend/src/directives/'),
    tags: ['前端', 'v-permission', '指令'],
    permissionCategory: 'frontend',
  });

  kps.push({
    id: 'perm-defineBusinessPageConfig',
    dimension: 'dim02-permission',
    subcategory: '前端权限控制',
    title: 'defineBusinessPageConfig',
    content: 'defineBusinessPageConfig 用于配置业务页面的权限值。通过 createBusinessPageConfigFn 创建配置函数，将业务权限值映射到页面配置。',
    codeSnippet: `const defineSupplierPageConfig = createBusinessPageConfigFn<SupplierPermissionValue>();\n\nexport default defineSupplierPageConfig({\n  permissions: ['上架', '发货', '退款'],\n});`,
    source: join(root, 'packages/base-frontend/src/utils/permissions.ts'),
    sourcePath: join(root, 'packages/base-frontend/src/utils/permissions.ts'),
    tags: ['前端', 'defineBusinessPageConfig', '业务权限'],
    permissionCategory: 'frontend',
  });

  return kps;
}

function extractMultiTenant(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];

  kps.push({
    id: 'perm-three-layer-model',
    dimension: 'dim02-permission',
    subcategory: '多租户权限',
    title: '三层租户模型',
    content: 'moyan-mfw 多租户采用三层模型：\n1. AppType（应用类型）— 定义商家/租户类型，配置权限池\n2. App（应用实例）— 具体的商家/租户实例，绑定 ownerId\n3. AppMember（应用成员）— 应用内的用户，分配角色\n\n权限池（AppTypePermission）限定应用类型可用权限范围，角色权限不能超出权限池。',
    codeSnippet: `// 创建应用类型\nPOST /api/app-types\n{ "typeName": "电商商家", "typeCode": "ecommerce", "multiAppEnabled": 1 }\n\n// 配置权限池\nPUT /api/app-types/{id}/permission-pool\n{ "permissions": [{ "permissionId": "xxx", "permissionValue": "7" }] }`,
    source: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
    sourcePath: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
    tags: ['多租户', 'AppType', 'App', 'AppMember'],
    permissionCategory: 'multi-tenant',
  });

  kps.push({
    id: 'perm-role-scope',
    dimension: 'dim02-permission',
    subcategory: '多租户权限',
    title: '角色作用域规则',
    content: '角色作用域由 appId 和 appTypeId 决定：\n- 无 appId、无 appTypeId → 全局角色（所有应用可见）\n- 有 appTypeId → 应用类型级（该类型下所有应用可见）\n- 有 appId → 应用实例级（仅该应用可见）\n\n权限池约束：角色权限分配只能从其所属应用类型的权限池中选择。',
    source: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
    sourcePath: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
    tags: ['多租户', '角色', '作用域'],
    permissionCategory: 'multi-tenant',
  });

  return kps;
}

function extractDebugging(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];
  const debugDoc = join(root, '.trae/skills/mfw-guide/auth/permission-debugging.md');

  const debugScenarios = [
    { title: '接口返回 401', content: 'Token 过期或缺失。排查：检查 localStorage 中 mfw:admin:token 是否存在，检查 Token 刷新机制（10分钟内过期自动刷新）。' },
    { title: '接口返回 403', content: '权限不足。排查：检查用户角色权限、权限池配置、permissionValue 位运算值是否匹配。' },
    { title: '菜单不显示', content: '权限菜单树问题。排查：检查 loadPermissions(appId) 是否正确获取，layoutStore 是否同步菜单数据。' },
    { title: '按钮不显示', content: 'v-permission 问题。排查：检查 usePermission 获取的权限值、permissionValue 参数。' },
    { title: '开发者全部放行', content: 'isDeveloper=1 时 PermissionGuard 跳过检查。此标志仅用于开发环境调试，不可在生产环境使用。' },
  ];

  for (const scenario of debugScenarios) {
    kps.push({
      id: `perm-debug-${scenario.title}`,
      dimension: 'dim02-permission',
      subcategory: '权限排查',
      title: scenario.title,
      content: scenario.content,
      source: debugDoc,
      sourcePath: debugDoc,
      tags: ['排查', scenario.title],
      permissionCategory: 'debugging',
    });
  }

  return kps;
}
```

- [ ] **Step 3: 运行维度 2 提取器验证输出**

Run: `cd scripts/training-data && tsx -e "import {extractPermissionDimension} from './src/extractors/dim02-permission.js'; const result = extractPermissionDimension('../..'); console.log('知识条:', result.stats.totalKnowledgePoints, 'QA条:', result.stats.totalQAPairs);"`
Expected: 输出知识条和 QA 条数量

- [ ] **Step 4: 提交**

```bash
git add scripts/training-data/src/extractors/dim02-permission.ts scripts/training-data/src/templates/permission-templates.ts
git commit -m "feat(training-data): add dimension 2 permission extractor"
```

---

## Task 9: 提取器 - 维度 4：前端组件与页面开发（~2,320 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim04-frontend.ts`
- Create: `scripts/training-data/src/templates/component-templates.ts`

最大维度。提取 26 个组件的类型定义 + 3 个 Hook + 3 个 Store + 2 个 Utils 文件 + 页面开发流程。

- [ ] **Step 1: 创建组件 Q&A 模板**

```typescript
import type { QAPair } from '../types.js';

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

interface ComponentInfo {
  name: string;
  category: string;
  props: ComponentProp[];
  emits: Array<{ name: string; params: string }>;
  slots: Array<{ name: string; description: string }>;
  expose: Array<{ name: string; description: string }>;
  sourcePath: string;
}

export function generateComponentQAs(info: ComponentInfo): QAPair[] {
  const pairs: QAPair[] = [];

  pairs.push({
    conversations: [
      { role: 'user', content: `moyan-mfw 中 ${info.name} 组件是什么？有什么功能？` },
      { role: 'assistant', content: `${info.name} 是 moyan-mfw 框架的${info.category}组件。\n\nProps 属性：\n${info.props.map(p => `- \`${p.name}\` (${p.type})${p.required ? ' 必填' : ' 可选'}${p.description ? ' — ' + p.description : ''}`).join('\n')}\n\nEvents 事件：\n${info.emits.length > 0 ? info.emits.map(e => `- \`${e.name}\` ${e.params}`).join('\n') : '无'}\n\nSlots 插槽：\n${info.slots.length > 0 ? info.slots.map(s => `- \`${s.name}\` — ${s.description}`).join('\n') : '无'}\n\nExpose 方法：\n${info.expose.length > 0 ? info.expose.map(e => `- \`${e.name}\` — ${e.description}`).join('\n') : '无'}` },
    ],
  });

  for (const prop of info.props) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${prop.name} 属性怎么用？` },
        { role: 'assistant', content: `${info.name} 的 \`${prop.name}\` 属性：\n\n类型：\`${prop.type}\`\n${prop.required ? '必填' : '可选'}${prop.defaultValue ? `，默认值：\`${prop.defaultValue}\`` : ''}${prop.description ? `\n说明：${prop.description}` : ''}\n\n使用示例：\n\`\`\`vue\n<${info.name} :${prop.name}="value" />\n\`\`\`` },
      ],
    });
  }

  for (const emit of info.emits) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${emit.name} 事件什么时候触发？` },
        { role: 'assistant', content: `${info.name} 的 \`${emit.name}\` 事件：\n\n参数：${emit.params}\n\n使用示例：\n\`\`\`vue\n<${info.name} @${emit.name}="handle${emit.name.charAt(0).toUpperCase() + emit.name.slice(1)}" />\n\`\`\`` },
      ],
    });
  }

  for (const slot of info.slots) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${slot.name} 插槽如何使用？` },
        { role: 'assistant', content: `${info.name} 的 \`${slot.name}\` 插槽：\n${slot.description}\n\n使用示例：\n\`\`\`vue\n<${info.name}>\n  <template #${slot.name}>\n    <!-- 自定义内容 -->\n  </template>\n</${info.name}>\n\`\`\`` },
      ],
    });
  }

  for (const exp of info.expose) {
    pairs.push({
      conversations: [
        { role: 'user', content: `moyan-mfw ${info.name} 组件的 ${exp.name} 方法怎么调用？` },
        { role: 'assistant', content: `${info.name} 的 \`${exp.name}\` 暴露方法：\n${exp.description}\n\n通过 ref 调用：\n\`\`\`vue\n<script setup>\nconst ${info.name.replace('Mfw', '').toLowerCase()}Ref = ref();\n\n${info.name.replace('Mfw', '').toLowerCase()}Ref.value?.${exp.name}();\n</script>\n\n<${info.name} ref="${info.name.replace('Mfw', '').toLowerCase()}Ref" />\n\`\`\`` },
      ],
    });
  }

  return pairs;
}
```

- [ ] **Step 2: 实现维度 4 提取器**

```typescript
import { join } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';
import type { ExtractionResult, KnowledgePoint, QAPair } from '../types.js';
import { ASTParser } from '../utils/ast-parser.js';
import { parseMarkdown, flattenSections } from '../utils/markdown-parser.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';
import { generateComponentQAs } from '../templates/component-templates.js';

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

      if (!existsSync(typesPath)) continue;

      const astParser = new ASTParser();
      const interfaces = astParser.extractAllInterfaces(typesPath);

      for (const iface of interfaces) {
        const kp: KnowledgePoint = {
          id: `dim04-${comp}-${iface.title}`,
          dimension: 'dim04-frontend',
          subcategory: `${dir.category}:${comp}`,
          title: iface.title,
          content: iface.content,
          codeSnippet: iface.codeSnippet,
          source: typesPath,
          sourcePath: typesPath,
          tags: [dir.category, comp, iface.title],
        };
        knowledgePoints.push(kp);
      }

      try {
        const componentQAs = generateComponentQAsFromTypes(projectRoot, dir.category, comp, typesPath);
        qaPairs.push(...componentQAs);
      } catch {
        // 部分组件可能没有标准类型定义
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

function generateComponentQAsFromTypes(
  root: string, category: string, comp: string, typesPath: string
): QAPair[] {
  const astParser = new ASTParser();
  const allIfaces = astParser.extractAllInterfaces(typesPath);
  const propsIface = allIfaces.find(i => i.title.endsWith('Props'));
  const emitsIface = allIfaces.find(i => i.title.endsWith('Emits'));
  const slotsIface = allIfaces.find(i => i.title.endsWith('Slots'));
  const exposeIface = allIfaces.find(i => i.title.endsWith('Instance'));

  const componentName = propsIface?.title.replace('Props', '') || comp;

  return generateComponentQAs({
    name: componentName,
    category,
    props: parsePropsFromContent(propsIface?.content || ''),
    emits: parseEmitsFromContent(emitsIface?.content || ''),
    slots: parseSlotsFromContent(slotsIface?.content || ''),
    expose: parseExposeFromContent(exposeIface?.content || ''),
    sourcePath: typesPath,
  });
}

function parsePropsFromContent(content: string): ComponentProp[] {
  if (!content) return [];
  try {
    const props = JSON.parse(content);
    return props.map((p: any) => ({
      name: p.name, type: p.type, required: !p.optional,
      description: p.jsDoc || undefined,
    }));
  } catch { return []; }
}

function parseEmitsFromContent(content: string): Array<{name: string; params: string}> {
  if (!content) return [];
  return [];
}

function parseSlotsFromContent(content: string): Array<{name: string; description: string}> {
  if (!content) return [];
  return [];
}

function parseExposeFromContent(content: string): Array<{name: string; description: string}> {
  if (!content) return [];
  return [];
}

function extractHooks(root: string): KnowledgePoint[] {
  return [
    {
      id: 'dim04-usePermission', dimension: 'dim04-frontend', subcategory: 'Hooks',
      title: 'usePermission Hook', content: '前端权限检查核心 Hook，提供 hasPermissionValue/hasAnyPermissionValue/hasAllPermissionValues/getCurrentPermCode 四个方法。',
      codeSnippet: `const { hasPermissionValue } = usePermission();`, source: '', sourcePath: '', tags: ['Hook'],
    },
    {
      id: 'dim04-useThemeSwitch', dimension: 'dim04-frontend', subcategory: 'Hooks',
      title: 'useThemeSwitch', content: '主题切换 composable，提供 setTheme/currentTheme/availableThemes/initTheme。',
      source: '', sourcePath: '', tags: ['composable'],
    },
    {
      id: 'dim04-useColorMode', dimension: 'dim04-frontend', subcategory: 'Hooks',
      title: 'useColorMode', content: '颜色模式切换 composable，基于 VueUse useDark，支持 View Transitions API 圆形扩散动画。',
      source: '', sourcePath: '', tags: ['composable'],
    },
  ];
}

function extractStores(root: string): KnowledgePoint[] {
  return [
    { id: 'dim04-authStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useAuthStore', content: '认证状态管理（Pinia Setup Store），管理 token/用户信息/应用列表/权限菜单/路由权限映射。', source: '', sourcePath: '', tags: ['Store'] },
    { id: 'dim04-layoutStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useLayoutStore', content: '布局状态管理（Pinia Options Store），整合偏好设置和标签页管理，拆分为4个文件：model/utils/tab-actions/preference-actions。', source: '', sourcePath: '', tags: ['Store'] },
    { id: 'dim04-appLoadingStore', dimension: 'dim04-frontend', subcategory: 'Store', title: 'useAppLoadingStore', content: '应用加载状态管理。', source: '', sourcePath: '', tags: ['Store'] },
  ];
}

function extractUtils(root: string): KnowledgePoint[] {
  return [
    { id: 'dim04-permissions-util', dimension: 'dim04-frontend', subcategory: '工具函数', title: 'permissions.ts', content: '前端权限常量与位运算工具集：buildPerValue/parsePerValue/hasPermission/getPermValue/getPermissionOptions/createBusinessPageConfigFn/registerPermissionValues/setPermissionConfig。', source: '', sourcePath: '', tags: ['utils'] },
    { id: 'dim04-image-util', dimension: 'dim04-frontend', subcategory: '工具函数', title: 'image.ts', content: 'getImageSrc() 从图片资源中提取 URL。', source: '', sourcePath: '', tags: ['utils'] },
  ];
}
```

- [ ] **Step 3: 运行维度 4 提取器验证输出**

Run: `cd scripts/training-data && tsx -e "import {extractFrontendDimension} from './src/extractors/dim04-frontend.js'; const r = extractFrontendDimension('../..'); console.log('知识条:', r.stats.totalKnowledgePoints, 'QA条:', r.stats.totalQAPairs);"`

- [ ] **Step 4: 提交**

```bash
git add scripts/training-data/src/extractors/dim04-frontend.ts scripts/training-data/src/templates/component-templates.ts
git commit -m "feat(training-data): add dimension 4 frontend extractor"
```

---

## Task 10: 提取器 - 维度 3：后端模块开发规范（~1,000 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim03-backend-module.ts`
- Create: `scripts/training-data/src/templates/backend-templates.ts`

提取 11 个 Controller（57+ 端点）、10 个 Service（75+ 方法）、11 个 Entity（80+ 字段）、30+ DTO、PaginationX/WhereBuilder 规范、种子数据流程。

- [ ] **Step 1: 实现维度 3 提取器**

核心提取逻辑：遍历 `packages/base-backend/src/modules/sys/` 下所有模块，解析每个 Controller/Service/Entity/DTO 的 AST，提取知识点后生成 Q&A。同时解析 `pagination-query.md` 和 `new-backend-module.md` 中的规范。

提取器模式与维度 2/4 一致：`extractBackendModuleDimension(projectRoot)` → 返回 `ExtractionResult`。

关键子函数：
- `extractControllers(root)` — 遍历 11 个 Controller，提取每个端点的路由、方法、装饰器、参数、返回值
- `extractServices(root)` — 遍历 10 个 Service，提取方法签名、事务使用、异常处理
- `extractEntities(root)` — 遍历 11 个 Entity，提取字段、关联关系、索引
- `extractDTOs(root)` — 遍历 30+ DTO，提取校验规则、ApiProperty 配置
- `extractPaginationSpec(root)` — 从 pagination-query.md 提取 PaginationX/WhereBuilder 规范
- `extractModuleStandard(root)` — 从 new-backend-module.md 提取模块开发标准

- [ ] **Step 2: 运行维度 3 提取器验证输出**

Run: `cd scripts/training-data && tsx -e "import {extractBackendModuleDimension} from './src/extractors/dim03-backend-module.js'; const r = extractBackendModuleDimension('../..'); console.log('知识条:', r.stats.totalKnowledgePoints, 'QA条:', r.stats.totalQAPairs);"`

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/extractors/dim03-backend-module.ts scripts/training-data/src/templates/backend-templates.ts
git commit -m "feat(training-data): add dimension 3 backend module extractor"
```

---

## Task 11: 提取器 - 维度 9：使用场景与最佳实践（~960 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim09-scenarios.ts`
- Create: `scripts/training-data/src/templates/scenario-templates.ts`

此维度大量依赖人工编排，提取器负责从 Skill 文档中提取场景化描述，并生成场景 Q&A 框架，人工补充后合并。

14 个子场景：权限使用、多租户、成员档案扩展、业务权限扩展、前端页面配置、路由守卫、审计日志、文件上传、主题定制、API 自动生成、代码生成、安装初始化、搜索面板、表单联动。

- [ ] **Step 1: 实现维度 9 场景提取器**

核心模式：从每个 Skill 文档的"场景"相关章节提取内容，结合源码中的使用示例，生成场景化 Q&A。

```typescript
export function extractScenariosDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: KnowledgePoint[] = [];
  const skillDocs = [
    { path: '.trae/skills/mfw-guide/auth/permission-debugging.md', scenarios: ['权限使用场景'] },
    { path: '.trae/skills/mfw-guide/auth/multi-tenant.md', scenarios: ['多租户使用场景'] },
    { path: '.trae/skills/mfw-guide/frontend/new-frontend-page.md', scenarios: ['前端页面配置场景'] },
    { path: '.trae/skills/mfw-guide/auth/routing-auth.md', scenarios: ['路由守卫场景'] },
    { path: '.trae/skills/mfw-guide/backend/new-backend-module.md', scenarios: ['业务权限扩展场景', '审计日志场景'] },
    { path: '.trae/skills/mfw-guide/frontend/form-reference.md', scenarios: ['搜索面板场景', '表单联动场景'] },
    { path: '.trae/skills/mfw-guide/frontend/styling-theming.md', scenarios: ['主题定制场景'] },
    { path: '.trae/skills/mfw-guide/shared/apis-redline.md', scenarios: ['API 自动生成场景'] },
    { path: '.trae/skills/mfw-guide/infra/deployment.md', scenarios: ['安装初始化场景'] },
  ];

  for (const doc of skillDocs) {
    const parsed = parseMarkdown(join(projectRoot, doc.path));
    const sections = flattenSections(parsed.sections);
    for (const section of sections) {
      if (hasScenarioContent(section.content)) {
        knowledgePoints.push({
          id: `dim09-${section.title}`,
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
  }

  // ... 生成 Q&A
}
```

- [ ] **Step 2: 运行维度 9 提取器验证输出**

- [ ] **Step 3: 提交**

```bash
git add scripts/training-data/src/extractors/dim09-scenarios.ts scripts/training-data/src/templates/scenario-templates.ts
git commit -m "feat(training-data): add dimension 9 scenarios extractor"
```

---

## Task 12: 主入口编排器 + Batch 1 运行

**Files:**
- Create: `scripts/training-data/src/index.ts`

- [ ] **Step 1: 实现主入口编排器**

```typescript
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeJSONL, splitTestSet } from './utils/jsonl-formatter.js';
import { validateJSONL, printValidationReport } from './utils/validator.js';
import { extractPermissionDimension } from './extractors/dim02-permission.js';
import { extractFrontendDimension } from './extractors/dim04-frontend.js';
import { extractBackendModuleDimension } from './extractors/dim03-backend-module.js';
import { extractScenariosDimension } from './extractors/dim09-scenarios.js';
import type { QAPair, Dimension } from './types.js';
import { BATCH_MAP } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const outputDir = join(__dirname, '../output');

const EXTRACTORS: Record<string, (root: string) => any> = {
  'dim02-permission': extractPermissionDimension,
  'dim04-frontend': extractFrontendDimension,
  'dim03-backend-module': extractBackendModuleDimension,
  'dim09-scenarios': extractScenariosDimension,
};

async function main() {
  const args = process.argv.slice(2);
  const batchFlag = args.indexOf('--batch');
  const batchSize = batchFlag >= 0 ? parseInt(args[batchFlag + 1]) : null;
  const validateOnly = args.includes('--validate-only');
  const statsOnly = args.includes('--stats');

  const dimensions: Dimension[] = batchSize
    ? BATCH_MAP[batchSize] || []
    : Object.keys(EXTRACTORS) as Dimension[];

  if (dimensions.length === 0) {
    console.error('No dimensions to extract');
    process.exit(1);
  }

  const allQAs: QAPair[] = [];

  for (const dim of dimensions) {
    const extractor = EXTRACTORS[dim];
    if (!extractor) {
      console.warn(`No extractor for ${dim}, skipping`);
      continue;
    }

    console.log(`\n提取维度: ${dim}...`);
    const result = extractor(projectRoot);
    console.log(`  知识点: ${result.stats.totalKnowledgePoints}`);
    console.log(`  Q&A 条: ${result.stats.totalQAPairs}`);

    writeJSONL(result.qaPairs, join(outputDir, `${dim}.jsonl`));
    allQAs.push(...result.qaPairs);
  }

  if (statsOnly) {
    console.log(`\n总计: ${allQAs.length} 条 Q&A`);
    return;
  }

  if (validateOnly) {
    const result = validateJSONL(allQAs);
    printValidationReport(result);
    return;
  }

  const { train, test } = splitTestSet(allQAs, 0.05);
  writeJSONL(train, join(outputDir, batchSize ? `batch0${batchSize}.jsonl` : 'all-train.jsonl'));
  writeJSONL(test, join(outputDir, '../data/test-set/test-set.jsonl'));

  const validation = validateJSONL(allQAs);
  printValidationReport(validation);

  console.log(`\n========== 最终统计 ==========`);
  console.log(`训练集: ${train.length} 条`);
  console.log(`测试集: ${test.length} 条`);
  console.log(`输出目录: ${outputDir}`);
}

main().catch(console.error);
```

- [ ] **Step 2: 运行 Batch 1 提取**

Run: `cd scripts/training-data && pnpm extract:batch1`
Expected: 生成 `output/dim02-permission.jsonl`, `output/dim04-frontend.jsonl`, `output/dim03-backend-module.jsonl`, `output/dim09-scenarios.jsonl`, `output/batch01.jsonl`

- [ ] **Step 3: 校验 Batch 1 输出质量**

Run: `cd scripts/training-data && pnpm validate`
Expected: 质量校验报告通过，无严重错误

- [ ] **Step 4: 提交**

```bash
git add scripts/training-data/src/index.ts
git commit -m "feat(training-data): add main orchestrator and batch 1 extraction"
```

---

## Task 13: Batch 2 提取器（维度 5/1/10/6，~3,200 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim05-code-review.ts`
- Create: `scripts/training-data/src/extractors/dim01-architecture.ts`
- Create: `scripts/training-data/src/extractors/dim10-systems.ts`
- Create: `scripts/training-data/src/extractors/dim06-business.ts`

- [ ] **Step 1: 实现维度 5 代码审查规则提取器**

从 `eslint.config.mjs`、`SKILL.md`、`coding-conventions.md`、`apis-redline.md` 提取。核心：ESLint 自定义规则（moyan/comment-compliance）、14 条经验教训、apis 红线规则、命名/注释规范、Controller 限制。

- [ ] **Step 2: 实现维度 1 框架架构知识提取器**

从 `project-structure.md` + 源码提取。核心：Monorepo 结构、框架-业务分离模式、核心能力清单、框架边界、API 自动生成机制、启动流程。

- [ ] **Step 3: 实现维度 10 可实现业务系统提取器**

从 `project-structure.md` + `multi-tenant.md` + supplier 模块 + 种子数据提取。核心：10 类可构建系统（企业管理后台、SaaS 平台、供应商管理、运维监控、CMS、数据报表、订单管理等），每类系统提取架构路径+关键能力组合+实现步骤。

- [ ] **Step 4: 实现维度 6 业务场景问答提取器**

从 `backend/src/modules/supplier/` + `frontend/src/views/business/` + `app-types.config.ts` 提取。核心：supplier 完整实现、订单中心、报表中心、运维监控、应用类型配置。

- [ ] **Step 5: 更新 index.ts 添加 Batch 2 提取器**

在 `EXTRACTORS` 中添加 4 个新提取器，运行 `pnpm extract:batch2`。

- [ ] **Step 6: 运行 Batch 2 提取并校验**

Run: `cd scripts/training-data && pnpm extract:batch2`
Expected: 生成 4 个维度 JSONL + `output/batch02.jsonl`

- [ ] **Step 7: 提交**

```bash
git add scripts/training-data/src/extractors/dim0{1,5,6}.ts scripts/training-data/src/extractors/dim10-systems.ts scripts/training-data/src/index.ts
git commit -m "feat(training-data): add batch 2 extractors (dim01,05,06,10)"
```

---

## Task 14: Batch 3 提取器（维度 7/8，~800 条）

**Files:**
- Create: `scripts/training-data/src/extractors/dim07-testing.ts`
- Create: `scripts/training-data/src/extractors/dim08-deployment.ts`

- [ ] **Step 1: 实现维度 7 测试规范提取器**

从 `testing-guide.md` + `tests/README.md` + 9 个集成测试文件提取。核心：测试环境配置、覆盖率要求（≥70%）、测试工具链（Jest + supertest）、后端集成测试模式、前端单元测试模式。

- [ ] **Step 2: 实现维度 8 部署与运维提取器**

从 `deployment.md` + `docker-compose.yml` + `Dockerfile` + `.env.example` + `error-diagnosis.md` 提取。核心：Docker 三阶段构建、MySQL+Redis 配置、27+5 环境变量、6 类错误诊断决策树。

- [ ] **Step 3: 更新 index.ts 添加 Batch 3 提取器**

- [ ] **Step 4: 运行 Batch 3 提取并校验**

Run: `cd scripts/training-data && pnpm extract:batch3`
Expected: 生成 2 个维度 JSONL + `output/batch03.jsonl`

- [ ] **Step 5: 提交**

```bash
git add scripts/training-data/src/extractors/dim0{7,8}.ts scripts/training-data/src/index.ts
git commit -m "feat(training-data): add batch 3 extractors (dim07,08)"
```

---

## Task 15: 人工补充数据 + 最终合并

**Files:**
- Create: `scripts/training-data/data/manual-supplements/dim09-scenarios-manual.jsonl`
- Create: `scripts/training-data/data/manual-supplements/dim10-systems-manual.jsonl`

- [ ] **Step 1: 人工编排维度 9 使用场景补充数据**

根据设计文档中 14 个子场景，人工编写框架级 Q&A 条目。重点关注：
- 权限使用场景（何时用哪种权限控制方式）
- 多租户场景（何时创建新 AppType vs 新 App）
- 成员档案扩展场景（supplier-member-profile 模式的复用方法）
- 代码生成场景（plop → AI Agent 工作流）
- 表单联动场景（MfwFormCard change 回调 + 条件显示/禁用）

目标：补充 ~200 条人工编排 Q&A

- [ ] **Step 2: 人工编排维度 10 业务系统补充数据**

根据设计文档中 10 类可构建系统，人工编写系统方案 Q&A。重点关注：
- 每类系统的架构路径（使用哪些框架能力）
- 从零到一搭建流程（完整步骤序列）
- 系统组合方案（多应用类型 + 多模块的搭配）

目标：补充 ~300 条人工编排 Q&A

- [ ] **Step 3: 合并人工数据到最终输出**

```typescript
// 在 index.ts 中添加 manual 数据合并逻辑
const manualDir = join(import.meta.dirname, '../data/manual-supplements');
const manualFiles = readdirSync(manualDir).filter(f => f.endsWith('.jsonl'));
for (const file of manualFiles) {
  const pairs = readJSONL(join(manualDir, file));
  allQAs.push(...pairs);
}
```

- [ ] **Step 4: 提交**

```bash
git add scripts/training-data/data/manual-supplements/
git commit -m "feat(training-data): add manual supplement Q&A data"
```

---

## Task 16: 全量提取 + 最终质量报告

- [ ] **Step 1: 运行全量提取**

Run: `cd scripts/training-data && pnpm extract`
Expected: 生成全部 10 个维度 JSONL + `all-train.jsonl` + `test-set.jsonl`

- [ ] **Step 2: 运行质量校验**

Run: `cd scripts/training-data && pnpm validate`
Expected: 所有校验通过，错误率 <1%

- [ ] **Step 3: 生成统计报告**

Run: `cd scripts/training-data && pnpm stats`
Expected: 输出各维度 Q&A 条数统计

- [ ] **Step 4: 验证 JSONL 格式与 MiniMind 兼容性**

手动检查输出文件格式：
```bash
head -1 scripts/training-data/output/batch01.jsonl
```
Expected: 每行格式为 `{"conversations":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}`

- [ ] **Step 5: 最终提交**

```bash
git add scripts/training-data/
git commit -m "feat(training-data): complete extraction pipeline with all 10 dimensions"
```

---

## 任务总览

| Task | 内容 | 预估步数 | 依赖 |
|------|------|---------|------|
| 1 | 脚手架搭建 | 5 | - |
| 2 | JSONL 格式化器 | 3 | 1 |
| 3 | Token 计数器 | 3 | 1 |
| 4 | AST 解析器 | 3 | 1 |
| 5 | Markdown 解析器 | 3 | 1 |
| 6 | Q&A 生成引擎 | 3 | 1 |
| 7 | 质量校验器 | 3 | 1 |
| 8 | 维度 2 权限提取器 | 4 | 2-7 |
| 9 | 维度 4 前端提取器 | 4 | 2-7 |
| 10 | 维度 3 后端提取器 | 3 | 2-7 |
| 11 | 维度 9 场景提取器 | 3 | 2-7 |
| 12 | 主入口 + Batch 1 | 4 | 8-11 |
| 13 | Batch 2 (dim01/05/06/10) | 7 | 12 |
| 14 | Batch 3 (dim07/08) | 5 | 12 |
| 15 | 人工补充 + 合并 | 4 | 12-14 |
| 16 | 全量提取 + 质量报告 | 5 | 15 |
| **合计** | | **63 步** | |
