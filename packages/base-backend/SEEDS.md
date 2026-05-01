# 种子数据说明

## 概述

种子数据用于初始化系统基础数据，包括应用类型、权限、角色和初始管理员账号。

## 默认账号

执行种子数据后，将创建以下默认账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `admin` | `Admin@123` | 超级管理员 | 拥有所有权限 |

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

### 1. 应用类型（1 个）

| 类型名称 | 类型编码 | 说明 |
|----------|----------|------|
| 系统管理 | system | 系统内置应用类型，用于系统管理功能 |

### 2. 权限

#### PC 端根节点
- `pc_root` - PC 端权限根节点

#### 首页
- `pc_root:dashboard` - 首页

#### 系统管理模块
- `pc_root:sys` - 系统管理（模块节点）

#### 用户管理
- `pc_root:sys:user` - 用户管理（页面，含添加/编辑/删除权限）

#### 角色管理
- `pc_root:sys:role` - 角色管理（页面，含添加/编辑/删除权限）

#### 权限管理
- `pc_root:sys:permission` - 权限管理（页面，含添加/编辑/删除权限）
- `pc_root:sys:permission-pc` - PC 权限管理（页面，含添加/编辑/删除权限）

#### 应用管理
- `pc_root:sys:app` - 应用管理（页面，含添加/编辑/删除权限）

#### 应用类型管理
- `pc_root:sys:app-type` - 应用类型管理（页面，含编辑权限）

#### 成员管理
- `pc_root:sys:member` - 成员管理（页面，含添加/编辑/删除权限）

#### 审计日志管理
- `pc_root:sys:audit-log` - 审计日志管理（页面，只读）

#### 文件上传
- `pc_root:sys:upload` - 文件上传（页面，含添加/删除权限）

#### 普通权限根节点
- `normal_root` - 普通端权限根节点

### 3. 角色（1 个）

| 角色名称 | 角色编码 | 说明 | 权限范围 |
|----------|----------|------|----------|
| 超级管理员 | super_admin | 系统超级管理员 | 所有权限 |

### 4. 用户（1 个）

| 用户名 | 昵称 | 绑定角色 |
|--------|------|----------|
| admin | 超级管理员 | 超级管理员 |

## 权限值说明

权限值采用位运算（bitwise）方式存储，便于细粒度权限控制：

### 默认权限值（DEFAULT_PERMISSION_VALUES）

| 操作 | 权限值 | 二进制 |
|------|--------|--------|
| 添加 | 1 | 2^0 |
| 编辑 | 2 | 2^1 |
| 删除 | 4 | 2^2 |
| 导出 | 8 | 2^3 |
| 导入 | 16 | 2^4 |

### 扩展权限值（EXTENSION_PERMISSION_VALUES）

| 操作 | 权限值 | 二进制 |
|------|--------|--------|
| 审批 | 32 | 2^5 |
| 拒绝 | 64 | 2^6 |
| 发布 | 128 | 2^7 |
| 归档 | 256 | 2^8 |

## 执行输出示例

```
🌱 开始执行种子数据...
  📦 初始化应用类型...    ✓ 创建应用类型：系统管理 (typeCode: system)
  👤 初始化管理员账号...    ✓ 创建用户：admin (密码：Admin@123)
  🔐 初始化权限...    ✓ 创建 PC 权限根节点：PC 权限根节点 (ID: xxx)
    ✓ 创建普通权限根节点：普通权限根节点 (ID: xxx)
    ✓ 创建 PC 权限子节点：首页
    ✓ 创建 PC 权限子节点：系统管理
    ✓ 创建 PC 权限子节点：用户管理
    ✓ 创建 PC 权限子节点：角色管理
    ✓ 创建 PC 权限子节点：应用管理
    ✓ 创建 PC 权限子节点：应用类型管理
    ✓ 创建 PC 权限子节点：成员管理
    ✓ 创建 PC 权限子节点：权限管理
    ✓ 创建 PC 权限子节点：PC 权限管理
    ✓ 创建 PC 权限子节点：审计日志
    ✓ 创建 PC 权限子节点：文件上传
  📊 权限初始化完成：    - PC 权限根节点 ID: xxx
    - 普通权限根节点 ID: xxx
  👥 初始化角色...    ✓ 创建角色：超级管理员 (ID: a2b83a1e-b1b9-4a19-b587-2f110ee56ae9)
  📱 初始化应用实例...    ✓ 创建应用实例：系统管理后台 (appCode: system-instance)
  🔒 配置权限池...    ✓ 配置 13 个权限到权限池（新增 13 个）
  🔗 绑定角色权限...    ✓ 超级管理员绑定 13 个权限
  🔗 绑定拥有者...    ✓ 绑定 admin 用户为 系统管理后台 的拥有者
    ✓ 绑定 admin 用户为超级管理员角色

✅ 种子数据执行完成！
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
  process.stdout.write('  🆕 初始化 XXX...');

  const data = [
    // ... 数据
  ];

  for (const item of data) {
    const exists = await dataSource.manager.findOne(YourEntity, { where: { code: item.code } });
    if (!exists) {
      await dataSource.manager.save(YourEntity, { ...item, createdAt: new Date() });
      process.stdout.write(`    ✓ 创建：${item.name}`);
    }
  }
}
```

然后在 `runSeeds` 函数中调用：

```typescript
export async function runSeeds(dataSource: DataSource, adminPassword?: string): Promise<void> {
  // ... 现有代码

  await seedYourData(dataSource);

  process.stdout.write('\n✅ 种子数据执行完成！\n');
}
```
