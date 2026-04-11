/**
 * 身份报告 Hook
 *
 * 目的：确保每次会话开始时，向用户报告当前 Agent 身份和开发模式
 *
 * 检查项：
 * 1. team.json 配置是否存在
 * 2. 技术负责人 Agent 身份确认
 * 3. 开发模式状态报告
 * 4. 团队成员列表输出
 * 5. 用户角色说明（用户不是技术负责人）
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    currentIdentity: string;
    developmentMode: string;
    teamMembers: Array<{ name: string; role: string; active: boolean }>;
    autonomousMode: boolean;
    strictMode: boolean;
  };
}

/**
 * 向上查找项目根目录（查找 .claude/harness/team.json 或 TASK.md）
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    // 优先查找 .claude/harness/team.json
    const harnessTeamConfig = path.join(currentDir, '.claude', 'harness', 'team.json');
    if (fs.existsSync(harnessTeamConfig)) {
      return currentDir;
    }
    // 兼容查找 TASK.md
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

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: [],
    data: {
      currentIdentity: '未知',
      developmentMode: '未知',
      teamMembers: [],
      autonomousMode: false,
      strictMode: false
    }
  };

  const projectRoot = findProjectRoot();
  const teamConfigPath = path.join(projectRoot, '.claude', 'harness', 'team.json');
  const configPath = path.join(projectRoot, '.claude', 'harness', 'config.json');

  // 检查 1: team.json 是否存在
  if (!fs.existsSync(teamConfigPath)) {
    result.passed = false;
    result.errors.push('team.json 配置文件不存在');
    result.message = '【阻塞】team.json 配置文件不存在，无法确定身份和模式';
    return result;
  }

  // 读取团队配置
  let teamConfig: Record<string, any>;
  try {
    teamConfig = JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));
  } catch (error) {
    result.passed = false;
    result.errors.push(`team.json 解析失败：${error}`);
    result.message = '【阻塞】team.json 格式错误';
    return result;
  }

  // 检查 2: 确定当前身份（报告 Agent 身份，不是用户身份）
  const currentUser = teamConfig?.currentUser || '未指定';
  const userRole = teamConfig?.userRole || { name: '用户', description: '项目所有者' };

  // 查找技术负责人 Agent（lead 角色的成员）
  const techLeadMember = teamConfig?.team?.members?.find((m: any) => m.role === 'lead');
  const techLeadIdentity = techLeadMember
    ? `${techLeadMember.name} (${techLeadMember.role})`
    : '未配置';

  // 当前身份 = 技术负责人 Agent 的身份
  const currentIdentity = techLeadIdentity;

  // 检查 3: 确定开发模式
  const autonomousModeEnabled = teamConfig?.autonomousMode?.enabled === true;
  const teamModeEnabled = teamConfig?.teamMode?.enabled === true;

  let developmentMode = '未知';
  if (autonomousModeEnabled) {
    developmentMode = '自主模式 (Autonomous Mode)';
  } else if (teamModeEnabled) {
    developmentMode = '团队协作模式 (Team Mode)';
  } else {
    developmentMode = '独立模式 (Solo Mode)';
  }

  // 读取 config.json 获取严格模式状态
  let strictMode = false;
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      // 支持两种命名：strict-mode 或 strictMode
      strictMode = config?.enforcement?.['strict-mode'] === true || config?.enforcement?.strictMode === true;
    } catch (e) {
      // 忽略 config.json 读取错误
    }
  }

  // 构建团队成员列表
  const teamMembers = (teamConfig?.team?.members || []).map((m: any) => ({
    name: m.name,
    role: m.role,
    active: m.active !== false
  }));

  // 生成报告消息
  const modeIcon = autonomousModeEnabled ? '🤖' : teamModeEnabled ? '👥' : '🧑‍💻';
  const strictIcon = strictMode ? '✅' : '⚪';

  result.data = {
    currentIdentity: currentIdentity,
    developmentMode: developmentMode,
    teamMembers: teamMembers,
    autonomousMode: autonomousModeEnabled,
    strictMode: strictMode
  };

  result.message = `${modeIcon}【${currentIdentity} | ${developmentMode}】\n` +
    `严格模式：${strictIcon}\n` +
    `团队成员：${teamMembers.filter((m: any) => m.active).map((m: any) => m.name).join(', ')}\n` +
    `用户角色：${userRole.name}（${userRole.description}）`;

  // 输出日志
  const logFile = path.join(projectRoot, '.harness', 'output', 'identity-greeting.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);

  return result;
}

// CLI 入口
const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(JSON.stringify({
        passed: false,
        message: `钩子执行失败：${error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}
