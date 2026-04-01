# Moyan MFW Base Backend

墨焱管理后台基础框架 - 后端服务

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 20.x | 运行时环境 |
| NestJS | 10.x | Web 应用框架 |
| TypeORM | 0.3.x | ORM 框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 7.x | 缓存/会话存储 |
| JWT | - | Token 认证 |
| Swagger | - | API 文档 |

## 快速开始

### 1. 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MySQL 8.0+
- Redis 7.x

### 2. 安装依赖

```bash
cd packages/base-backend
pnpm install
```

### 3. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置数据库和 Redis 连接信息
```

### 4. 启动开发服务器

```bash
pnpm run start:dev
```

访问 http://localhost:3000/api-docs 查看 API 文档

### 5. 数据库迁移

```bash
# 运行迁移
pnpm run migration:run

# 回滚迁移
pnpm run migration:revert

# 查看迁移状态
pnpm run migration:show
```

## 项目结构

```
packages/base-backend/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.module.ts              # 根模块
│   │
│   ├── common/                    # 公共模块
│   │   ├── entities/              # 基础实体
│   │   ├── filters/               # 全局过滤器
│   │   ├── guards/                # 守卫
│   │   ├── interceptors/          # 拦截器
│   │   ├── decorators/            # 装饰器
│   │   ├── utils/                 # 工具函数
│   │   └── types/                 # 类型定义
│   │
│   ├── modules/                   # 业务模块
│   │   └── sys/                   # 系统模块
│   │       ├── auth/              # 认证模块
│   │       ├── user/              # 用户模块
│   │       ├── role/              # 角色模块
│   │       ├── permission/        # 权限模块
│   │       ├── app-type/          # 应用类型模块
│   │       └── audit-log/         # 审计日志模块
│   │
│   ├── config/                    # 配置文件
│   └── database/                  # 数据库相关
│       ├── migrations/            # 迁移文件
│       └── seeds/                 # 种子数据
│
├── tests/                         # 测试文件
├── docker-compose.yml             # Docker 配置
└── package.json                   # 项目配置
```

## 核心功能

### 权限管理（RBAC）

基于角色的访问控制（RBAC），支持：

- 用户 - 角色 - 权限三层模型
- 位运算权限值，支持细粒度权限控制
- 树形权限结构
- 权限缓存（Redis）

### 认证机制

- JWT Token 认证
- Token 刷新机制
- 公共接口标记

### 审计日志

- 操作审计日志
- 数据变更快照
- IP 和 User-Agent 记录

## API 使用示例

### 登录

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

### 获取用户列表

```bash
GET /api/users?page=1&pageSize=10
Authorization: Bearer <token>
```

### 创建角色

```bash
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleName": "测试角色",
  "roleCode": "test-role",
  "roleDesc": "这是一个测试角色"
}
```

## Docker 部署

### 使用 Docker Compose

```bash
# 启动所有服务（MySQL + Redis + App）
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### 生产环境构建

```bash
# 构建镜像
docker build -t moyan-mfw-backend:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=mysql-host \
  -e DB_PASSWORD=your-password \
  moyan-mfw-backend:latest
```

## 开发规范

参考 [后端规范文档](../../docs/03-框架规范/02-后端规范/)

### 代码提交

```bash
# 代码格式化
pnpm run format

# Lint 检查
pnpm run lint

# 类型检查
pnpm exec tsc --noEmit

# 运行测试
pnpm run test
```

## 测试

```bash
# 单元测试
pnpm run test

# 测试覆盖率
pnpm run test:cov

# E2E 测试
pnpm run test:e2e
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3000 |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USERNAME | 数据库用户名 | root |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名称 | moyan_mfw |
| REDIS_HOST | Redis 主机 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| JWT_SECRET | JWT 密钥 | - |

## 许可证

MIT License

---

**维护**: Moyan Team | **版本**: 1.0.0
