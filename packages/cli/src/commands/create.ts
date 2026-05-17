import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs/promises'
import { exists, ensureDir, writeFile } from '../utils/fs.js'
import { renderTemplateToDir } from '../utils/template.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface CreateOptions {
  template?: string
  dir?: string
  force?: boolean
}

interface Answers {
  displayName: string
  description: string
  routePrefix: string
  hasBackend: boolean
  hasFrontend: boolean
  hasShared: boolean
}

export const createCommand = new Command('extension')
  .description('Create a new MFW extension package')
  .argument('<name>', 'Extension name in kebab-case (e.g., "ad", "blog")')
  .option('-t, --template <name>', 'Template to use', 'default')
  .option('-d, --dir <path>', 'Output directory', 'packages/extensions')
  .option('-f, --force', 'Force overwrite existing directory', false)
  .action(async (name: string, opts: CreateOptions) => {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      console.error(chalk.red(`Invalid name "${name}". Must be kebab-case.`))
      process.exit(1)
    }

    const className = name.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase())
    const targetDir = path.resolve(opts.dir!, `extension-${name}`)

    if (await exists(targetDir)) {
      if (!opts.force) {
        console.error(chalk.red(`Directory already exists: ${targetDir}\nUse --force to overwrite.`))
        process.exit(1)
      }
    }

    const answers = await inquirer.prompt<Answers>([
      { name: 'displayName', message: '显示名称:', default: className },
      { name: 'description', message: '描述:', default: '' },
      { name: 'routePrefix', message: '路由前缀:', default: `/ext/${name}` },
      { name: 'hasBackend', message: '需要后端模块?', type: 'confirm', default: true },
      { name: 'hasFrontend', message: '需要前端页面?', type: 'confirm', default: true },
      { name: 'hasShared', message: '需要共享层?', type: 'confirm', default: true },
    ])

    if (!answers.routePrefix.startsWith('/ext/')) {
      console.error(chalk.red(`routePrefix must start with "/ext/", got: "${answers.routePrefix}"`))
      process.exit(1)
    }

    const vars = {
      name,
      displayName: answers.displayName,
      description: answers.description,
      routePrefix: answers.routePrefix,
      permPrefix: name,
      className,
      packageName: `moyan-mfw-extension-${name}`,
      hasBackend: answers.hasBackend,
      hasFrontend: answers.hasFrontend,
      hasShared: answers.hasShared,
      version: '0.1.0',
      year: new Date().getFullYear(),
    }

    const templateDir = path.resolve(__dirname, '../templates/extension')
    console.log(chalk.blue(`\n🔨 Generating extension "${name}" at ${targetDir}...`))

    await renderTemplateToDir(templateDir, targetDir, vars)

    if (!vars.hasBackend) {
      await fs.rm(path.join(targetDir, 'src/backend'), { recursive: true, force: true })
    }
    if (!vars.hasFrontend) {
      await fs.rm(path.join(targetDir, 'src/frontend'), { recursive: true, force: true })
    }
    if (!vars.hasShared) {
      await fs.rm(path.join(targetDir, 'src/shared'), { recursive: true, force: true })
    }

    await ensureDir(path.join(targetDir, 'database/migrations'))
    await writeFile(path.join(targetDir, 'database/migrations', '.gitkeep'), '')

    console.log(chalk.green('\n✅ Done!'))
    console.log(`\n${chalk.bold('📋 后续集成步骤:')}`)
    console.log(`   1. cd ${path.relative(process.cwd(), targetDir)} && pnpm install`)
    console.log('   2. 根 package.json → scripts.build 中添加构建命令')
    console.log('   3. 根 package.json → scripts.typecheck 中添加子包引用')
    console.log('   4. （如需后端）注册扩展 Module 到应用入口')
    console.log(chalk.gray('\n💡 P2 阶段将提供 mfw integrate <name> 自动完成步骤 2-4'))
  })
