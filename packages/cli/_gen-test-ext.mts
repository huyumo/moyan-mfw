import { renderTemplateToDir } from './src/utils/template.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'src/templates/extension')
const outputDir = path.resolve(__dirname, '_test-output/test-ext')

const vars = {
  name: 'test-ext',
  displayName: '测试扩展',
  description: '用于验证删除 extension.json 后 CLI 脚手架是否正常',
  routePrefix: '/ext/test-ext',
  permPrefix: 'test-ext',
  className: 'TestExt',
  packageName: 'moyan-mfw-extension-test-ext',
  hasBackend: true,
  hasFrontend: true,
  hasShared: true,
  version: '0.1.0',
  year: new Date().getFullYear(),
}

async function getAllFiles(dir) {
  const results = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...(await getAllFiles(fullPath)))
    else results.push(fullPath)
  }
  return results
}

console.log('🔨 ====== CLI Scaffold E2E Test ======')
console.log(`   模板: ${templateDir}`)
console.log(`   输出: ${outputDir}`)
console.log(`   名称: ${vars.name}`)

await fs.rm(outputDir, { recursive: true, force: true })
await renderTemplateToDir(templateDir, outputDir, vars)

const files = await getAllFiles(outputDir)
const relFiles = files.map(f => path.relative(outputDir, f)).sort()

console.log(`\n📦 生成文件数: ${files.length}`)
relFiles.forEach(f => console.log(`   ${f}`))

// === 核心验证 ===
let pass = 0
let fail = 0

// 检查1: 不应存在 extension.json
const hasExtensionJson = relFiles.includes('extension.json')
if (hasExtensionJson) {
  console.log('\n❌ FAIL: extension.json 仍然存在！')
  fail++
} else {
  console.log('\n✅ PASS: 无 extension.json')
  pass++
}

// 检查2: 后端 main.ts 应包含 createExtensionBackendApp({ name, module })
const mainTs = await fs.readFile(path.join(outputDir, 'backend/src/main.ts'), 'utf-8')
if (mainTs.includes("name: 'test-ext'") && mainTs.includes('module: TestExtModule') && !mainTs.includes('manifest')) {
  console.log('✅ PASS: backend/src/main.ts 简化正确，无 manifest')
  pass++
} else {
  console.log('❌ FAIL: backend/src/main.ts 可能包含过时内容')
  fail++
}

// 检查3: 根 package.json 应有 backend import 条件
const pkgJson = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'))
if (pkgJson.exports['./backend'].import && pkgJson.exports['./backend/*'].import) {
  console.log('✅ PASS: package.json backend exports 有 import 条件')
  pass++
} else {
  console.log('❌ FAIL: package.json backend exports 缺少 import 条件')
  fail++
}

// 检查4: 文件变量替换正确
const sharedIndex = await fs.readFile(path.join(outputDir, 'shared/src/index.ts'), 'utf-8')
if (sharedIndex.includes('TestExtItemType') && sharedIndex.includes('TESTEXT_PATHS') && sharedIndex.includes('TESTEXT_EXTENSION_PERMISSION_VALUES')) {
  console.log('✅ PASS: shared/src/index.ts 变量替换正确（带连字符的名称处理正确）')
  pass++
} else {
  console.log('❌ FAIL: shared/src/index.ts 变量替换可能有误')
  fail++
}

// 检查5: 文件名替换正确
const moduleFile = path.join(outputDir, 'backend/src/test-ext.module.ts')
try {
  await fs.access(moduleFile)
  console.log('✅ PASS: 文件名 {{name}}.module.ts → test-ext.module.ts 替换正确')
  pass++
} catch {
  console.log('❌ FAIL: backend/src/test-ext.module.ts 不存在')
  fail++
}

// 检查6: 验证 shop-extension 也没有 extension.json
try {
  await fs.access('E:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw-test/shop-extension/extension.json')
  console.log('⚠️  WARN: shop-extension 仍有 extension.json 残留')
} catch {
  console.log('✅ PASS: shop-extension 无 extension.json 残留')
  pass++
}

console.log(`\n${'='.repeat(40)}`)
console.log(`结果: ${pass} 通过, ${fail} 失败`)
process.exit(fail > 0 ? 1 : 0)
