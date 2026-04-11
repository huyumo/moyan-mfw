/**
 * 路径管理工具
 *
 * 从 paths.json 配置文件加载和管理所有输入/输出目录路径
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PathsConfig {
  input: {
    teamConfig: string;
    harnessConfig: string;
    taskFile: string;
    memory: string;
    rules: string;
    templates: string;
    config: Record<string, string>;
  };
  output: {
    directory: string;
    logs: Record<string, string>;
    analysis: string;
    suggestions: string;
  };
  harness: {
    root: string;
    hooks: string;
    scripts: string;
    utils: string;
  };
}

let cachedConfig: PathsConfig | null = null;

/**
 * 查找项目根目录
 */
export function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    const pathsConfig = path.join(currentDir, '.harness', 'config', 'paths.json');
    if (fs.existsSync(pathsConfig)) {
      return currentDir;
    }
    if (fs.existsSync(path.join(currentDir, 'TASK.md'))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  return process.cwd();
}

/**
 * 加载路径配置
 */
export function loadPathsConfig(projectRoot?: string): PathsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const root = projectRoot || findProjectRoot();
  const pathsConfigPath = path.join(root, '.claude', 'harness', 'config', 'paths.json');

  if (!fs.existsSync(pathsConfigPath)) {
    // 返回默认配置
    return getDefaultPathsConfig(root);
  }

  try {
    const config: PathsConfig = JSON.parse(fs.readFileSync(pathsConfigPath, 'utf-8'));
    // 将所有相对路径转换为绝对路径
    cachedConfig = resolvePaths(config, root);
    return cachedConfig;
  } catch (error) {
    console.error(`加载 paths.json 失败：${error}`);
    return getDefaultPathsConfig(root);
  }
}

/**
 * 获取默认路径配置
 */
function getDefaultPathsConfig(projectRoot: string): PathsConfig {
  return {
    input: {
      teamConfig: path.join(projectRoot, '.harness', 'team.json'),
      harnessConfig: path.join(projectRoot, '.claude', 'harness', 'config.json'),
      taskFile: path.join(projectRoot, '.claude', 'TASK.md'),
      memory: path.join(projectRoot, '.harness', 'memory'),
      rules: path.join(projectRoot, '.harness', 'rules'),
      templates: path.join(projectRoot, '.harness', 'templates'),
      config: {
        techStack: path.join(projectRoot, '.claude', 'harness', 'config', 'tech-stack.json'),
        backend: path.join(projectRoot, '.claude', 'harness', 'config', 'backend.json'),
        frontend: path.join(projectRoot, '.claude', 'harness', 'config', 'frontend.json'),
        review: path.join(projectRoot, '.claude', 'harness', 'config', 'review.json'),
        docs: path.join(projectRoot, '.claude', 'harness', 'config', 'docs.json'),
        analysis: path.join(projectRoot, '.claude', 'harness', 'config', 'analysis.json')
      }
    },
    output: {
      directory: path.join(projectRoot, '.harness', 'output'),
      logs: {
        identity: path.join(projectRoot, '.harness', 'output', 'identity-greeting.log'),
        sessionStart: path.join(projectRoot, '.harness', 'output', 'session-start.log'),
        sessionEnd: path.join(projectRoot, '.harness', 'output', 'session-end.log'),
        taskAnalysis: path.join(projectRoot, '.harness', 'output', 'task-analysis.log'),
        testStrategy: path.join(projectRoot, '.harness', 'output', 'test-strategy.log'),
        preCode: path.join(projectRoot, '.harness', 'output', 'pre-code.log'),
        codeQuality: path.join(projectRoot, '.harness', 'output', 'code-quality-gate.log'),
        teammates: path.join(projectRoot, '.harness', 'output', 'teammates.log'),
        subagentReview: path.join(projectRoot, '.harness', 'output', 'subagent-review.log'),
        subagentFiles: path.join(projectRoot, '.harness', 'output', 'subagent-files.log'),
        meetingRequired: path.join(projectRoot, '.harness', 'output', 'meeting-required.log'),
        docsTemplate: path.join(projectRoot, '.harness', 'output', 'docs-template.log'),
        architectContext: path.join(projectRoot, '.harness', 'output', 'architect-context.log'),
        backendSecurity: path.join(projectRoot, '.harness', 'output', 'backend-security.log'),
        frontendGuidelines: path.join(projectRoot, '.harness', 'output', 'frontend-guidelines.log'),
        reviewChecklist: path.join(projectRoot, '.harness', 'output', 'review-checklist.log'),
        pmContext: path.join(projectRoot, '.harness', 'output', 'pm-context.log')
      },
      analysis: path.join(projectRoot, '.harness', 'output', 'analysis'),
      suggestions: path.join(projectRoot, '.harness', 'output', 'suggestions')
    },
    harness: {
      root: path.join(projectRoot, '.harness'),
      hooks: path.join(projectRoot, '.harness', 'hooks'),
      scripts: path.join(projectRoot, '.harness', 'scripts'),
      utils: path.join(projectRoot, '.harness', 'utils')
    }
  };
}

/**
 * 将相对路径转换为绝对路径
 */
function resolvePaths(config: PathsConfig, projectRoot: string): PathsConfig {
  const resolved: PathsConfig = {
    input: {
      teamConfig: path.isAbsolute(config.input.teamConfig)
        ? config.input.teamConfig
        : path.join(projectRoot, config.input.teamConfig),
      harnessConfig: path.isAbsolute(config.input.harnessConfig)
        ? config.input.harnessConfig
        : path.join(projectRoot, config.input.harnessConfig),
      taskFile: path.isAbsolute(config.input.taskFile)
        ? config.input.taskFile
        : path.join(projectRoot, config.input.taskFile),
      memory: path.isAbsolute(config.input.memory)
        ? config.input.memory
        : path.join(projectRoot, config.input.memory),
      rules: path.isAbsolute(config.input.rules)
        ? config.input.rules
        : path.join(projectRoot, config.input.rules),
      templates: path.isAbsolute(config.input.templates)
        ? config.input.templates
        : path.join(projectRoot, config.input.templates),
      config: {} as Record<string, string>
    },
    output: {
      directory: path.isAbsolute(config.output.directory)
        ? config.output.directory
        : path.join(projectRoot, config.output.directory),
      logs: {} as Record<string, string>,
      analysis: path.isAbsolute(config.output.analysis)
        ? config.output.analysis
        : path.join(projectRoot, config.output.analysis),
      suggestions: path.isAbsolute(config.output.suggestions)
        ? config.output.suggestions
        : path.join(projectRoot, config.output.suggestions)
    },
    harness: {
      root: path.isAbsolute(config.harness.root)
        ? config.harness.root
        : path.join(projectRoot, config.harness.root),
      hooks: path.isAbsolute(config.harness.hooks)
        ? config.harness.hooks
        : path.join(projectRoot, config.harness.hooks),
      scripts: path.isAbsolute(config.harness.scripts)
        ? config.harness.scripts
        : path.join(projectRoot, config.harness.scripts),
      utils: path.isAbsolute(config.harness.utils)
        ? config.harness.utils
        : path.join(projectRoot, config.harness.utils)
    }
  };

  // 处理 input.config
  Object.entries(config.input.config).forEach(([key, value]) => {
    resolved.input.config[key] = path.isAbsolute(value)
      ? value
      : path.join(projectRoot, value);
  });

  // 处理 output.logs
  Object.entries(config.output.logs).forEach(([key, value]) => {
    resolved.output.logs[key] = path.isAbsolute(value)
      ? value
      : path.join(projectRoot, value);
  });

  return resolved;
}

/**
 * 获取输出目录路径（确保目录存在）
 */
export function getOutputDir(projectRoot?: string): string {
  const config = loadPathsConfig(projectRoot);
  const outputDir = config.output.directory;
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

/**
 * 获取日志文件路径
 */
export function getLogPath(type: keyof PathsConfig['output']['logs'], projectRoot?: string): string {
  const config = loadPathsConfig(projectRoot);
  return config.output.logs[type] || path.join(config.output.directory, `${type}.log`);
}

/**
 * 清除配置缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
