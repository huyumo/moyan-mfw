import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exists, ensureDir, writeFile } from '../utils/fs.js'
import { renderTemplateToDir } from '../utils/template.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface CreateBusinessOptions {
  dir?: string
  force?: boolean
}

interface Answers {
  displayName: string
  description: string
  port: string
  frontendPort: string
}

export const createBusinessCommand = new Command('business')
  .description('Create a new business project (backend + frontend + shared)')
  .argument('<name>', 'Project name in kebab-case (e.g., "my-shop")')
  .option('-d, --dir <path>', 'Output directory', '.')
  .option('-f, --force', 'Force overwrite existing directory', false)
  .action(async (name: string, opts: CreateBusinessOptions) => {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      console.error(chalk.red(`Invalid name "${name}". Must be kebab-case (e.g., "my-shop").`))
      process.exit(1)
    }

    const targetDir = path.resolve(opts.dir!, name)
    const className = name.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase())

    if (await exists(targetDir)) {
      if (!opts.force) {
        console.error(chalk.red(`Directory already exists: ${targetDir}\nUse --force to overwrite.`))
        process.exit(1)
      }
    }

    const answers = await inquirer.prompt<Answers>([
      {
        name: 'displayName',
        message: '显示名称:',
        default: className,
      },
      {
        name: 'description',
        message: '描述:',
        default: `${className} 业务项目`,
      },
      {
        name: 'port',
        message: '后端端口:',
        default: '3000',
        validate: (v: string) => {
          const n = Number(v)
          return (n > 0 && n < 65536) ? true : '端口号必须在 1-65535 之间'
        },
      },
      {
        name: 'frontendPort',
        message: '前端端口:',
        default: '5173',
        validate: (v: string) => {
          const n = Number(v)
          return (n > 0 && n < 65536) ? true : '端口号必须在 1-65535 之间'
        },
      },
    ])

    const vars = {
      name,
      displayName: answers.displayName,
      description: answers.description,
      port: Number(answers.port),
      frontendPort: Number(answers.frontendPort),
      className,
      version: '0.1.0',
      year: new Date().getFullYear(),
    }

    const templateDir = path.resolve(__dirname, '../templates/business')
    console.log(chalk.blue(`\n🔨 Generating business project "${name}" at ${targetDir}...`))

    await renderTemplateToDir(templateDir, targetDir, vars)

    const keepDirs = [
      'backend/src/modules',
      'backend/src/entities',
      'backend/src/database',
      'frontend/src/components/Layout',
    ]
    for (const dir of keepDirs) {
      await ensureDir(path.join(targetDir, dir))
      await writeFile(path.join(targetDir, dir, '.gitkeep'), '')
    }

    console.log(chalk.green('\n✅ Done!'))
    console.log(`\n${chalk.bold('📋 后续步骤:')}`)
    console.log(`   1. cd ${path.relative(process.cwd(), targetDir)}`)
    console.log(`   2. 编辑 backend/.env 配置数据库连接`)
    console.log(`   3. pnpm install && pnpm build`)
    console.log(`   4. pnpm --filter ${name}-backend dev   # 启动后端`)
    console.log(`   5. pnpm --filter ${name}-frontend dev  # 启动前端`)
    console.log(`\n${chalk.gray('💡 添加扩展模块: 在 backend/src/app.modules.ts 中引入扩展 Module')}`)
    console.log(`${chalk.gray('💡 添加业务模块: 在 backend/src/modules/ 下创建新的 NestJS 模块')}`)
  })
