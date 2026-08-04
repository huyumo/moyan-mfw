/**
 * @fileoverview 压测用 pm2 6 实例配置
 * @description 6 个 fork 模式实例，端口 3000-3005，NODE_ENV=production（关闭 synchronize）
 * 启动：pm2 start scripts/stress/pm2-stress.config.cjs
 * 停止：pm2 delete scheduler-stress-i1 ... 或 pm2 delete all
 */

const path = require('path')

const BASE_DIR = path.resolve(__dirname, '../../demo/backend')
const LOG_DIR = path.resolve(__dirname, 'logs')

const instances = Array.from({ length: 6 }, (_, i) => ({
  name: `scheduler-stress-i${i + 1}`,
  script: path.join(BASE_DIR, 'dist/main.js'),
  cwd: BASE_DIR,
  exec_mode: 'fork',
  instances: 1,
  autorestart: false, // 压测期间不自动重启，便于观察崩溃
  env: {
    NODE_ENV: 'production',
    PORT: String(3000 + i),
    APP_NAME: `SchedulerStress-i${i + 1}`,
    DB_POOL_SIZE: '30', // 6 实例 × 30 = 180 < max_connections(500)
  },
  out_file: path.join(LOG_DIR, `i${i + 1}.out.log`),
  error_file: path.join(LOG_DIR, `i${i + 1}.err.log`),
  merge_logs: true,
  time: true,
}))

module.exports = { apps: instances }
