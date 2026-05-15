/**
 * @fileoverview 数据库配置
 * @description TypeORM 数据库连接配置
 */
declare const _default: () => {
    /**
     * 数据库类型
     * @type {string}
     */
    type: string;
    /**
     * 数据库主机
     * @type {string}
     * @default 'localhost'
     */
    host: string;
    /**
     * 数据库端口
     * @type {number}
     * @default 3306
     */
    port: number;
    /**
     * 数据库用户名
     * @type {string}
     */
    username: string;
    /**
     * 数据库密码
     * @type {string}
     */
    password: string;
    /**
     * 数据库名称
     * @type {string}
     */
    database: string;
    /**
     * 字符集
     * @type {string}
     */
    charset: string;
    /**
     * 时区
     * @type {string}
     */
    timezone: string;
    /**
     * 连接池大小
     * @type {number}
     * @default 100
     */
    poolSize: number;
    /**
     * 连接超时时间（毫秒）
     * @type {number}
     * @default 60000
     */
    connectTimeout: number;
    /**
     * 是否开启 SQL 日志
     * @type {boolean}
     */
    logging: string[];
    /**
     * 记录 SQL 日志到 console
     * @type {string}
     */
    logger: string;
    /**
     * 同步数据库（生产环境应关闭）
     * @type {boolean}
     * @default false
     */
    synchronize: boolean;
    /**
     * 实体路径
     * @type {string[]}
     */
    entities: string[];
    /**
     * 迁移文件路径
     * @type {string[]}
     */
    migrations: string[];
    /**
     * 额外配置
     */
    extra: {
        enableKeepAlive: boolean;
        keepAliveInitialDelay: number;
        supportBigNumbers: boolean;
        bigNumberStrings: boolean;
        timezone: string;
    };
};
export default _default;
