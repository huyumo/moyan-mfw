# 规则引擎设计文档

> 版本：1.0.0 | 状态：设计中 | 设计日期：2026-03-31

---

## 1. 概述

规则引擎用于将开发规范转换为机器可读、可执行的规则，AI 生成代码后自动验证合规性。

**目标**：AI 代码生成精准度达到 98%+

---

## 2. 规则文件格式

### 2.1 文件结构

```
rules/
├── 01-编码基础规范.rules.yaml
├── 02-项目架构规范.rules.yaml
├── 03-API 设计规范.rules.yaml
├── 04-数据库规范.rules.yaml
├── 05-权限安全规范.rules.yaml
├── 06-日志与监控.rules.yaml
├── 07-Git 工作流.rules.yaml
├── 08-测试规范.rules.yaml
├── 09-部署规范.rules.yaml
├── 11-代码审查清单.rules.yaml
└── engine/
    ├── validator.ts        # 规则验证引擎
    ├── types.ts            # 类型定义
    └── index.ts            # 统一导出
```

### 2.2 YAML 文件结构

```yaml
---
meta:
  id: CODING-001
  name: 编码基础规范
  version: 1.0
  source: docs/03-框架规范/02-后端规范/01-编码基础规范.md
  last_updated: 2026-03-31

# 规则分类
categories:
  - id: FILE_NAMING
    name: 文件命名规范
    rules:
      - id: FILE-001
        name: TypeScript 文件命名
        priority: MUST  # MUST | SHOULD | MAY
        type: regex     # regex | ast | content | structure
        target: file_name
        pattern: "^[a-z]+(-[a-z]+)*\\.(service|controller|entity|dto\\.vo|types|config|middleware)\\.ts$"
        message: "文件名必须使用 kebab-case + 功能后缀"
        examples:
          valid: ["user.service.ts", "auth.controller.ts"]
          invalid: ["UserService.ts", "user_service.ts"]

  - id: DIRECTORY
    name: 目录结构规范
    rules:
      - id: DIR-001
        name: 实体目录
        priority: MUST
        type: structure
        target: directory
        mapping:
          entities: "src/entities/"
          services: "src/services/"
          controllers: "src/controllers/"
          dto_vo: "src/dto-vo/"
          guards: "src/guards/"
          interceptors: "src/interceptors/"
        forbidden:
          - "models/"
          - "dao/"
        message: "必须使用规范的目录结构"
```

---

## 3. 规则类型定义

### 3.1 规则类型

| 类型 | 说明 | 验证方式 |
|------|------|----------|
| `regex` | 正则表达式匹配 | 对目标内容进行正则匹配 |
| `ast` | AST 语法树分析 | 解析代码 AST 进行结构验证 |
| `content` | 文件内容检查 | 检查文件是否包含/不包含特定内容 |
| `structure` | 目录/项目结构 | 检查目录结构或文件位置 |
| `dependency` | 依赖检查 | 检查 package.json 依赖 |
| `naming` | 命名规范 | 检查类、方法、变量命名 |

### 3.2 优先级定义

| 优先级 | 说明 | AI 行为 |
|--------|------|---------|
| `MUST` | 必须遵守 | 违反时必须修正，否则拒绝输出 |
| `SHOULD` | 应该遵守 | 违反时警告，有充分理由可例外 |
| `MAY` | 可以遵守 | 建议遵守，根据场景选择 |

---

## 4. 任务导向索引

```yaml
# 每个规则文件包含任务索引
task_index:
  - task: create_api
    trigger_keywords: ["新建 API", "创建接口", "生成 Controller"]
    required_rules:
      - "CODING-001:FILE_NAMING"
      - "ARCH-001:LAYER_STRUCTURE"
      - "API-001:RESPONSE_FORMAT"
    optional_rules:
      - "API-001:PAGINATION"

  - task: create_service
    trigger_keywords: ["编写 Service", "创建服务", "业务逻辑"]
    required_rules:
      - "CODING-001:FILE_NAMING"
      - "ARCH-001:SERVICE_INJECTION"
      - "ARCH-001:TRANSACTION"

  - task: add_auth
    trigger_keywords: ["添加权限", "认证", "授权", "守卫"]
    required_rules:
      - "AUTH-001:JWT_GUARD"
      - "AUTH-001:PERMISSION_DECORATOR"

  - task: database_operation
    trigger_keywords: ["数据库操作", "查询", "实体", "Repository"]
    required_rules:
      - "DB-001:ENTITY_ANNOTATION"
      - "DB-001:REPOSITORY_PATTERN"
      - "DB-001:AVOID_N_PLUS_1"
```

---

## 5. 验证器接口设计

```typescript
// engine/types.ts

export type Priority = 'MUST' | 'SHOULD' | 'MAY';
export type RuleType = 'regex' | 'ast' | 'content' | 'structure' | 'dependency' | 'naming';

export interface Rule {
  id: string;
  name: string;
  priority: Priority;
  type: RuleType;
  target: string;
  pattern?: string;        // regex 类型使用
  message: string;
  examples?: {
    valid: string[];
    invalid: string[];
  };
}

export interface ValidationResult {
  passed: boolean;
  ruleId: string;
  ruleName: string;
  priority: Priority;
  message: string;
  filePath?: string;
  suggestion?: string;     // 修正建议
}

export interface ValidationEngine {
  /**
   * 验证单个文件
   */
  validateFile(filePath: string, content: string): Promise<ValidationResult[]>;

  /**
   * 验证代码片段
   */
  validateSnippet(code: string, context: ValidationContext): Promise<ValidationResult[]>;

  /**
   * 根据任务类型获取适用规则
   */
  getRulesForTask(taskType: string): Promise<Rule[]>;

  /**
   * 自动修正代码
   */
  autoFix(code: string, violations: ValidationResult[]): Promise<string>;
}
```

---

## 6. AI 工作流集成

```
┌─────────────────────────────────────────────────────────────┐
│                    用户输入任务                               │
│              "创建一个用户管理的 API 接口"                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              任务识别（关键词匹配）                            │
│         识别为：create_api 任务类型                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           加载适用规则（从 task_index）                        │
│    - CODING-001:FILE_NAMING                                 │
│    - ARCH-001:LAYER_STRUCTURE                               │
│    - API-001:RESPONSE_FORMAT                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI 生成代码                                   │
│    基于规则约束生成符合规范的代码                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              规则验证（validateSnippet）                       │
│    - FILE-001: 文件名检查 ✅                                 │
│    - ARCH-001: 分层检查 ✅                                   │
│    - API-001: 响应格式检查 ✅                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌──────────────┐
                    │ 全部通过？   │
                    └──────────────┘
                     ↓              ↓
                   是              否
                   ↓                ↓
           ┌───────────┐    ┌──────────────┐
           │  输出代码  │    │ 自动修正/重试 │
           └───────────┘    └──────────────┘
```

---

## 7. 规则示例

### 7.1 文件命名规则

```yaml
- id: FILE-001
  name: TypeScript 文件命名规范
  priority: MUST
  type: regex
  target: file_name
  pattern: "^[a-z]+(-[a-z]+)*\\.(service|controller|entity|dto\\.vo|types|config|middleware)\\.ts$"
  message: |
    文件名必须使用 kebab-case（短横线分隔）+ 功能后缀
    有效示例：user.service.ts, auth.controller.ts
    无效示例：UserService.ts, user_service.ts
```

### 7.2 Service 注入规则

```yaml
- id: ARCH-002
  name: Service 依赖注入规范
  priority: MUST
  type: ast
  target: class_constructor
  pattern: "constructor\\(\\s*(?:private|public|protected)?\\s*readonly\\s+\\w+Service:\\s+\\w+Service"
  message: "Service 必须通过构造函数注入依赖，建议使用 readonly 修饰"
  examples:
    valid:
      - "constructor(private readonly userService: UserService) {}"
    invalid:
      - "private userService = new UserService();"
      - "const userService = Container.get(UserService);"
```

### 7.3 统一响应格式规则

```yaml
- id: API-001
  name: 统一响应格式规范
  priority: MUST
  type: ast
  target: return_statement
  structure:
    type: object
    required_fields:
      - name: code
        type: number
      - name: data
        type: any
      - name: message
        type: string
  message: "Controller 返回值必须包含 { code, data, message }"
```

---

## 8. 实施计划

| 阶段 | 时间 | 任务 |
|------|------|------|
| 阶段 1 | Day 1-2 | 编写 01/02/03 规则文件（核心） |
| 阶段 2 | Day 3-4 | 编写 04/05/11 规则文件（重要） |
| 阶段 3 | Day 5-6 | 编写 06/07/08/09 规则文件（完整） |
| 阶段 4 | Day 7 | 编写验证引擎（validator.ts） |
| 阶段 5 | Day 8 | 集成测试和优化 |

---

## 9. 验收标准

- [ ] 10 份规则文件全部编写完成
- [ ] 验证引擎可执行规则检查
- [ ] AI 生成代码合规率达到 95%+
- [ ] 规则验证响应时间 < 1 秒
- [ ] 支持自动修正建议

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-31 | 初始设计文档 |
