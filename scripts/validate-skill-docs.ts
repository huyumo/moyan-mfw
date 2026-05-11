/**
 * @fileoverview Skill 文档验证脚本
 * @description 验证 mfw-guide Skill 文档与代码的一致性
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILL_DIR = path.resolve(__dirname, '../.trae/skills/mfw-guide');
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMdFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.md') && entry.name !== 'SKILL.md') {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

function validate(): ValidationResult {
  const result: ValidationResult = { passed: true, errors: [], warnings: [] };

  validateCrossReferences(result);
  validateFrontmatter(result);
  validatePermissionCodes(result);
  validateComponentReferences(result);
  validateRedFlagsFormat(result);
  validateChecklistFiles(result);
  validateDuplicateContent(result);
  validateDirectoryStructure(result);

  return result;
}

function validateCrossReferences(result: ValidationResult): void {
  const relativeFiles = getAllMdFiles(SKILL_DIR);
  const skillFiles = new Set(relativeFiles.map(f => f.replace('.md', '')));

  for (const relFile of relativeFiles) {
    const fullPath = path.join(SKILL_DIR, relFile);
    const content = fs.readFileSync(fullPath, 'utf-8');

    const refPattern = /\{\{ref:([\w-]+(?:\/[\w-]+)*)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = refPattern.exec(content)) !== null) {
      const refName = match[1];
      if (!skillFiles.has(refName)) {
        result.errors.push(`${relFile}: 引用 {{ref:${refName}}} 目标文件不存在`);
        result.passed = false;
      }
    }

    const oldRefPattern = /`([\w-]+\.md)`/g;
    while ((match = oldRefPattern.exec(content)) !== null) {
      const refFile = match[1];
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const linePrefix = content.substring(lineStart, match.index).trim();
      if (linePrefix.startsWith('//') || linePrefix.startsWith('*') || linePrefix.startsWith('```')) continue;

      if (!relativeFiles.includes(refFile)) {
        result.warnings.push(`${relFile}: 旧格式引用 \`${refFile}\` 目标文件不存在（建议迁移为 {{ref:}} 格式）`);
      }
    }
  }
}

function validateFrontmatter(result: ValidationResult): void {
  const relativeFiles = getAllMdFiles(SKILL_DIR);
  const requiredFields = ['version', 'last_updated', 'scope', 'triggers', 'maturity'];

  for (const relFile of relativeFiles) {
    const fullPath = path.join(SKILL_DIR, relFile);
    const content = fs.readFileSync(fullPath, 'utf-8');

    if (!content.startsWith('---')) {
      result.errors.push(`${relFile}: 缺少 YAML frontmatter`);
      result.passed = false;
      continue;
    }

    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      result.errors.push(`${relFile}: frontmatter 未正确关闭`);
      result.passed = false;
      continue;
    }

    const frontmatter = content.substring(3, frontmatterEnd);

    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        result.errors.push(`${relFile}: frontmatter 缺少必填字段 '${field}'`);
        result.passed = false;
      }
    }

    const scopeMatch = frontmatter.match(/scope:\s*(\w+)/);
    if (scopeMatch) {
      const validScopes = ['backend', 'frontend', 'auth', 'infra', 'shared', 'resources'];
      if (!validScopes.includes(scopeMatch[1])) {
        result.warnings.push(`${relFile}: scope '${scopeMatch[1]}' 不在标准范围内 [${validScopes.join(', ')}]`);
      }
    }
  }
}

function findFileByBasename(basename: string): string | null {
  const allFiles = getAllMdFiles(SKILL_DIR);
  for (const f of allFiles) {
    if (path.basename(f, '.md') === basename || f === basename) {
      return f;
    }
  }
  return null;
}

function validatePermissionCodes(result: ValidationResult): void {
  const permRelFile = findFileByBasename('permission-debugging');
  if (!permRelFile) return;

  const permContent = fs.readFileSync(path.join(SKILL_DIR, permRelFile), 'utf-8');

  const docCodes: string[] = [];
  const codePattern = /`pc_root:sys:([\w-]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = codePattern.exec(permContent)) !== null) {
    docCodes.push(match[1]);
  }

  const permTsPath = path.join(
    PROJECT_ROOT,
    'packages/base/src/backend/common/constants/permissions.ts'
  );

  if (fs.existsSync(permTsPath)) {
    const permTsContent = fs.readFileSync(permTsPath, 'utf-8');
    const actualCodes: string[] = [];
    const tsPattern = /pc_root:sys:([\w-]+)/g;
    while ((match = tsPattern.exec(permTsContent)) !== null) {
      if (!actualCodes.includes(match[1])) {
        actualCodes.push(match[1]);
      }
    }

    for (const code of docCodes) {
      if (!actualCodes.includes(code)) {
        result.warnings.push(`权限编码 'pc_root:sys:${code}' 在文档中存在但在 permissions.ts 中未找到`);
      }
    }

    for (const code of actualCodes) {
      if (!docCodes.includes(code)) {
        result.warnings.push(`权限编码 'pc_root:sys:${code}' 在 permissions.ts 中存在但文档未记录`);
      }
    }
  } else {
    result.warnings.push(`permissions.ts 不存在于 ${permTsPath}，跳过权限编码验证`);
  }
}

function validateComponentReferences(result: ValidationResult): void {
  const compRefRelFile = findFileByBasename('component-reference');
  if (!compRefRelFile) return;

  const compRefContent = fs.readFileSync(path.join(SKILL_DIR, compRefRelFile), 'utf-8');

  const docComponents: string[] = [];
  const compPattern = /`Mfw(\w+)`/g;
  let match: RegExpExecArray | null;
  while ((match = compPattern.exec(compRefContent)) !== null) {
    docComponents.push(`mfw-${match[1].replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`);
  }

  const componentsDir = path.join(
    PROJECT_ROOT,
    'packages/base/src/frontend/components'
  );

  if (fs.existsSync(componentsDir)) {
    const actualComponents: string[] = [];
    const categories = fs.readdirSync(componentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const category of categories) {
      const catDir = path.join(componentsDir, category);
      const subDirs = fs.readdirSync(catDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const sub of subDirs) {
        actualComponents.push(sub);
      }
    }

    for (const comp of actualComponents) {
      if (!docComponents.some(dc => dc === comp || comp.includes(dc.replace('mfw-', '')))) {
        if (comp.startsWith('mfw-')) {
          result.warnings.push(`组件 '${comp}' 在 components/ 目录中存在但 component-reference.md 未记录`);
        }
      }
    }
  }
}

function validateRedFlagsFormat(result: ValidationResult): void {
  const relativeFiles = getAllMdFiles(SKILL_DIR);

  for (const relFile of relativeFiles) {
    const fullPath = path.join(SKILL_DIR, relFile);
    const content = fs.readFileSync(fullPath, 'utf-8');

    const redFlagsMatch = content.match(/## 反模式[^\n]*\n([\s\S]*?)(?=\n## |\n*$)/);
    if (!redFlagsMatch) continue;

    const section = redFlagsMatch[1];
    const lines = section.split('\n').filter(l => l.trim().length > 0);

    const tableLines = lines.filter(l => l.trim().startsWith('|'));
    if (tableLines.length > 0) {
      result.warnings.push(`${relFile}: 反模式区块包含表格格式（${tableLines.length} 行），建议统一为 ✋ emoji 列表格式`);
    }

    const listLines = lines.filter(l => l.trim().startsWith('- '));
    const nonEmojiLines = listLines.filter(l => !l.includes('✋'));
    if (nonEmojiLines.length > 0 && listLines.length > 0) {
      result.warnings.push(`${relFile}: 反模式区块有 ${nonEmojiLines.length} 条列表项缺少 ✋ emoji`);
    }
  }
}

function validateChecklistFiles(result: ValidationResult): void {
  const requiredChecklists = [
    'resources/backend-checklist.md',
    'resources/frontend-checklist.md'
  ];

  for (const checklist of requiredChecklists) {
    const fullPath = path.join(SKILL_DIR, checklist);
    if (!fs.existsSync(fullPath)) {
      result.errors.push(`清单文件 ${checklist} 不存在`);
      result.passed = false;
    }
  }

  const skillContent = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf-8');
  const expectedRefs = [
    '{{ref:resources/backend-checklist}}',
    '{{ref:resources/frontend-checklist}}'
  ];

  for (const ref of expectedRefs) {
    if (!skillContent.includes(ref)) {
      result.warnings.push(`SKILL.md 中缺少引用 ${ref}`);
    }
  }
}

function validateDuplicateContent(result: ValidationResult): void {
  const relativeFiles = getAllMdFiles(SKILL_DIR);
  const duplicatePatterns = [
    { pattern: /禁止手动修改\s*`apis\/?`?\s*目录|apis\/?\s*手改|apis.*红线/, label: 'apis 红线规则' },
    { pattern: /权限编码命名规则|permissionValue|pc_root:sys/, label: '权限编码规则' }
  ];

  for (const { pattern, label } of duplicatePatterns) {
    const matchingFiles: string[] = [];
    for (const relFile of relativeFiles) {
      const fullPath = path.join(SKILL_DIR, relFile);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(pattern);
      if (matches) {
        matchingFiles.push(relFile);
      }
    }
    if (matchingFiles.length >= 3) {
      result.warnings.push(`"${label}" 相关内容在 ${matchingFiles.length} 个文件中出现：${matchingFiles.join(', ')}，建议改为 {{ref:}} 引用`);
    }
  }
}

function validateDirectoryStructure(result: ValidationResult): void {
  const requiredDirs = ['backend', 'frontend', 'auth', 'infra', 'shared', 'resources'];

  for (const dir of requiredDirs) {
    const dirPath = path.join(SKILL_DIR, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      result.errors.push(`Skill 目录缺少必需子目录 '${dir}/'`);
      result.passed = false;
    }
  }

  const rootEntries = fs.readdirSync(SKILL_DIR, { withFileTypes: true });
  const strayMdFiles = rootEntries
    .filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'SKILL.md')
    .map(e => e.name);

  if (strayMdFiles.length > 0) {
    result.warnings.push(`Skill 根目录存在散落的 .md 文件：${strayMdFiles.join(', ')}，应移入对应子目录`);
  }
}

// Run validation
const result = validate();

console.log('\n=== Skill 文档验证报告 ===\n');

if (result.errors.length > 0) {
  console.log('❌ 错误：');
  result.errors.forEach(e => console.log(`  - ${e}`));
}

if (result.warnings.length > 0) {
  console.log('\n⚠️  警告：');
  result.warnings.forEach(w => console.log(`  - ${w}`));
}

if (result.passed && result.warnings.length === 0) {
  console.log('✅ 所有检查通过！');
} else if (result.passed) {
  console.log(`\n✅ 基本检查通过（${result.warnings.length} 个警告）`);
} else {
  console.log(`\n❌ 检查未通过（${result.errors.length} 个错误，${result.warnings.length} 个警告）`);
  process.exit(1);
}
