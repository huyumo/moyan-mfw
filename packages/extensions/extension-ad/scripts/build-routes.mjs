/**
 * 路由预构建脚本
 * 扫描 src/frontend/views/ 生成 src/frontend/routes.gen.ts
 * 解决 import.meta.glob 在 npm 发布后不可用的问题
 */
import { glob } from 'glob'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { relative, dirname } from 'path'

const VIEWS_DIR = 'src/frontend/views'
const OUTPUT = 'src/frontend/routes.gen.ts'

const files = await glob(`${VIEWS_DIR}/**/index.ts`)

const imports = files.map((f, i) => {
  const relPath = relative(dirname(OUTPUT), f).replace(/\\/g, '/')
  const name = `route_${i}`
  return `import ${name} from '${relPath}'`
})

const routeList = files.map((_, i) => `route_${i}`).join(', ')

const content = `/**
 * @fileoverview 路由预构建产物
 * @description 由 scripts/build-routes.mjs 自动生成，禁止手动修改
 */

${imports.join('\n')}

export const routesFromConfig = [${routeList}]
`

if (!existsSync(dirname(OUTPUT))) mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, content)
console.log(`[build-routes] Generated ${OUTPUT} with ${files.length} routes`)
