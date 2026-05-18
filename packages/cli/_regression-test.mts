/**
 * MFW CLI 模板回归测试
 * 覆盖：脚手架生成 → DB连接 → 权限链路 → 模板变量审计
 */
import { renderTemplateToDir } from './src/utils/template.js'
import { ensureDir, writeFile } from './src/utils/fs.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vars = {
  name: 'regression-test',
  displayName: '回归测试',
  description: '回归测试项目',
  port: 3099,
  frontendPort: 5199,
  className: 'RegressionTest',
  version: '0.1.0',
  year: 2026,
}

const templateDir = path.resolve(__dirname, 'src/templates/business')
const outputDir = path.resolve(__dirname, '_test-output', vars.name)

let pass = 0
let fail = 0
function check(condition: boolean, label: string) {
  if (condition) { console.log(`✅ ${label}`); pass++ }
  else { console.log(`❌ ${label}`); fail++ }
}

console.log('═'.repeat(50))
console.log('🧪 MFW CLI 模板回归测试')
console.log('═'.repeat(50))

// ── Phase 1: 脚手架生成 ──
console.log('\n📦 Phase 1: 脚手架生成')
await fs.rm(outputDir, { recursive: true, force: true })
await renderTemplateToDir(templateDir, outputDir, vars)
const keepDirs = ['backend/src/modules', 'backend/src/entities', 'backend/src/database', 'frontend/src/components/Layout']
for (const dir of keepDirs) { await ensureDir(path.join(outputDir, dir)); await writeFile(path.join(outputDir, dir, '.gitkeep'), '') }

async function getAllFiles(dir: string): Promise<string[]> {
  const r: string[] = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name)
    if (e.isDirectory()) r.push(...await getAllFiles(fp)); else r.push(fp)
  }
  return r
}
const files = (await getAllFiles(outputDir)).map(f => path.relative(outputDir, f).replace(/\\/g, '/'))

check(files.length >= 26, `文件数 ≥ 26 (实际: ${files.length})`)
check(files.includes('backend/src/main.ts'), 'backend/src/main.ts 存在')
check(files.includes('frontend/src/main.ts'), 'frontend/src/main.ts 存在')
check(files.includes('shared/src/permissions.ts'), 'shared/src/permissions.ts 存在')

// ── Phase 2: 模板变量替换 ──
console.log('\n🔤 Phase 2: 模板变量替换')
const sharedPerms = await fs.readFile(path.join(outputDir, 'shared/src/permissions.ts'), 'utf-8')
check(sharedPerms.includes('REGRESSIONTEST_PERMISSION_VALUES'), 'pascalCaseUpper 正确 → REGRESSIONTEST_PERMISSION_VALUES')
check(sharedPerms.includes('RegressionTestPermissionName'), 'pascalCase 类型名正确')

const envFile = await fs.readFile(path.join(outputDir, 'backend/.env'), 'utf-8')
check(envFile.includes('DB_NAME=regression_test'), 'snakeCase 正确 → regression_test')
check(envFile.includes('NODE_ENV=development'), 'NODE_ENV=development 存在')
check(envFile.includes('PORT=3099'), '端口变量替换正确')

const bePerms = await fs.readFile(path.join(outputDir, 'backend/src/permissions.ts'), 'utf-8')
check(bePerms.includes('REGRESSIONTEST_PERMISSION_VALUES'), 'backend 权限导入名匹配 shared')
check(bePerms.includes("'regression-test-shared'"), "backend 包引用 → 'regression-test-shared'")

const fePerms = await fs.readFile(path.join(outputDir, 'frontend/src/permissions.ts'), 'utf-8')
check(fePerms.includes('REGRESSIONTEST_PERMISSION_VALUES'), 'frontend 权限导入名匹配 shared')

// shared tsconfig
const sharedTsconfig = JSON.parse(await fs.readFile(path.join(outputDir, 'shared/tsconfig.json'), 'utf-8'))
check(sharedTsconfig.compilerOptions.declaration === true, 'shared tsconfig 有 declaration')
check(sharedTsconfig.compilerOptions.declarationMap === true, 'shared tsconfig 有 declarationMap')

// 包依赖
const bePkg = JSON.parse(await fs.readFile(path.join(outputDir, 'backend/package.json'), 'utf-8'))
check(bePkg.dependencies['regression-test-shared'] === 'workspace:*', 'backend 依赖 shared 正确')

const fePkg = JSON.parse(await fs.readFile(path.join(outputDir, 'frontend/package.json'), 'utf-8'))
check(fePkg.dependencies['regression-test-shared'] === 'workspace:*', 'frontend 依赖 shared 正确')

// Vue 插值不被 Handlebars 吞掉
const dashVue = await fs.readFile(path.join(outputDir, 'frontend/src/views/dashboard/Index.vue'), 'utf-8')
check(dashVue.includes('v-text="apiCount"'), 'Vue apiCount 用 v-text 避免被 Handlebars 吞掉')
check(!dashVue.includes('{{ apiCount }}'), '原始 Vue 插值已替换')

// ── Phase 3: 关键入口函数检查 ──
console.log('\n⚙️  Phase 3: 入口函数')
const beMain = await fs.readFile(path.join(outputDir, 'backend/src/main.ts'), 'utf-8')
check(beMain.includes('createBaseBackendApp'), '使用 createBaseBackendApp')
check(beMain.includes("name: '回归测试'"), 'name 参数正确')

const feMain = await fs.readFile(path.join(outputDir, 'frontend/src/main.ts'), 'utf-8')
check(feMain.includes('createBaseAdminApp'), '使用 createBaseAdminApp')
check(feMain.includes("title: '回归测试'"), 'title 参数正确')

// ── Phase 4: Extension 模板修复验证 ──
console.log('\n🔧 Phase 4: Extension 模板修复验证')
const extTemplateDir = path.resolve(__dirname, 'src/templates/extension')
const extOutputDir = path.resolve(__dirname, '_test-output/regression-ext')
await fs.rm(extOutputDir, { recursive: true, force: true })
const extVars = {
  name: 'regression-ext',
  displayName: '回归扩展',
  description: '回归测试扩展',
  routePrefix: '/ext/regression-ext',
  permPrefix: 'regression-ext',
  className: 'RegressionExt',
  packageName: 'moyan-mfw-extension-regression-ext',
  hasBackend: true, hasFrontend: true, hasShared: true,
  version: '0.1.0', year: 2026,
}
await renderTemplateToDir(extTemplateDir, extOutputDir, extVars)
const extSharedIndex = await fs.readFile(path.join(extOutputDir, 'shared/src/index.ts'), 'utf-8')
check(extSharedIndex.includes('回归扩展共享类型定义'), 'DisplayName→displayName 修复：注释含 "回归扩展共享类型定义"')
check(!extSharedIndex.includes('{{DisplayName}}'), '无残留 {{DisplayName}}')
const extMain = await fs.readFile(path.join(extOutputDir, 'backend/src/main.ts'), 'utf-8')
check(extMain.includes('回归扩展扩展包后端独立启动'), 'backend main.ts 注释含 displayName')
// tsconfig references 路径正确
const extTsconfig = JSON.parse(await fs.readFile(path.join(extOutputDir, 'tsconfig.json'), 'utf-8'))
check(extTsconfig.references[0].path === './shared/tsconfig.json', 'tsconfig references → ./shared/')
check(extTsconfig.references[1].path === './backend/tsconfig.json', 'tsconfig references → ./backend/')
check(extTsconfig.references[2].path === './frontend/tsconfig.json', 'tsconfig references → ./frontend/')
check(extTsconfig.references.every((r: {path: string}) => !r.path.includes('/src/')), '无 ./src/ 前缀残留')
// vite.config alias 前缀正确
const extViteConfig = await fs.readFile(path.join(extOutputDir, 'frontend/vite.config.mts'), 'utf-8')
check(extViteConfig.includes("'moyan-mfw-extension-regression-ext/shared'"), 'vite.config alias 含 -mfw- 前缀')
check(!extViteConfig.includes("'moyan-extension-"), '无 moyan-extension- 错误前缀残留')
// sub-package workspace:* 完整性
const extBePkg = JSON.parse(await fs.readFile(path.join(extOutputDir, 'backend/package.json'), 'utf-8'))
const extFePkg = JSON.parse(await fs.readFile(path.join(extOutputDir, 'frontend/package.json'), 'utf-8'))
check(extBePkg.dependencies['moyan-mfw-base/backend'] === 'workspace:*', 'backend package 使用 workspace:*')
check(extFePkg.dependencies['moyan-mfw-base/frontend'] === 'workspace:*', 'frontend package 使用 workspace:*')

// ── 结果 ──
console.log(`\n${'═'.repeat(40)}`)
console.log(`📊 结果: ${pass}/${pass + fail} 通过`)
if (fail > 0) {
  console.log(`❌ ${fail} 项失败，请检查上述输出`)
  process.exit(1)
} else {
  console.log('🎉 全部通过，CLI 模板回归测试合格')
}
