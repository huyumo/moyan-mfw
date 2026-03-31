# 规则引擎使用指南

> 版本：1.0.0 | 最后更新：2026-03-31

---

## 快速开始

### 1. 任务触发

当用户提出任务时，AI 自动识别任务类型并加载适用规则：

```
用户：创建一个用户管理的 API 接口
      ↓
AI 识别任务类型：create_api
      ↓
加载适用规则：
- CODING-001:FILE_NAMING（文件命名）
- ARCH-001:LAYER_STRUCTURE（分层架构）
- API-001:RESPONSE_FORMAT（响应格式）
- API-001:REQUEST_VALIDATION（请求体验证）
      ↓
生成符合规范的代码
      ↓
自检规则合规性
      ↓
输出
```

---

## 规则文件结构

```
rules/
├── 01-编码基础规范.rules.yaml    # 文件命名、目录结构、代码命名
├── 02-项目架构规范.rules.yaml    # 分层架构、依赖注入、异常处理
├── 03-API 设计规范.rules.yaml    # RESTful、响应格式、DTO 验证
├── 04-数据库规范.rules.yaml      # 实体设计、Repository、事务
├── 05-权限安全规范.rules.yaml    # JWT 认证、权限控制、安全
├── 06-日志与监控.rules.yaml      # （待编写）
├── 07-Git 工作流.rules.yaml      # （待编写）
├── 08-测试规范.rules.yaml        # （待编写）
├── 09-部署规范.rules.yaml        # （待编写）
├── 11-代码审查清单.rules.yaml    # （待编写）
└── engine/
    ├── types.ts                  # 类型定义
    ├── validator.ts              # 验证引擎
    └── index.ts                  # 统一导出
```

---

## 规则优先级

| 优先级 | 说明 | AI 行为 |
|--------|------|---------|
| `MUST` | 必须遵守 | 违规则拒绝输出，必须修正 |
| `SHOULD` | 应该遵守 | 违规则警告，有充分理由可例外 |
| `MAY` | 可以遵守 | 建议遵守，根据场景选择 |

---

## 规则类型

| 类型 | 说明 | 验证方式 |
|------|------|----------|
| `regex` | 正则表达式匹配 | 对代码进行正则匹配 |
| `content` | 文件内容检查 | 检查是否包含特定内容 |
| `naming` | 命名规范 | 检查类、方法、变量命名 |
| `ast` | AST 语法树分析 | 解析代码结构进行验证 |
| `structure` | 目录/项目结构 | 检查目录结构或文件位置 |

---

## 任务类型与规则映射

### create_api（创建 API 接口）

**触发关键词**：`新建 API`、` 创建接口`、` 生成 Controller`

**适用规则**：
- `CODING-001:FILE_NAMING` - 文件命名（user.controller.ts）
- `ARCH-001:LAYER_STRUCTURE` - 分层架构（Controller → Service）
- `API-001:RESTFUL_PATH` - RESTful 路径（/api/v1/users）
- `API-001:RESPONSE_FORMAT` - 响应格式（{ code, data, message }）
- `API-001:REQUEST_VALIDATION` - 请求体验证（DTO + class-validator）
- `API-001:SWAGGER` - Swagger 注解（@ApiOperation、@ApiResponse）

---

### create_service（编写 Service）

**触发关键词**：`编写 Service`、` 创建服务`、` 业务逻辑`

**适用规则**：
- `CODING-001:FILE_NAMING` - 文件命名（user.service.ts）
- `ARCH-001:DEPENDENCY_INJECTION` - 依赖注入（构造函数注入）
- `ARCH-001:EXCEPTION_HANDLING` - 异常处理（继承 HttpException）
- `ARCH-001:CODE_COMPLEXITY` - 代码复杂度（方法长度 < 50 行）

---

### create_entity（创建实体）

**触发关键词**：`创建实体`、`Entity`、` 数据库表`

**适用规则**：
- `CODING-001:FILE_NAMING` - 文件命名（user.entity.ts）
- `DB-001:ENTITY_DESIGN` - 实体设计（@Entity、@Column、comment）
- `DB-001:INDEX` - 索引规范（唯一索引、查询字段索引）

---

### database_query（数据库查询）

**触发关键词**：`查询数据库`、`Repository`、`QueryBuilder`

**适用规则**：
- `DB-001:REPOSITORY_PATTERN` - Repository 模式（参数化查询）
- `DB-001:AVOID_N_PLUS_1` - 避免 N+1 查询（使用 join）
- `DB-001:TRANSACTION` - 事务管理（多表写入使用事务）

---

### add_auth（添加认证）

**触发关键词**：`添加认证`、`JWT`、` 登录`、`注册`

**适用规则**：
- `AUTH-001:JWT_AUTH` - JWT 认证（AuthGuard、@Public）
- `AUTH-001:PASSWORD` - 密码加密（bcrypt）
- `AUTH-001:RATE_LIMITING` - 速率限制（登录限流）

---

### add_permission（添加权限）

**触发关键词**：`添加权限`、`RBAC`、` 角色`、`授权`

**适用规则**：
- `AUTH-001:PERMISSION` - 权限控制（@RequirePermission）
- `AUTH-001:SQL_INJECTION` - SQL 注入防护（参数化查询）

---

## 验证流程

### 代码生成前

1. 识别任务类型
2. 加载适用规则
3. 将规则作为约束条件输入 AI

### 代码生成后

1. 运行规则验证
2. 检查 MUST 规则是否全部通过
3. 如有违规则，自动修正或重新生成

### 输出前检查清单

```
□ FILE-001: 文件名是否正确（kebab-case + 功能后缀）
□ DIR-001: 目录位置是否正确（src/controllers/、src/services/）
□ LAYER-001: 分层架构是否正确（Controller → Service → Repository）
□ DI-001: 依赖注入是否正确（构造函数注入）
□ RESP-001: 响应格式是否统一（{ code, data, message }）
□ VAL-001: DTO 是否有验证装饰器
□ SWG-001: 是否有 Swagger 注解
□ ENT-005: 实体字段是否有 comment
```

---

## 示例：生成用户管理 API

### 用户输入

```
创建一个用户管理的 API 接口，支持创建和查询用户
```

### AI 处理流程

1. **任务识别**：`create_api`
2. **加载规则**：
   - `CODING-001:FILE_NAMING`
   - `ARCH-001:LAYER_STRUCTURE`
   - `API-001:RESTFUL_PATH`
   - `API-001:RESPONSE_FORMAT`
   - `API-001:REQUEST_VALIDATION`
   - `API-001:SWAGGER`

3. **生成代码**（遵循规则）：

```typescript
// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('用户管理')
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { code: 0, data: user, message: '创建成功' };
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return { code: 0, data: user, message: '查询成功' };
  }
}
```

4. **规则验证**：
   - ✅ FILE-001: 文件名 `user.controller.ts` 正确
   - ✅ LAYER-002: Controller 注入 Service 正确
   - ✅ REST-001: 路径 `/api/v1/users` 使用复数
   - ✅ REST-003: 路径包含版本号 `v1`
   - ✅ RESP-001: 响应格式 `{ code, data, message }` 正确
   - ✅ VAL-002: 使用 `@Body() dto: CreateUserDto` 正确
   - ✅ SWG-001: 有 `@ApiOperation` 注解
   - ✅ SWG-002: 有 `@ApiResponse` 注解

5. **输出代码**

---

## 违规处理

### MUST 规则违规

```
❌ FILE-001: 文件名 `UserController.ts` 违规
   → 必须修正为 `user.controller.ts`
   → 拒绝输出，重新生成
```

### SHOULD 规则违规

```
⚠️ SWG-001: 缺少 @ApiOperation 注解
   → 建议添加接口说明
   → 可输出，但附带警告
```

---

## 扩展规则

### 添加新规则文件

1. 在 `rules/` 目录下创建新文件
2. 命名格式：`[编号]-[主题].rules.yaml`
3. 更新本文档的导航

### 添加新任务类型

在规则文件的 `task_index` 中添加：

```yaml
task_index:
  - task: new_task_type
    trigger_keywords: ["关键词 1", "关键词 2"]
    required_rules:
      - "RULE_FILE_ID:CATEGORY_ID"
```

---

## 验收标准

- [x] 核心规则文件已编写（01/02/03/04/05）
- [ ] 完整规则文件已编写（10 份）
- [x] 验证引擎可实现规则检查
- [ ] AI 生成代码合规率达到 95%+
- [ ] 规则验证响应时间 < 1 秒
- [ ] 支持自动修正建议

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-31 | 初始版本，编写核心规则文件和验证引擎 |
