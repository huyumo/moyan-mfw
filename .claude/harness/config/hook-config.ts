/**
 * Hook 配置中心
 *
 * 集中管理所有 Hook 的可配置参数
 */

export interface HookConfig {
  agentParticipation: {
    minWordCount: number;        // 每个 Agent 最小字数
    minFileCount: number;        // 每个 Agent 最小文件数
    minSubstantiveLines: number; // 最小实质性内容行数
  };
  taskComplexity: {
    minPendingTasks: number;     // 视为复杂任务的最小待办数
    minDomains: number;          // 视为复杂任务的最小领域数
  };
  timestamp: {
    allowedDelayMinutes: number; // 允许的时间延迟（分钟）
  };
  meetingNotes: {
    minRequiredFields: number;   // 会议纪要最小必要字段数
  };
}

export const DEFAULT_HOOK_CONFIG: HookConfig = {
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

/**
 * 从 config.json 加载配置（如果存在）
 */
export function loadHookConfig(): HookConfig {
  try {
    const configPath = require.resolve('./config.json');
    const config = require(configPath);

    // 合并默认配置和用户配置
    return {
      ...DEFAULT_HOOK_CONFIG,
      ...(config.hookConfig || {})
    };
  } catch {
    // config.json 不存在或没有 hookConfig，返回默认配置
    return DEFAULT_HOOK_CONFIG;
  }
}

// 导出当前配置（单例）
export const HOOK_CONFIG = loadHookConfig();
