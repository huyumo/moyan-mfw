/**
 * Hook 配置常量
 *
 * 从 config.json 加载或使用默认值
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookConfig {
  agentParticipation: {
    minWordCount: number;
    minFileCount: number;
    minSubstantiveLines: number;
  };
  taskComplexity: {
    minPendingTasks: number;
    minDomains: number;
  };
  timestamp: {
    allowedDelayMinutes: number;
  };
  meetingNotes: {
    minRequiredFields: number;
  };
}

const DEFAULT_CONFIG: HookConfig = {
  agentParticipation: {
    minWordCount: 100,
    minFileCount: 1,
    minSubstantiveLines: 3
  },
  taskComplexity: {
    minPendingTasks: 5,
    minDomains: 2
  },
  timestamp: {
    allowedDelayMinutes: 30
  },
  meetingNotes: {
    minRequiredFields: 2
  }
};

let cachedConfig: HookConfig | null = null;

/**
 * 加载 Hook 配置
 */
function loadHookConfig(): HookConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 查找项目根目录
  let projectRoot = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    const configPath = path.join(projectRoot, '.harness', 'config.json');
    if (fs.existsSync(configPath)) {
      break;
    }
    const parentDir = path.dirname(projectRoot);
    if (parentDir === projectRoot) {
      break;
    }
    projectRoot = parentDir;
    depth++;
  }

  const configPath = path.join(projectRoot, '.harness', 'config.json');

  if (!fs.existsSync(configPath)) {
    cachedConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const hookConfig = config?.hookConfig || {};

    cachedConfig = {
      agentParticipation: {
        minWordCount: hookConfig?.agentParticipation?.minWordCount ?? DEFAULT_CONFIG.agentParticipation.minWordCount,
        minFileCount: hookConfig?.agentParticipation?.minFileCount ?? DEFAULT_CONFIG.agentParticipation.minFileCount,
        minSubstantiveLines: hookConfig?.agentParticipation?.minSubstantiveLines ?? DEFAULT_CONFIG.agentParticipation.minSubstantiveLines
      },
      taskComplexity: {
        minPendingTasks: hookConfig?.taskComplexity?.minPendingTasks ?? DEFAULT_CONFIG.taskComplexity.minPendingTasks,
        minDomains: hookConfig?.taskComplexity?.minDomains ?? DEFAULT_CONFIG.taskComplexity.minDomains
      },
      timestamp: {
        allowedDelayMinutes: hookConfig?.timestamp?.allowedDelayMinutes ?? DEFAULT_CONFIG.timestamp.allowedDelayMinutes
      },
      meetingNotes: {
        minRequiredFields: hookConfig?.meetingNotes?.minRequiredFields ?? DEFAULT_CONFIG.meetingNotes.minRequiredFields
      }
    };

    return cachedConfig;
  } catch (error) {
    console.warn(`加载 hook-config.json 失败，使用默认值：${error}`);
    cachedConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }
}

/**
 * 导出配置常量
 */
export const HOOK_CONFIG: HookConfig = loadHookConfig();

/**
 * 清除配置缓存（用于测试）
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
