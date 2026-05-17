/**
 * @fileoverview 端到端验证：脚手架生成 + Prettier 格式化
 */
import { renderTemplateToDir } from './src/utils/template.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'src/templates/extension')
const outputDir = path.resolve(__dirname, '_test-output/blog')

const vars = {
  name: 'blog',
  displayName: '博客管理',
  description: '博客内容管理模块',
  routePrefix: '/ext/blog',
  permPrefix: 'blog',
  className: 'Blog',
  packageName: 'moyan-mfw-extension-blog',
  hasBackend: true,
  hasFrontend: true,
  hasShared: true,
  version: '0.1.0',
  year: new Date().getFullYear(),
}

console.log('🔨 模板:', templateDir)
console.log('📂 输出:', outputDir)
console.log('📋 变量:', JSON.stringify(vars, null, 2))
console.log('')

await fs.rm(outputDir, { recursive: true, force: true })
await renderTemplateToDir(templateDir, outputDir, vars)

// 遍历所有生成的文件
async function walk(dir: string, base = ''): Promise<void[]> {
  const results: void[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...(await walk(path.join(dir, entry.name), rel)))
    } else {
      results.push(void 0)
    }
  }
  return results
}

const files = await getAllFiles(outputDir)
console.log(`\n✅ 生成完成，共 ${files.length} 个文件:\n`)

let formatIssues = 0
for (const f of files) {
  const rel = path.relative(outputDir, f)
  const content = await fs.readFile(f, 'utf-8')

  // 检查 1: 是否有 trailing whitespace（Prettier 会清除）
  const trailingLines = content.split('\n').filter((l) => l.endsWith(' ') || l.endsWith('\t'))
  if (trailingLines.length > 0) {
    console.log(`  ⚠️ ${rel} — ${trailingLines.length} 行有尾部空白`)
    formatIssues++
  }

  // 检查 2: JSON 文件是否为多行格式化
  if (f.endsWith('.json') && !content.includes('\n')) {
    console.log(`  ❌ ${rel} — JSON 未格式化（单行）`)
    formatIssues++
  } else if (f.endsWith('.json') && content.includes('\n')) {
    console.log(`  ✅ ${rel} — JSON 已格式化 (${content.split('\n').length} 行)`)
  }

  // 检查 3: TS 文件是否有合理缩进
  if ((f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts')) {
    const indentedLines = content.split('\n').filter((l) => l.startsWith('  '))
    if (indentedLines.length > 0) {
      console.log(`  ✅ ${rel} — 有缩进 (${indentedLines.length} 行缩进)`)
    } else if (content.split('\n').length > 3) {
      console.log(`  ⚠️ ${rel} — 可能无缩进`)
      formatIssues++
    }
  }
}

if (formatIssues === 0) {
  console.log(`\n🎉 全部文件格式正确！`)
} else {
  console.log(`\n⚠️ 发现 ${formatIssues} 个格式问题`)
}

process.exit(formatIssues > 0 ? 1 : 0)

async function getAllFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await getAllFiles(fullPath)))
    } else {
      results.push(fullPath)
    }
  }
  return results
}
