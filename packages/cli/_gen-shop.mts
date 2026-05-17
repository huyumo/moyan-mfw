import { renderTemplateToDir } from './src/utils/template.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, 'src/templates/extension')
const outputDir = 'E:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw-test/shop-extension'

const vars = {
  name: 'shop',
  displayName: '商城管理',
  description: '商城管理扩展',
  routePrefix: '/ext/shop',
  permPrefix: 'shop',
  className: 'Shop',
  packageName: 'moyan-mfw-extension-shop',
  hasBackend: true,
  hasFrontend: true,
  hasShared: true,
  version: '0.1.0',
  year: new Date().getFullYear(),
}

console.log('🔨 Generating shop extension...')
console.log('   Template:', templateDir)
console.log('   Output:', outputDir)

await fs.rm(outputDir, { recursive: true, force: true })
await renderTemplateToDir(templateDir, outputDir, vars)

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

const files = await getAllFiles(outputDir)
console.log('\n✅ Generated', files.length, 'files:')
files.forEach(f => console.log('   ', path.relative(outputDir, f)))
