# mfw-guide Skill 优化计划 V2

## 背景与讨论记录

### 评估结论摘要

2026-04-26 对 `mfw-guide` Skill 进行了多维度深度评估，综合评分 **4.1/5**：

| 维度 | 评分 | 核心判断 |
|------|------|---------|
| 组织结构 | ⭐⭐⭐⭐ | 路由+专题两层架构合理，依赖声明有待落地 |
| 实用性 | ⭐⭐⭐⭐½ | 模板+清单+反模式三件套极其实用，错误诊断可加强 |
| 收益 | ⭐⭐⭐⭐⭐ | 代码一致性、协作成本、新人上手三方面均有显著价值 |
| 弊端 | ⭐⭐⭐ | 维护滞后是核心风险，信息过载和过度约束次之 |
| 标准化 | ⭐⭐⭐⭐ | frontmatter 和反模式模式有规范，格式细节可统一 |

### 关键发现

1. **`{{ref:}}` 不支持子目录引用** — 正则 `\w[\w-]*` 不匹配 `/`，validate-skill-docs.ts 仅做根目录 `readdirSync`。这意味着 **docs/ 子目录分组方案不可行**（除非 Trae IDE 本身支持递归扫描，目前无法验证）。
2. **`scripts/generators/helpers/` 是死代码** — plopfile.ts 在内部自行定义了 pascalCase/camelCase/upperCase helper，未导入 helpers/ 目录下的文件。
3. **内容重复** — `apis/` 红线规则在 5 个文件中重复出现；权限编码规则在 3 个文件中重复；MfwPopup 示例在 2 个文件中重复。
4. **Red Flags 格式不统一** — 部分用表格，部分用列表，部分带 ✋ emoji，部分不带。
5. **error-diagnosis.md 偏检查清单** — 缺少「症状→假设→验证→修复」决策树结构。

### 与 `scripts/generators` 的关系

- plop 是 Skill 的"参数收集器"，两者构成 **"元数据输入 → 知识匹配 → 代码输出"** 管道
- plop 只输出文本指令（含 `{{ref:xxx}}`），不直接生成文件，由 AI Agent 读取 Skill 文档后生成代码
- plop 生成器必须留在 `scripts/` 目录（由 `pnpm gen:xxx` 调用，是项目级工具链）

### 目录结构优化方案调整

原建议的 `docs/backend/`、`docs/frontend/` 子目录分组方案因 `{{ref:}}` 不支持子目录而 **延期**。替代方案：

- **用文件名前缀编码领域**（如 `backend-xxx.md`）— 但当前命名已具辨识度，强行重命名破坏性大
- **在 Skill 根目录新增 `resources/` 目录** — 存放非 `.md` 资源文件（模板、schema），不依赖 `{{ref:}}` 机制
- **保持 .md 文件扁平** — 维持 `{{ref:}}` 兼容性，通过命名约定和 SKILL.md 路由表实现逻辑分组

---

## 实施计划

### 步骤 1：保存讨论文档

将本次评估的完整讨论记录保存到 `.trae/documents/` 目录下，作为项目知识存档。

**文件**: `.trae/documents/mfw-guide-skill-evaluation-2026-04-26.md`

内容包含：
- 多维度评估详情（实用性/收益/弊端/标准化/组织结构）
- 与 scripts/generators 关系分析
- 目录结构优化方案及约束说明
- `{{ref:}}` 机制的技术约束分析

### 步骤 2：清理死代码

删除 `scripts/generators/helpers/` 目录下的 3 个未使用文件：
- `kebab-case.ts`
- `pascal-case.ts`
- `permission-code.ts`

### 步骤 3：抽取清单为独立资源文件

从 `new-backend-module.md` 的 13 项清单和 `new-frontend-page.md` 的 4 项清单中，抽取为独立的 `.md` 文件：

**新建文件**:
- `.trae/skills/mfw-guide/backend-checklist.md` — 后端模块 13 项清单（含 frontmatter）
- `.trae/skills/mfw-guide/frontend-checklist.md` — 前端页面 4 项清单（含 frontmatter）

**修改文件**:
- `new-backend-module.md` — 将"新增后端模块清单"章节改为引用 `{{ref:backend-checklist}}`
- `new-frontend-page.md` — 将"新增前端页面清单"章节改为引用 `{{ref:frontend-checklist}}`
- `SKILL.md` — 验证部分改为引用 `{{ref:backend-checklist}}` 和 `{{ref:frontend-checklist}}`

### 步骤 4：统一 Red Flags 格式

将所有文件的"反模式（Red Flags）— 立即停止"区块统一为 ✋ emoji + 列表格式：

```markdown
## 反模式（Red Flags）— 立即停止

- ✋ 违规描述 → 正确做法
- ✋ 违规描述 → 正确做法
```

需修改的文件（检查并统一格式）：
- `apis-redline.md` — 当前为表格+列表混合 → 统一为列表
- `component-reference.md` — 检查格式
- `new-backend-module.md` — 检查格式
- `new-frontend-page.md` — 检查格式
- `pagination-query.md` — 检查格式
- `permission-debugging.md` — 检查格式
- `routing-auth.md` — 检查格式
- `multi-tenant.md` — 检查格式
- `deployment.md` — 检查格式
- `project-structure.md` — 检查格式
- `coding-conventions.md` — 检查格式
- `styling-theming.md` — 检查格式
- `migration-guide.md` — 检查格式
- `testing-guide.md` — 检查格式
- `error-diagnosis.md` — 检查格式

### 步骤 5：增强 error-diagnosis.md

将"常见运行时错误"表格扩展为「症状→假设→验证→修复」决策树结构：

```markdown
## 症状：接口返回 401

**假设 1**：Token 过期
  → 验证：打开 DevTools → Application → localStorage → 检查 `mfw:admin:token` 是否存在及过期时间
  → 修复：清除 Token 重新登录，检查自动刷新逻辑

**假设 2**：Token 缺失
  → 验证：检查 localStorage 中是否有 `mfw:admin:token`
  → 修复：确认登录流程是否正确存储 Token

**假设 3**：后端 JWT Secret 变更
  → 验证：检查后端 `.env` 中 JWT_SECRET 配置
  → 修复：同步 JWT Secret，重新登录
```

对以下症状补充决策树：
- 接口返回 401
- 接口返回 403
- 菜单不显示
- 前端构建类型错误
- API 生成失败
- 数据库连接失败

### 步骤 6：更新 validate-skill-docs.ts

扩展验证脚本，增加以下检查：

1. **Red Flags 格式一致性检查** — 验证所有文件的反模式区块使用统一格式（✋ emoji + 列表）
2. **清单文件存在性检查** — 验证 `backend-checklist.md` 和 `frontend-checklist.md` 存在
3. **重复内容检测** — 检测多个文件中是否存在完全相同的段落（如 apis 红线重复），提示应改为 `{{ref:}}` 引用

### 步骤 7：运行验证

执行 `pnpm validate:skill` 确认所有检查通过。

---

## 延期事项（需 Trae 支持子目录后实施）

1. **Skill 目录领域分组** — `.md` 文件移入 `docs/backend/`、`docs/frontend/` 等子目录
2. **代码模板移入 resources/templates/** — 从 `.md` 文档中抽离模板代码
3. **validate-skill-docs.ts 移入 Skill 目录** — 实现 Skill 自治

以上延期事项的前提条件：Trae IDE 的 `{{ref:}}` 机制支持子目录引用，或 Trae Skill 加载器支持递归扫描子目录。
