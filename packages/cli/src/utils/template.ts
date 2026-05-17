import Handlebars from 'handlebars'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
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
    const outputName = relative.replace(/\.hbs$/, '')
    const outputPath = path.join(outputDir, outputName)
    const content = await renderTemplate(file, vars)
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
