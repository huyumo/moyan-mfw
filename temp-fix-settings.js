const fs = require('fs');
const path = require('path');

const settingsPath = path.join('.claude', 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

// 修改 task-archive hook
settings.hooks.PostToolUse[1].hooks[1] = {
  type: 'command',
  command: 'cd .harness && npx tsx hooks/task-archive-hook.ts {{filePath}}',
  timeout: 30,
  statusMessage: '📋 检查任务归档...'
};

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
console.log('✅ 已更新 task-archive hook 配置');
