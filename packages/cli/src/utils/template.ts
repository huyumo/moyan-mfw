import Handlebars from 'handlebars'
import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFile } from './fs.js'

interface TemplateVars {
  [key: string]: unknown
}

Handlebars.registerHelper('pascalCase', (str: string) =>
  str.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase()),
)

Handlebars.registerHelper('camelCase', (str: string) =>
  str.replace(/-(\w)/g, (_, c) => c.toUpperCase()),
)

Handlebars.registerHelper('pascalCaseUpper', (str: string) => {
  const pascal = str.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase())
  return pascal.toUpperCase()
})

Handlebars.registerHelper('snakeCase', (str: string) => str.replace(/-/g, '_'))

export function getTemplateDir(type: 'extension' | 'business'): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const distTemplate = path.resolve(currentDir, `templates/${type}`)
  const srcTemplate = path.resolve(currentDir, `../templates/${type}`)
  if (fsSync.existsSync(distTemplate)) return distTemplate
  if (fsSync.existsSync(srcTemplate)) return srcTemplate
  return distTemplate
}

function getParser(filePath: string): string | null {
  const ext = path.extname(filePath)
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'babel',
    '.jsx': 'babel',
    '.mjs': 'babel',
    '.cjs': 'babel',
    '.vue': 'vue',
    '.json': 'json',
    '.md': 'markdown',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.yaml': 'yaml',
    '.yml': 'yaml',
  }
  return map[ext] ?? null
}

async function formatContent(content: string, filePath: string): Promise<string> {
  const parser = getParser(filePath)
  if (!parser) return content
  try {
    const mod = await import('prettier')
    const fmt = mod.default ?? mod
    if (typeof fmt.format !== 'function') return content
    const formatted = await fmt.format(content, {
      parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      endOfLine: 'lf',
    })
    return formatted
  } catch {
    return content
  }
}

export async function renderTemplate(
  templatePath: string,
  vars: TemplateVars,
): Promise<string> {
  const source = await fs.readFile(templatePath, 'utf-8')
  const compiled = Handlebars.compile(source)
  return compiled(vars)
}

export async function renderTemplateToDir(
  templateDir: string,
  outputDir: string,
  vars: TemplateVars,
): Promise<void> {
  const files = await getAllFiles(templateDir)
  for (const file of files) {
    const relative = path.relative(templateDir, file)
    if (!relative.endsWith('.hbs')) continue
    const outputNameRaw = relative.replace(/\.hbs$/, '').replace(/\\/g, '/')
    const outputName = Handlebars.compile(outputNameRaw)(vars)
    const outputPath = path.join(outputDir, outputName)
    const raw = await renderTemplate(file, vars)
    const content = await formatContent(raw, outputPath)
    await writeFile(outputPath, content)
  }
}

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
