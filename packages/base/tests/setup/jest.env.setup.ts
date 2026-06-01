/**
 * @fileoverview Jest 环境变量设置
 * @description 在模块加载前设置环境变量（被 setupFiles 引用）
 */

// 设置全局环境变量（在任何其他模块加载之前）
process.env.NODE_ENV = 'test';

import { config } from 'dotenv';
import * as path from 'path';

const rootDir = process.cwd();
config({ path: path.join(rootDir, '.env.test'), override: true });
