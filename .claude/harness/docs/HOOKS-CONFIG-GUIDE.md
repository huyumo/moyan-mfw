# Harness Hooks 配置指南

本目录包含 Harness Hooks 的配置文件，用于为不同 subagent 注入项目特定的技术栈和规范信息。

## 📁 目录结构

```
.claude/harness/config/
├── tech-stack.json          # 技术栈配置（复制 tech-stack.example.json）
├── frontend.json            # 前端开发规范配置（复制 frontend.example.json）
├── backend.json             # 后端开发规范配置（复制 backend.example.json）
├── review.json              # 代码审查配置（复制 review.example.json）
├── docs.json                # 文档模板配置（可选）
└── *.example.json           # 示例配置文件
```

## 🔧 配置文件说明

### 1. tech-stack.json - 技术栈配置

**用途**: 为 `tech-architect` subagent 提供项目技术栈信息

**触发 Hook**: `hook:architect-context`

**配置项**:
- `techStack.language` - 编程语言
- `techStack.runtime` - 运行时环境
- `techStack.frameworks` - 使用的框架
- `techStack.databases` - 数据库
- `techStack.testing` - 测试工具
- `techStack.tooling` - 开发工具
- `architectureDecisions` - 架构决策记录 (ADR)
- `techDebt` - 技术债务清单
- `projectStructure` - 项目结构说明

**示例**:
```json
{
  "techStack": {
    "language": {
      "name": "TypeScript",
      "version": "5.x",
      "description": "主要开发语言"
    },
    "runtime": {
      "name": "Node.js",
      "version": "20.x"
    },
    "frameworks": [
      {
        "name": "NestJS",
        "version": "10.x",
        "description": "Web 框架"
      }
    ],
    "databases": [
      {
        "name": "PostgreSQL",
        "version": "15.x",
        "type": "relational"
      }
    ]
  },
  "architectureDecisions": [
    {
      "id": "ADR-001",
      "title": "API 设计风格",
      "decision": "RESTful",
      "description": "采用 RESTful API 设计风格",
      "status": "accepted"
    }
  ]
}
```

---

### 2. frontend.json - 前端开发规范配置

**用途**: 为 `frontend-dev` subagent 提供前端开发指南

**触发 Hook**: `hook:frontend-guidelines`

**配置项**:
- `framework` - 前端框架（React/Vue/Angular）
- `styling` - 样式方案（CSS Modules/Tailwind/Sass）
- `buildTool` - 构建工具（Vite/Webpack）
- `componentNamingConventions` - 组件命名约定
- `responsiveBreakpoints` - 响应式断点
- `accessibility.requirements` - 可访问性要求
- `performanceOptimizations` - 性能优化建议

**示例**:
```json
{
  "framework": {
    "name": "React",
    "version": "18.x"
  },
  "styling": {
    "approach": "Tailwind CSS"
  },
  "accessibility": {
    "standard": "WCAG 2.1 AA",
    "requirements": [
      "所有图片必须有 alt 属性",
      "颜色对比度至少 4.5:1"
    ]
  }
}
```

---

### 3. backend.json - 后端开发规范配置

**用途**: 为 `backend-ts-node-dev` subagent 提供后端安全规范

**触发 Hook**: `hook:backend-security`

**配置项**:
- `security.guidelines` - 安全编码规范
- `api.standards` - API 设计规范
- `database.standards` - 数据库规范
- `logging.requirements` - 日志要求

**示例**:
```json
{
  "security": {
    "guidelines": [
      "使用参数化查询或 ORM",
      "密码使用 bcrypt 哈希"
    ]
  },
  "api": {
    "standards": [
      "遵循 RESTful 命名约定",
      "统一错误响应格式"
    ]
  }
}
```

---

### 4. review.json - 代码审查配置

**用途**: 为 `code-reviewer-tester` subagent 提供审查清单

**触发 Hook**: `hook:review-checklist`

**配置项**:
- `security.checklist` - 安全性审查清单
- `security.blockers` - 阻断性问题列表
- `performance.checklist` - 性能审查清单
- `performance.thresholds` - 性能阈值
- `maintainability.checklist` - 可维护性审查清单
- `maintainability.metrics` - 代码质量指标
- `testing.requirements` - 测试要求
- `codeStyle.rules` - 代码风格规则

**示例**:
```json
{
  "security": {
    "criticalChecks": [
      "无硬编码凭证",
      "所有用户输入已验证"
    ],
    "blockers": [
      "发现明文密码存储",
      "发现 SQL 注入漏洞"
    ]
  },
  "maintainability": {
    "metrics": {
      "maxFunctionLength": 50,
      "minTestCoverage": 0.8
    }
  }
}
```

---

### 5. docs.json - 文档模板配置（可选）

**用途**: 为 `docs-architect` subagent 提供文档模板

**触发 Hook**: `hook:docs-template`

**配置项**:
- `templates.apiDoc` - API 文档模板
- `templates.designDoc` - 技术设计文档模板
- `templates.userGuide` - 用户指南模板
- `templates.readme` - README 模板

---

## 🚀 使用方法

### 步骤 1: 复制示例配置

```bash
cd .claude/harness/config

# 复制需要的配置文件
cp tech-stack.example.json tech-stack.json
cp frontend.example.json frontend.json
cp review.example.json review.json
```

### 步骤 2: 编辑配置文件

根据项目实际情况修改配置内容：
- 更新技术栈版本
- 添加项目特定的架构决策
- 定义项目特定的规范和要求

### 步骤 3: 验证配置

运行相应的 hook 验证配置是否正确加载：

```bash
cd .claude/harness
pnpm run hook:architect-context    # 验证技术栈配置
pnpm run hook:backend-security    # 验证后端规范配置
pnpm run hook:frontend-guidelines # 验证前端规范配置
pnpm run hook:review-checklist    # 验证审查清单配置
```

### 步骤 4: 输出文件

Hook 运行后会在 `.claude/harness/output/` 目录生成：
- `*.json` - 结构化数据（供 subagent 读取）
- `*.md` - 可读文档（供人工参考）

---

## ⚠️ 注意事项

1. **配置文件是可选的** - 如果没有配置文件，hooks 会加载通用原则/模板
2. **优先使用项目特定配置** - 如果存在配置文件，会覆盖通用原则
3. **保持配置同步** - 技术栈变更时，及时更新配置文件
4. **不要提交敏感信息** - 配置文件中不要包含密码、API Key 等敏感信息

---

## 📋 配置 Schema

每个配置文件都有对应的 Schema 文件用于验证：

- `tech-stack-config-schema.json` - 技术栈配置 Schema
- 其他 Schema 可按需创建

---

## 🔍 故障排除

### Hook 无法加载配置

检查：
1. 配置文件路径是否正确（`.claude/harness/config/`）
2. JSON 格式是否有效
3. 文件权限是否正确

### 配置未生效

检查：
1. 配置文件是否命名为 `*.json`（不是 `*.json.example`）
2. `.claude/settings.json` 中 hook 配置是否正确
3. 运行 hook 查看输出中的 `configLoaded` 字段

---

## 📚 相关文档

- [SUBAGENT-START-HOOKS.md](./SUBAGENT-START-HOOKS.md) - SubagentStart hooks 设计文档
- [TEAMWORK.md](../TEAMWORK.md) - 团队协作规范
- [QUICKSTART.md](../QUICKSTART.md) - 快速入门
