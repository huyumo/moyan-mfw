/**
 * @fileoverview Jest 全局设置文件
 * @description 配置测试环境的全局变量和超时设置
 */

// 设置全局超时为 30 秒
jest.setTimeout(30000);

// 验证关键环境变量
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
