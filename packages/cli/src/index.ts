#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { createCommand } from './commands/create.js'
import { createBusinessCommand } from './commands/create-business.js'

const program = new Command()

program
  .name('mfw')
  .description('Moyan MFW Framework CLI')
  .version('0.1.0')

const createCmd = new Command('create').description('Create a new extension or resource')
createCmd.addCommand(createCommand)
createCmd.addCommand(createBusinessCommand)

program.addCommand(createCmd)

program.command('generate').description('Generate code within an extension').action(() => {
  console.log(chalk.yellow('generate command coming soon'))
})

program.command('validate').description('Validate an extension package').action(() => {
  console.log(chalk.yellow('validate command coming soon'))
})

program.command('version').description('Version management utilities').action(() => {
  console.log(chalk.yellow('version command coming soon'))
})

program.parse()
