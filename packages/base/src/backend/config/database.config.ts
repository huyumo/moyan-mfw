/**
 * @fileoverview 数据库配置
 * @description TypeORM 数据库连接配置
 */

export default () => ({
  /**
   * 数据库类型
   * @type {string}
   */
  type: 'mysql',

  /**
   * 数据库主机
   * @type {string}
   * @default 'localhost'
   */
  host: process.env.DB_HOST || 'localhost',

  /**
   * 数据库端口
   * @type {number}
   * @default 3306
   */
  port: parseInt(process.env.DB_PORT || '3306', 10),

  /**
   * 数据库用户名
   * @type {string}
   */
  username: process.env.DB_USERNAME || 'moyan_mfw',

  /**
   * 数据库密码
   * @type {string}
   */
  password: process.env.DB_PASSWORD || '',

  /**
   * 数据库名称
   * @type {string}
   */
  database: process.env.DB_NAME || 'moyan_mfw',

  /**
   * 字符集
   * @type {string}
   */
  charset: 'utf8mb4',

  /**
   * 时区
   * @type {string}
   */
  timezone: '+08:00',

  /**
   * 连接池大小
   * @type {number}
   * @default 100
   */
  poolSize: parseInt(process.env.DB_POOL_SIZE || '100', 10),

  /**
   * 连接超时时间（毫秒）
   * @type {number}
   * @default 60000
   */
  connectTimeout: 60000,

  /**
   * 是否开启 SQL 日志
   * @type {boolean}
   */
  logging: ['error'],

  /**
   * 记录 SQL 日志到 console
   * @type {string}
   */
  logger: 'advanced-console',

  /**
   * 同步数据库（生产环境应关闭）
   * @type {boolean}
   * @default false
   */
  synchronize: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',

  /**
   * 实体路径
   * @type {string[]}
   */
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  /**
   * 迁移文件路径
   * @type {string[]}
   */
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  /**
   * 额外配置
   */
  extra: {
    // 连接池心跳
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000, // 30 秒
    // 支持大数字
    supportBigNumbers: true,
    bigNumberStrings: false,
    // 时区配置
    timezone: 'Z',
  },
});
