# 反模式清单

> 本文档基于项目 [红线规则](../../../.trae/rules/redline.md) 和编码规范，列出扩展开发中**禁止使用的模式**及其正确做法。每条反模式均提供错误示例、正确示例和实际代码参考。

---

## 目录

- [反模式总览](#反模式总览)
- [1. 手动修改 apis 目录代码](#1-手动修改-apis-目录代码)
- [2. Vue 组件放 views/ 内](#2-vue-组件放-views-内)
- [3. 内联 STATUS 常量定义](#3-内联-status-常量定义)
- [4. 使用 @Request()/@Response() 装饰器](#4-使用-requestresponse-装饰器)
- [5. 删除接口缺少 ElMessageBox.confirm](#5-删除接口缺少-elmessageboxconfirm)
- [6. 硬编码密钥/敏感信息到代码](#6-硬编码密钥敏感信息到代码)
- [7. 表单 emit('confirm') 应使用 defineExpose({ onConfirm })](#7-表单-emitconfirm-应使用-exposeonconfirm)
- [8. 使用 createQueryRunner() + try/catch](#8-使用-createqueryrunner-trycatch)
- [9. 手动 repository.find() 分页](#9-手动-repositoryfind-分页)
- [10. TypeScript 类型错误](#10-typescript-类型错误)
- [自检清单](#自检清单)

---

## 反模式总览

| # | 反模式 | 严重程度 | 触发规则 |
|---|--------|----------|----------|
| 1 | 手动修改 apis 目录代码 | 🔴 严重 | 红线规则 #2 |
| 2 | Vue 组件放 views/ 内 | 🔴 严重 | ESLint 自定义规则 / guide.md |
| 3 | 内联 STATUS 常量定义 | 🟡 中等 | guide.md 反模式 |
| 4 | 使用 @Request()/@Response() 装饰器 | 🔴 严重 | ESLint 自定义规则 |
| 5 | 删除接口缺少确认框 | 🟡 中等 | guide.md 反模式 |
| 6 | 硬编码敏感信息 | 🔴 严重 | 安全红线 |
| 7 | 表单 emit('confirm') | 🟡 中等 | guide.md 反模式 |
| 8 | createQueryRunner + try/catch | 🟡 中等 | guide.md 反模式 |
| 9 | 手动分页实现 | 🟡 中等 | guide.md 反模式 |
| 10 | TypeScript 类型错误 | 🔴 严重 | 红线规则 #3 |

---

## 1. 手动修改 apis 目录代码

### ❌ 错误做法

```typescript
// src/frontend/src/apis/ad/index.ts（自动生成文件）
// 禁止手动编辑此文件！

export class ApiAdPlacementFindAll {
  // 开发者手动添加了自定义方法...
  async customMethod() {
    // 这会在下次重新生成时被覆盖！
  }
}
```

### ✅ 正确做法

```typescript
// 如需自定义 API 封装，在单独的工具文件中创建
// src/frontend/src/utils/ad-api-helper.ts

import { ApiAdPlacementFindAll } from '../apis/ad'

export class AdApiHelper {
  static async findWithCache(params: Record<string, unknown>) {
    const api = new ApiAdPlacementFindAll({ query: params })
    // 自定义缓存逻辑...
    return await api.request()
  }
}
```

### 规则说明

> **红线规则 #2**：禁止手动编写或改动 `apis` 目录下的任何文件。`apis` 目录存放的是由 `moyan-api` 包自动生成的 API 代码，任何手动修改都会被后续生成覆盖。

### 重新生成流程

```bash
# 1. 确保后端 dev server 运行中
pnpm dev:backend

# 2. 执行 API 生成
node api.build.cjs

# 或者使用 npm script（如果配置了）
pnpm generate:api
```

### 实际配置文件（[api.build.cjs](../../../packages/extensions/extension-ad/src/frontend/api.build.cjs)）

```javascript
const ApisdkCreator = require('moyan-api/dist/main.js').ApisdkCreator
const Program = require('moyan-api/dist/program.js').Program

const configs = [
  {
    jsonurl: 'http://localhost:3000/api-docs/ad-extension-json',
    output: './src/apis',    // ← 生成到此目录
    dirname: 'ad',
  },
]

const create = async () => {
  for (let i = 0; i < configs.length; i++) {
    await new ApisdkCreator(new Program(configs[i])).create()
  }
}

create()
```

---

## 2. Vue 组件放 views/ 内

### ❌ 错误做法

```
src/frontend/src/views/
├── placement/
│   ├── Index.vue           # 页面组件 ✅ 正确
│   ├── index.ts            # 页面配置 ✅ 正确
│   └── PlacementCard.vue   # ❌ 可复用组件不应放在这里！
└── content/
    ├── Index.vue
    └── ContentForm.vue     # ❌ 表单组件应放 components/
```

### ✅ 正确做法

```
src/frontend/src/
├── views/                  # 仅存放页面级组件（路由组件）
│   ├── placement/
│   │   ├── Index.vue       # 页面主组件
│   │   └── index.ts        # definePageConfig 配置
│   └── content/
│       ├── Index.vue
│       └── index.ts
│
└── components/             # 存放可复用组件
    ├── placement-card/     # Mfw 命名前缀
    │   └── Index.vue       # MfwPlacementCard
    ├── content-form/
    │   └── Index.vue       # MfwContentForm
    └── ad-card/
        └── Index.vue       # MfwAdCard
```

### 实际代码参考（[extension-ad](../../../packages/extensions/extension-ad/src/frontend/)）

正确的目录结构：

```
components/
├── ad-card/
│   └── Index.vue          # MfwAdCard
├── ad-form/
│   └── Index.vue          # MfwAdForm
├── ad-placement-card/
│   └── Index.vue          # MfwAdPlacementCard
├── ad-placement-detail/
│   └── Index.vue          # MfwAdPlacementDetail
└── ad-placement-form/
    └── Index.vue          # MfwAdPlacementForm
```

组件命名必须使用 `Mfw` 前缀：

```vue
<!-- components/ad-card/Index.vue -->
<script setup lang="ts">
defineOptions({ name: 'MfwAdCard' })  // ✅ 必须使用 Mfw 前缀
</script>
```

### 判断标准

| 特征 | views/ | components/ |
|------|--------|-------------|
| 是否有路由？ | ✅ 是 | ❌ 否 |
| 是否可复用？ | ❌ 否 | ✅ 是 |
| 命名前缀？ | 无要求 | **必须 `Mfw` 前缀** |
| 配置文件？ | 需要 `index.ts` | 不需要 |

---

## 3. 内联 STATUS 常量定义

### ❌ 错误做法

```vue
<template>
  <el-select v-model="form.status" placeholder="请选择状态">
    <el-option label="启用" :value="1" />
    <el-option label="禁用" :value="0" />
  </el-select>
</template>

<script setup lang="ts">
// ❌ 内联常量定义 - 禁止！
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
}
</script>
```

### ✅ 正确做法

#### 方式一：使用 StatusDict（推荐）

```vue
<template>
  <el-select v-model="form.status" placeholder="请选择状态">
    <el-option
      v-for="item in statusOptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { StatusDict, toItems } from 'moyan-mfw-base/shared'

const statusOptions = toItems(StatusDict)

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
</script>
```

#### 方式二：使用 Shared 层字典（业务自定义状态）

```typescript
// src/shared/src/dict.ts
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'ad_status', label: '广告状态', module: '广告管理' })
export class AdStatusDict {
  @DictEntry({ label: '启用', type: 'success' })  static ENABLED = 1
  @DictEntry({ label: '禁用', type: 'danger' })   static DISABLED = 0
  @DictEntry({ label: '审核中', type: 'warning' }) static PENDING = 2
}
```

```vue
<template>
  <MfwDictFormat :value="ad.status" :dict="toItems(AdStatusDict)" as-tag />
</template>

<script setup lang="ts">
import { AdStatusDict } from 'moyan-mfw-extension-ad/shared'
import { toItems } from 'moyan-mfw-base/shared'
</script>
```

### 实际代码参考（[placement/Index.vue](../../../packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue)）

```typescript
// ✅ 正确：从 moyan-mfw-base/shared 导入 StatusDict
import { StatusDict } from 'moyan-mfw-base/shared'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
```

### 为什么禁止内联？

1. **维护成本高**：状态值变更时需要修改多处
2. **类型不安全**：无法利用 TypeScript 类型检查
3. **违反 DRY**：相同的状态定义分散在各组件中
4. **框架一致性**：MFW 提供统一的字典系统，应充分利用

---

## 4. 使用 @Request()/@Response() 装饰器

### ❌ 错误做法

```typescript
@Controller('users')
export class UserController {
  // ❌ 禁止使用 @Req() / @Request()
  @Get('profile')
  getProfile(@Req() req: Request) {
    const userId = req.user?.id  // 手动解析用户信息
    return this.service.findById(userId)
  }

  // ❌ 禁止使用 @Res() / @Response()
  @Post()
  create(@Res() res: Response, @Body() dto: CreateUserDto) {
    const user = await this.service.create(dto)
    res.status(201).json(user)  // 手动控制响应
  }
}
```

### ✅ 正确做法

```typescript
import { User } from 'moyan-mfw-base/backend'  // 或具体类型

@Controller('users')
export class UserController {
  // ✅ 使用 @User() 装饰器获取当前用户
  @Get('profile')
  getProfile(@User() user: User) {
    return this.service.findById(user.id)
  }

  // ✅ 返回值由框架统一处理
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@User() user: User, @Body() dto: CreateUserDto) {
    const result = await this.service.create(dto, user.id)
    return ApiResponseUtil.success(result, '创建成功')
  }
}
```

### 实际代码参考（[ad.controller.ts](../../../packages/extensions/extension-ad/src/backend/src/controller/ad.controller.ts)）

```typescript
// ✅ 正确：未使用 @Req/@Res，参数通过 Pipe 注入
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: '删除广告内容' })
@ApiParam({ name: 'id', description: '广告 ID' })
@RequirePermission({ permCode: '*:ext:ad:*', permissionValue: ['删除'] })
async delete(@Param('id', ParseUUIDPipe) id: string) {
  await this.service.delete(id)
  return ApiResponseUtil.success(null, '删除成功')
}
```

### 规则来源

ESLint 自定义规则 `moyan/comment-compliance`：
> Controllers cannot use `@Req/@Res/@Request/@Response` decorators

### 设计原因

1. **安全性**：避免直接访问底层请求对象，减少安全漏洞风险
2. **可测试性**：无需 Mock Request/Response 对象
3. **一致性**：统一响应格式（ApiResponseUtil）
4. **关注点分离**：Controller 只负责参数解析和调用 Service

---

## 5. 删除接口缺少 ElMessageBox.confirm

### ❌ 错误做法

```vue
<script setup lang="ts">
const handleDelete = async (row: any) => {
  // ❌ 缺少确认框，直接删除！
  await new ApiAdPlacementDelete({ params: { id: row.id } })
  cardListPage.value?.refresh()
}

// 或仅有简单 confirm，但 API 调用缺少 hintSuccess
const handleDelete2 = async (row: any) => {
  await ElMessageBox.confirm('确定删除吗？', '提示')
  // ❌ 缺少 { hintSuccess: true }
  await new ApiAdPlacementDelete({ params: { id: row.id } })
}
</script>
```

### ✅ 正确做法

```vue
<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

const handleDelete = async (row: any) => {
  try {
    // ✅ 1. 二次确认对话框
    await ElMessageBox.confirm(
      `确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`,
      '确认删除',
      { type: 'warning' }  // 警告类型图标
    )
  } catch {
    return  // 用户取消
  }

  // ✅ 2. 传入 hintSuccess: true 显示成功提示
  await new ApiAdPlacementDelete(
    { params: { id: row.id } },
    { hintSuccess: true }
  )

  // ✅ 3. 刷新列表
  cardListPage.value?.refresh()
}
</script>
```

### 实际代码参考（[placement/Index.vue](../../../packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue#L118-L124)）

```typescript
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  cardListPage.value?.refresh()
}
```

### 三要素检查清单

删除操作必须包含：

- [ ] **ElMessageBox.confirm**：二次确认（防止误操作）
- [ ] **明确的提示文案**：告知用户操作后果（如级联删除）
- [ ] **{ hintSuccess: true }**：API 调用时显示成功提示

---

## 6. 硬编码密钥/敏感信息到代码

### ❌ 错误做法

```typescript
// ❌ 数据库密码硬编码
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'P@ssw0rd123',  // 敏感信息！
  database: 'mfw_ad',
}

// ❌ JWT Secret 硬编码
const JWT_SECRET = 'my-super-secret-key-2024'  // 敏感信息！

// ❌ 第三方 API Key 硬编码
const ALIYUN_ACCESS_KEY = 'LTAI5t...'  // 敏感信息！

// ❌ 配置文件中明文存储
// .env (提交到版本控制)
// SECRET_KEY=abc123def456
```

### ✅ 正确做法

#### 方式一：环境变量（推荐）

```typescript
// .env.local（不入库，加入 .gitignore）
DB_PASSWORD=xxx
JWT_SECRET=xxx
ALIYUN_ACCESS_KEY=xxx

// 代码中使用
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {}

  getDbPassword() {
    return this.configService.get<string>('DB_PASSWORD')
  }
}
```

#### 方式二：密钥管理服务

```typescript
// 生产环境使用 AWS Secrets Manager / HashiCorp Vault 等
import { SecretsManager } from '@aws-sdk/client-secrets-manager'

const secretsClient = new SecretsManager({ region: 'cn-north-1' })

async function getSecret(secretId: string): Promise<string> {
  const result = await secretsClient.getSecretValue({ SecretId: secretId })
  return result.SecretString!
}
```

#### 方式三：运行时注入

```bash
# Docker / K8s 启动时注入
docker run -e DB_PASSWORD=$DB_PASSWORD my-app

# 或使用 Kubernetes Secrets
kubectl create secret generic app-secrets \
  --from-literal=db-password='xxx'
```

### 文件级别保护

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
secrets.yaml
```

---

## 7. 表单 emit('confirm') 应使用 defineExpose({ onConfirm })

### ❌ 错误做法

```vue
<!-- components/my-form/Index.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <!-- 表单字段... -->
    <el-button @click="handleSubmit">提交</el-button>
  </el-formtemplate>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'confirm', data: FormData): void
}>()

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('confirm', form)  // ❌ 直接 emit
}
</script>
```

```vue
<!-- 父组件使用 -->
<template>
  <!-- ❌ 需要监听 @confirm 事件 -->
  <MyForm @confirm="handleConfirm" />
</template>
```

### ✅ 正确做法

```vue
<!-- components/my-form/Index.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <!-- 表单字段... -->
    <el-button @click="handleSubmit">提交</el-button>
  </el-form>

<script setup lang="ts">
const formRef = ref<FormInstance>()

// ✅ 暴露方法而非事件
defineExpose({
  onConfirm: handleSubmit,
  validate: () => formRef.value?.validate(),
  reset: () => formRef.value?.resetFields(),
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  // 处理逻辑...
  return form  // 返回数据
}
</script>
```

```vue
<!-- 父组件使用（通过 MfwPopup） -->
<script setup lang="ts">
import MyForm from './components/my-form/Index.vue'
import { MfwPopup } from 'moyan-mfw-base/frontend'

const handleAdd = () => {
  MfwPopup.open({
    title: '新建记录',
    type: 'dialog',
    component: MyForm,
    popupProps: { width: 550 },
    on: { confirm: () => cardListPage.value?.refresh },  // ✅ 通过回调处理
  })
}
</script>
```

### 实际代码参考（[placement/Index.vue](../../../packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue#L93-L101)）

```typescript
const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,  // 表单组件
    popupProps: { width: 550 },
    on: { confirm: cardListPage.value?.refresh },  // ✅ 回调方式
  })
}
```

### 设计优势

1. **更好的封装性**：表单组件不需要知道父组件的存在
2. **更灵活的控制**：父组件可以决定确认后的行为
3. **统一的使用模式**：所有弹窗表单都通过 MfwPopup.open() 使用
4. **便于测试**：可以直接调用 exposed 方法进行单元测试

---

## 8. 使用 createQueryRunner() + try/catch

### ❌ 错误做法

```typescript
@Injectable()
export class AdService {
  constructor(private dataSource: DataSource) {}

  async transferAds(sourceId: string, targetId: string) {
    // ❌ 手动管理事务
    const queryRunner = this.dataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      await queryRunner.manager.update(Ad, { placementId: sourceId }, { placementId: targetId })
      await queryRunner.manager.update(AdPlacement, { id: sourceId }, { status: 0 })

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}
```

### ✅ 正确做法

```typescript
@Injectable()
export class AdService {
  constructor(private dataSource: DataSource) {}

  // ✅ 使用 dataSource.transaction() 自动管理事务
  async transferAds(sourceId: string, targetId: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Ad, { placementId: sourceId }, { placementId: targetId })
      await manager.update(AdPlacement, { id: sourceId }, { status: 0 })
    })
    // 自动 commit / rollback，无需手动管理
  }
}
```

### 对比分析

| 维度 | createQueryRunner | transaction(callback) |
|------|-------------------|-----------------------|
| 代码量 | ~20 行 | ~5 行 |
| 错误处理 | 手动 try/catch | 自动 |
| 资源释放 | 手动 release() | 自动 |
| 可读性 | 差（嵌套深） | 好（扁平） |
| 安全性 | 易遗漏 release | 无需担心 |

### 适用场景

仅当需要以下高级功能时才使用 `createQueryRunner()`：
- 需要在事务中使用不同的隔离级别
- 需要执行原生 SQL 查询
- 需要批量操作并手动控制 chunk 大小

---

## 9. 手动 repository.find() 分页

### ❌ 错误做法

```typescript
@Injectable()
export class AdService {
  constructor(
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
  ) {}

  // ❌ 手动实现分页逻辑
  async findAll(query: QueryAdDto) {
    const { page = 1, pageSize = 10, ...filters } = query

    const qb = this.adRepo.createQueryBuilder('ad')

    if (filters.title) {
      qb.andWhere('ad.title LIKE :title', { title: `%${filters.title}%` })
    }
    if (filters.status !== undefined) {
      qb.andWhere('ad.status = :status', { status: filters.status })
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return { list, total, page, pageSize }
  }
}
```

### ✅ 正确做法

```typescript
import { PaginationX, WhereBuilder } from 'moyan-mfw-base/backend'

@Injectable()
export class AdService {
  constructor(
    @InjectRepository(Ad) private adRepo: Repository<Ad>,
  ) {}

  // ✅ 使用框架提供的分页工具
  async findAll(query: QueryAdDto) {
    const pagination = new PaginationX(query)

    const where = new WhereBuilder<Ad>()
      .likeIf(query.title, 'title')
      .eqIf(query.status, 'status')
      .build()

    return pagination.query(this.adRepo, where)
  }
}
```

### 优势对比

| 维度 | 手动实现 | PaginationX + WhereBuilder |
|------|---------|---------------------------|
| 代码量 | ~30 行 | ~8 行 |
| 参数校验 | 手动处理 | 自动（class-validator） |
| 排序支持 | 手动实现 | 内置支持 |
| 总数统计 | 手动 andCount | 自动计算 |
| 类型安全 | 部分 | 完整泛型约束 |
| SQL 注入防护 | 需注意 | 自动参数化查询 |

---

## 10. TypeScript 类型错误

### ❌ 错误做法

```typescript
// 存在类型错误的代码
interface User {
  name: string
  age: number
}

const user: User = {
  name: 'Alice',
  // age 缺失 - 类型错误但忽略
}

// any 类型滥用
const data: any = fetchData()
data.nonExistentMethod()  // 运行时才会报错

// 断言过度
const result = someFunc() as unknown as MyComplexType
```

### ✅ 正确做法

#### 1. 编写时确保类型正确

```typescript
interface User {
  name: string
  age: number
}

const user: User = {
  name: 'Alice',
  age: 30,  // ✅ 所有必填字段完整
}
```

#### 2. 运行类型检查

```bash
# 全量检查
pnpm typecheck

# 分层检查
pnpm typecheck:shared
pnpm typecheck:backend
pnpm typecheck:frontend
```

#### 3. CI/CD 强制检查

```yaml
# .github/workflows/typecheck.yml
name: Type Check
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck  # 必须零错误才能通过
```

### 规则说明

> **红线规则 #3**：项目中任何 `.ts` 文件（包括测试文件）不允许存在 TypeScript 类型错误。所有文件必须通过 `tsc --noEmit` 类型验证，这是硬性要求。

### 常见类型错误及修复

| 错误类型 | 示例 | 修复方式 |
|---------|------|----------|
| 属性不存在 | `obj.prop` 但 `prop` 未定义 | 补全接口定义或可选链 `obj?.prop` |
| 类型不匹配 | 传 `string` 给 `number` 参数 | 类型转换或修正 DTO |
| any 滥用 | `const x: any` | 定义具体类型或使用 `unknown` |
| Promise 未 await | `const data = asyncFunc()` | 添加 `await` 或声明为 `Promise<T>` |
| 导入路径错误 | `from './file'` 但文件不存在 | 修正路径或检查 exports |

---

## 自检清单

### 代码提交前必查

- [ ] **未手动修改 `apis/` 目录**：所有 API 代码均为生成产物
- [ ] **组件位置正确**：可复用组件在 `components/`，页面组件在 `views/`
- [ ] **组件命名规范**：`components/` 下使用 `Mfw` 前缀
- [ ] **无内联 STATUS 常量**：使用 `StatusDict` 或 shared 字典
- [ ] **无 @Req/@Res 装饰器**：Controller 使用 `@User()` 和自动响应
- [ ] **删除操作有确认框**：`ElMessageBox.confirm` + `{ hintSuccess: true }`
- [ ] **无硬编码敏感信息**：密钥通过环境变量或密钥管理服务获取
- [ ] **弹窗表单使用 defineExpose**：不使用 `emit('confirm')`
- [ ] **事务使用 dataSource.transaction()**：不手动管理 QueryRunner
- [ ] **分页使用 PaginationX**：不手动实现分页逻辑
- [ ] **TypeScript 零错误**：运行 `pnpm typecheck` 通过

### Code Review 检查项

- [ ] 新增文件都有 `@fileoverview` + `@description`
- [ ] Entity 继承 `Base` 类
- [ ] Controller 使用 `@RequirePermission` 控制权限
- [ ] Swagger 装饰器从 `moyan-mfw-core` 导入
- [ ] Shared 层五个模块齐全且正确导出
- [ ] Manifest 字段完整且符合格式约束

---

## 总结

遵循本反模式清单可以：

1. **避免常见陷阱**：基于社区经验总结的典型错误
2. **保证代码质量**：符合框架设计意图和最佳实践
3. **提高审查效率**：明确的标准减少主观判断
4. **降低维护成本**：一致的代码风格便于团队协作

**核心原则**：当不确定某写法是否正确时，参考 [extension-ad 示例](../../../packages/extensions/extension-ad) 的实际实现，它是经过验证的标准模板。
