# 种子数据说明

## 概述

种子数据用于初始化系统基础数据，包括应用类型、权限、角色和初始管理员账号。

## 默认账号

执行种子数据后，将创建以下默认账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `admin` | `Admin@123` | 超级管理员 | 拥有所有权限 |
| `test` | `Test@123` | 普通用户 | 仅拥有查看权限 |

## 执行方式

### 方式一：使用 npm 脚本（推荐）

```bash
# 进入项目目录
cd packages/base-backend

# 执行种子数据
pnpm seed:run
```

### 方式二：使用 ts-node 直接执行

```bash
# 进入项目目录
cd packages/base-backend

# 执行种子数据
npx ts-node -r tsconfig-paths/register src/database/run-seeds.ts
```

## 初始化数据内容

### 1. 应用类型（2 个）

| 类型名称 | 类型编码 | 说明 |
|----------|----------|------|
| 管理后台 | admin | 企业内部管理后台系统 |
| 用户端 | user | 面向用户的 C 端系统 |

### 2. 权限（25 个）

#### 系统管理根节点
- `system` - 系统管理（根节点）

#### 用户管理
- `system:user` - 用户管理（菜单）
- `system:user:add` - 用户新增（按钮，permissionValue: 1）
- `system:user:edit` - 用户编辑（按钮，permissionValue: 2）
- `system:user:delete` - 用户删除（按钮，permissionValue: 4）
- `system:user:view` - 用户查看（按钮，permissionValue: 32）

#### 角色管理
- `system:role` - 角色管理（菜单）
- `system:role:add` - 角色新增（按钮，permissionValue: 1）
- `system:role:edit` - 角色编辑（按钮，permissionValue: 2）
- `system:role:delete` - 角色删除（按钮，permissionValue: 4）
- `system:role:view` - 角色查看（按钮，permissionValue: 32）
- `system:role:assign` - 分配权限（按钮，permissionValue: 16）

#### 权限管理
- `system:permission` - 权限管理（菜单）
- `system:permission:add` - 权限新增（按钮，permissionValue: 1）
- `system:permission:edit` - 权限编辑（按钮，permissionValue: 2）
- `system:permission:delete` - 权限删除（按钮，permissionValue: 4）
- `system:permission:view` - 权限查看（按钮，permissionValue: 32）

#### 应用类型管理
- `system:app-type` - 应用类型管理（菜单）
- `system:app-type:add` - 应用类型新增（按钮，permissionValue: 1）
- `system:app-type:edit` - 应用类型编辑（按钮，permissionValue: 2）
- `system:app-type:delete` - 应用类型删除（按钮，permissionValue: 4）
- `system:app-type:view` - 应用类型查看（按钮，permissionValue: 32）

#### 审计日志管理
- `system:audit-log` - 审计日志管理（菜单）
- `system:audit-log:view` - 审计日志查看（按钮，permissionValue: 32）
- `system:audit-log:delete` - 审计日志删除（按钮，permissionValue: 4）

### 3. 角色（3 个）

| 角色名称 | 角色编码 | 说明 | 权限范围 |
|----------|----------|------|----------|
| 超级管理员 | super_admin | 系统超级管理员 | 所有权限 |
| 管理员 | admin | 系统管理员 | 除审计日志删除外的所有权限 |
| 普通用户 | user | 普通用户 | 仅查看权限 |

### 4. 用户（2 个）

| 用户名 | 昵称 | 绑定角色 |
|--------|------|----------|
| admin | 超级管理员 | 超级管理员 |
| test | 测试用户 | 普通用户 |

## 权限值说明

权限值采用位运算（bitwise）方式存储，便于细粒度权限控制：

| 操作 | 权限值 | 二进制 |
|------|--------|--------|
| ADD（新增） | 1 | 2^0 |
| EDIT（编辑） | 2 | 2^1 |
| DELETE（删除） | 4 | 2^2 |
| ASSIGN（分配） | 16 | 2^4 |
| VIEW（查看） | 32 | 2^5 |

## 执行输出示例

```
🚀 开始执行种子数据...

✅ 数据库连接成功

  📦 初始化应用类型...
    ✓ 创建应用类型：管理后台
    ✓ 创建应用类型：用户端
  🔐 初始化权限...
    ✓ 创建根权限：系统管理
    ✓ 创建权限：用户管理
    ✓ 创建权限：用户新增
    ...
  👥 初始化角色...
    ✓ 创建角色：超级管理员
    ✓ 创建角色：管理员
    ✓ 创建角色：普通用户
  👤 初始化管理员账号...
    ✓ 创建用户：admin (密码：Admin@123)
    ✓ 创建用户：test (密码：Test@123)
  🔗 绑定角色权限...
    ✓ 超级管理员绑定 25 个权限
    ✓ 管理员绑定 24 个权限
    ✓ 普通用户绑定 5 个查看权限
  🔗 绑定用户角色...
    ✓ 用户 admin 绑定角色：超级管理员
    ✓ 用户 test 绑定角色：普通用户

✅ 种子数据执行完成！

═══════════════════════════════════════
默认账号：
  超级管理员：admin / Admin@123
  测试用户：test / Test@123
═══════════════════════════════════════
```

## 注意事项

1. **幂等性**：种子数据脚本具有幂等性，重复执行不会创建重复数据
2. **密码安全**：生产环境请修改默认密码
3. **执行时机**：在数据库迁移完成后执行
4. **环境要求**：需要 Node.js 20+ 和已配置的 MySQL 数据库

## 扩展种子数据

如需添加其他种子数据，可编辑 `src/database/seeds/index.ts` 文件，参照现有格式添加：

```typescript
async function seedYourData(dataSource: DataSource): Promise<void> {
  console.log('  🆕 初始化 XXX...');

  const data = [
    // ... 数据
  ];

  for (const item of data) {
    const exists = await dataSource.manager.findOne(YourEntity, { where: { code: item.code } });
    if (!exists) {
      await dataSource.manager.save(YourEntity, { ...item, createdAt: new Date() });
      console.log(`    ✓ 创建：${item.name}`);
    }
  }
}
```

然后在 `runSeeds` 函数中调用：

```typescript
export async function runSeeds(dataSource: DataSource): Promise<void> {
  // ... 现有代码

  await seedYourData(dataSource);

  console.log('✅ 种子数据执行完成！');
}
```
