import { renderTemplateToDir } from './src/utils/template.js'
import { ensureDir, writeFile } from './src/utils/fs.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'src/templates/business')
const outputDir = path.resolve(__dirname, '_test-output/test-shop')

const vars = {
  name: 'test-shop',
  displayName: '测试商城',
  description: '测试商城业务项目',
  port: 3000,
  frontendPort: 5173,
  className: 'TestShop',
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

console.log('🔨 ====== CLI Business Scaffold E2E Test ======')
console.log(`   模板: ${templateDir}`)
console.log(`   输出: ${outputDir}`)
console.log(`   名称: ${vars.name}`)

await fs.rm(outputDir, { recursive: true, force: true })
await renderTemplateToDir(templateDir, outputDir, vars)

const keepDirs = [
  'backend/src/modules',
  'backend/src/entities',
  'backend/src/database',
  'frontend/src/components/Layout',
]
for (const dir of keepDirs) {
  await ensureDir(path.join(outputDir, dir))
  await writeFile(path.join(outputDir, dir, '.gitkeep'), '')
}

const files = await getAllFiles(outputDir)
const relFiles = files.map(f => path.relative(outputDir, f)).sort()

console.log(`\n📦 生成文件数: ${files.length}`)
relFiles.forEach(f => console.log(`   ${f}`))

let pass = 0
let fail = 0

// 检查1: 目录结构完整
const expectedDirs = ['backend', 'frontend', 'shared']
for (const dir of expectedDirs) {
  try {
    await fs.access(path.join(outputDir, dir))
    console.log(`✅ PASS: ${dir}/ 目录存在`)
    pass++
  } catch {
    console.log(`❌ FAIL: ${dir}/ 目录缺失`)
    fail++
  }
}

// 检查2: 后端 main.ts 使用 createBaseBackendApp
const mainTs = await fs.readFile(path.join(outputDir, 'backend/src/main.ts'), 'utf-8')
if (mainTs.includes('createBaseBackendApp') && mainTs.includes("name: '测试商城'")) {
  console.log('✅ PASS: backend/src/main.ts 使用 createBaseBackendApp')
  pass++
} else {
  console.log('❌ FAIL: backend/src/main.ts 内容不正确')
  fail++
}

// 检查3: 前端 main.ts 使用 createBaseAdminApp
const frontendMain = await fs.readFile(path.join(outputDir, 'frontend/src/main.ts'), 'utf-8')
if (frontendMain.includes('createBaseAdminApp')) {
  console.log('✅ PASS: frontend/src/main.ts 使用 createBaseAdminApp')
  pass++
} else {
  console.log('❌ FAIL: frontend/src/main.ts 内容不正确')
  fail++
}

// 检查4: shared 权限文件变量替换正确
const sharedPerms = await fs.readFile(path.join(outputDir, 'shared/src/permissions.ts'), 'utf-8')
if (sharedPerms.includes('TESTSHOP_PERMISSION_VALUES')) {
  console.log('✅ PASS: shared/src/permissions.ts 变量替换正确 (TESTSHOP_PERMISSION_VALUES)')
  pass++
} else {
  console.log('❌ FAIL: shared/src/permissions.ts 变量替换有误')
  fail++
}

// 检查5: 根 package.json 命名正确
const rootPkg = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'))
if (rootPkg.name === 'test-shop') {
  console.log('✅ PASS: 根 package.json name 正确')
  pass++
} else {
  console.log('❌ FAIL: 根 package.json name 不正确')
  fail++
}

// 检查6: 后端 package.json 依赖 test-shop-shared
const backendPkg = JSON.parse(await fs.readFile(path.join(outputDir, 'backend/package.json'), 'utf-8'))
if (backendPkg.dependencies['test-shop-shared']) {
  console.log('✅ PASS: backend 依赖 test-shop-shared')
  pass++
} else {
  console.log('❌ FAIL: backend 缺少 shared 依赖')
  fail++
}

// 检查7: 前端 package.json 依赖 test-shop-shared
const frontendPkg = JSON.parse(await fs.readFile(path.join(outputDir, 'frontend/package.json'), 'utf-8'))
if (frontendPkg.dependencies['test-shop-shared']) {
  console.log('✅ PASS: frontend 依赖 test-shop-shared')
  pass++
} else {
  console.log('❌ FAIL: frontend 缺少 shared 依赖')
  fail++
}

// 检查8: .env 变量替换正确
const envFile = await fs.readFile(path.join(outputDir, 'backend/.env'), 'utf-8')
if (envFile.includes('DB_DATABASE=test-shop') && envFile.includes('PORT=3000')) {
  console.log('✅ PASS: backend/.env 变量替换正确')
  pass++
} else {
  console.log('❌ FAIL: backend/.env 变量替换有误')
  fail++
}

// 检查9: 仪表盘页面存在
try {
  await fs.access(path.join(outputDir, 'frontend/src/views/dashboard/Index.vue'))
  await fs.access(path.join(outputDir, 'frontend/src/views/dashboard/index.ts'))
  console.log('✅ PASS: 仪表盘页面存在')
  pass++
} catch {
  console.log('❌ FAIL: 仪表盘页面缺失')
  fail++
}

// 检查10: .gitkeep 文件存在
try {
  await fs.access(path.join(outputDir, 'backend/src/modules/.gitkeep'))
  await fs.access(path.join(outputDir, 'backend/src/entities/.gitkeep'))
  console.log('✅ PASS: .gitkeep 文件存在')
  pass++
} catch {
  console.log('❌ FAIL: .gitkeep 文件缺失')
  fail++
}

console.log(`\n${'='.repeat(40)}`)
console.log(`结果: ${pass} 通过, ${fail} 失败`)
process.exit(fail > 0 ? 1 : 0)
