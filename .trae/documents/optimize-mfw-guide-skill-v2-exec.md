# mfw-guide Skill 优化实施计划 V2

## 背景

基于 2026-04-26 的多维度评估（综合 4.1/5），识别出 5 项核心改进方向。

### 技术约束澄清（重要更新）

**`{{ref:}}` 不支持子目录引用的约束来源有两层：**

| 来源 | 是否支持子目录 | 说明 |
|------|--------------|------|
| **Trae IDE 平台** | ✅ **支持** | 官方文档明确展示 `examples/`、`templates/`、`resources/` 子目录，子目录中可以有 `.md` 文件 |
| **`validate-skill-docs.ts`** | ❌ **不支持** | `fs.readdirSync(SKILL_DIR)` 仅扫描根目录；正则 `\w[\w-]*` 不匹配 `/`；`refName → refName.md` 映射不做路径拼接 |
| **`{{ref:}}` 语法** | ❌ **当前不支持路径** | 正则 `\{\{ref:(\w[\w-]*)\}\}` 不匹配 `/`，但可修改正则和解析逻辑支持子目录路径 |

**结论**：子目录分组方案**完全可行**。约束仅来自项目自写的验证脚本和 `{{ref:}}` 语法定义，两者均可修改。Trae IDE 平台本身支持子目录。

### 实施策略调整

原计划中"延期"的子目录分组方案现在可以**纳入本次实施**。但需要先修改 `{{ref:}}` 语法和验证脚本以支持子目录路径，然后才能执行目录重组。

**已完成的前置工作：**
- ✅ 评估讨论文档已保存至 `.trae/documents/mfw-guide-skill-evaluation-2026-04-26.md`
- ✅ `scripts/generators/helpers/` 下 3 个死代码文件已删除（kebab-case.ts、pascal-case.ts、permission-code.ts）

---

## 实施步骤

### 步骤 1：升级 `{{ref:}}` 语法支持子目录路径

修改 `validate-skill-docs.ts` 中的 `validateCrossReferences` 函数：

**1a. 将 `readdirSync` 改为递归扫描：**

```typescript
function getAllMdFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMdFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.md') && entry.name !== 'SKILL.md') {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}
```

**1b. 修改正则支持路径分隔符：**

```typescript
// 旧: /\{\{ref:(\w[\w-]*)\}\}/g
// 新: /\{\{ref:([\w-]+(?:\/[\w-]+)*)\}\}/g
```

**1c. 修改文件名映射逻辑：**

```typescript
// 旧: skillFiles = Set(files.map(f => f.replace('.md', '')))
// 新: skillFiles = Set(getAllMdFiles(SKILL_DIR).map(f => f.replace('.md', '')))
// refName 匹配时直接与相对路径（去掉 .md）比对
```

**1d. 同步修改 frontmatter 扫描逻辑：**

`validateFrontmatter` 函数也需要改用递归扫描，使其能检查子目录中的 `.md` 文件。

### 步骤 2：Skill 目录重组（子目录分组）

将 Skill 目录从扁平结构重组为按领域分组的子目录结构：

**目标结构：**

```
.trae/skills/mfw-guide/
  ├── SKILL.md                              ← 入口（精简）
  ├── backend/                              ← 后端相关文档
  │   ├── new-backend-module.md
  │   ├── pagination-query.md
  │   └── migration-guide.md
  ├── frontend/                             ← 前端相关文档
  │   ├── new-frontend-page.md
  │   ├── component-reference.md
  │   └── styling-theming.md
  ├── auth/                                 ← 认证权限相关文档
  │   ├── permission-debugging.md
  │   ├── routing-auth.md
  │   └── multi-tenant.md
  ├── infra/                                ← 基础设施相关文档
  │   ├── deployment.md
  │   ├── error-diagnosis.md
  │   └── testing-guide.md
  ├── shared/                               ← 跨域共享文档
  │   ├── project-structure.md
  │   ├── coding-conventions.md
  │   └── apis-redline.md
  └── resources/                            ← 可引用资源
      ├── backend-checklist.md              ← 后端 13 项清单
      └── frontend-checklist.md             ← 前端 4 项清单
```

**文件移动映射：**

| 原路径 | 新路径 |
|--------|--------|
| `new-backend-module.md` | `backend/new-backend-module.md` |
| `pagination-query.md` | `backend/pagination-query.md` |
| `migration-guide.md` | `backend/migration-guide.md` |
| `new-frontend-page.md` | `frontend/new-frontend-page.md` |
| `component-reference.md` | `frontend/component-reference.md` |
| `styling-theming.md` | `frontend/styling-theming.md` |
| `permission-debugging.md` | `auth/permission-debugging.md` |
| `routing-auth.md` | `auth/routing-auth.md` |
| `multi-tenant.md` | `auth/multi-tenant.md` |
| `deployment.md` | `infra/deployment.md` |
| `error-diagnosis.md` | `infra/error-diagnosis.md` |
| `testing-guide.md` | `infra/testing-guide.md` |
| `project-structure.md` | `shared/project-structure.md` |
| `coding-conventions.md` | `shared/coding-conventions.md` |
| `apis-redline.md` | `shared/apis-redline.md` |

**新增文件：**

| 文件 | 来源 |
|------|------|
| `resources/backend-checklist.md` | 从 `new-backend-module.md` 的 13 项清单抽取 |
| `resources/frontend-checklist.md` | 从 `new-frontend-page.md` 的 4 项清单抽取 |

### 步骤 3：更新所有 `{{ref:}}` 引用

文件移动后，所有 `{{ref:xxx}}` 引用需要更新为含子目录路径的格式：

**SKILL.md 中的引用更新：**

| 旧引用 | 新引用 |
|--------|--------|
| `{{ref:new-backend-module}}` | `{{ref:backend/new-backend-module}}` |
| `{{ref:new-frontend-page}}` | `{{ref:frontend/new-frontend-page}}` |
| `{{ref:permission-debugging}}` | `{{ref:auth/permission-debugging}}` |
| `{{ref:styling-theming}}` | `{{ref:frontend/styling-theming}}` |
| `{{ref:routing-auth}}` | `{{ref:auth/routing-auth}}` |
| `{{ref:multi-tenant}}` | `{{ref:auth/multi-tenant}}` |
| `{{ref:deployment}}` | `{{ref:infra/deployment}}` |
| `{{ref:project-structure}}` | `{{ref:shared/project-structure}}` |
| `{{ref:component-reference}}` | `{{ref:frontend/component-reference}}` |
| `{{ref:coding-conventions}}` | `{{ref:shared/coding-conventions}}` |
| `{{ref:pagination-query}}` | `{{ref:backend/pagination-query}}` |
| `{{ref:testing-guide}}` | `{{ref:infra/testing-guide}}` |
| `{{ref:migration-guide}}` | `{{ref:backend/migration-guide}}` |
| `{{ref:error-diagnosis}}` | `{{ref:infra/error-diagnosis}}` |
| `{{ref:apis-redline}}` | `{{ref:shared/apis-redline}}` |

**子文档间的交叉引用更新：**

| 来源文件 | 旧引用 | 新引用 |
|---------|--------|--------|
| `backend/new-backend-module.md` | `{{ref:pagination-query}}` | `{{ref:backend/pagination-query}}` |
| `backend/new-backend-module.md` | `{{ref:permission-debugging}}` | `{{ref:auth/permission-debugging}}` |
| `frontend/new-frontend-page.md` | `{{ref:component-reference}}` | `{{ref:frontend/component-reference}}` |
| `frontend/new-frontend-page.md` | `{{ref:coding-conventions}}` | `{{ref:shared/coding-conventions}}` |
| `auth/routing-auth.md` | `{{ref:permission-debugging}}` | `{{ref:auth/permission-debugging}}` |
| `infra/error-diagnosis.md` | `{{ref:permission-debugging}}` | `{{ref:auth/permission-debugging}}` |
| `infra/error-diagnosis.md` | `{{ref:deployment}}` | `{{ref:infra/deployment}}` |
| `shared/project-structure.md` | `{{ref:apis-redline}}` | `{{ref:shared/apis-redline}}` |

**plopfile.ts 中的引用更新：**

| 旧引用 | 新引用 |
|--------|--------|
| `{{ref:new-backend-module}}` | `{{ref:backend/new-backend-module}}` |
| `{{ref:new-frontend-page}}` | `{{ref:frontend/new-frontend-page}}` |
| `{{ref:coding-conventions}}` | `{{ref:shared/coding-conventions}}` |

**SKILL.md 验证部分的引用更新：**

```markdown
- 后端任务：是否满足 {{ref:resources/backend-checklist}}？
- 前端任务：是否满足 {{ref:resources/frontend-checklist}}？
```

### 步骤 4：抽取清单为独立资源文件

**新建 `resources/backend-checklist.md`：**

```yaml
---
version: "1.0"
last_updated: "2026-04-26"
scope: backend
triggers:
  - 后端清单
  - 验证清单
  - 13项清单
dependencies:
  - backend/new-backend-module
maturity: stable
---
```

内容：从 `new-backend-module.md` 第 199-216 行的 13 项清单完整搬移，末尾添加反模式区块。

**新建 `resources/frontend-checklist.md`：**

```yaml
---
version: "1.0"
last_updated: "2026-04-26"
scope: frontend
triggers:
  - 前端清单
  - 验证清单
  - 4项清单
dependencies:
  - frontend/new-frontend-page
maturity: stable
---
```

内容：从 `new-frontend-page.md` 第 440-447 行的 4 项清单完整搬移，末尾添加反模式区块。

**修改原文件：**

- `backend/new-backend-module.md` — "## 新增后端模块清单（13 项）"章节替换为：`详见 {{ref:resources/backend-checklist}} — 后端模块 13 项清单`
- `frontend/new-frontend-page.md` — "## 新增前端页面清单（4 项）"章节替换为：`详见 {{ref:resources/frontend-checklist}} — 前端页面 4 项清单`

### 步骤 5：统一 Red Flags 格式

统一所有文件的反模式区块为 ✋ emoji + 列表格式：

```markdown
## 反模式（Red Flags）— 立即停止

- ✋ 违规描述 → 正确做法
- ✋ 违规描述 → 正确做法
```

**需修改的文件：**

| 文件 | 当前格式 | 需修改 |
|------|---------|--------|
| `shared/apis-redline.md` | 表格+列表混合 | ✅ 表格转列表 |
| `frontend/component-reference.md` | 列表 | 检查一致性 |
| `backend/new-backend-module.md` | 列表 | 检查一致性 |
| `frontend/new-frontend-page.md` | 列表 | 检查一致性 |
| `backend/pagination-query.md` | 列表 | 检查一致性 |
| `auth/permission-debugging.md` | 列表 | 检查一致性 |
| `auth/routing-auth.md` | 列表 | 检查一致性 |
| `auth/multi-tenant.md` | 列表 | 检查一致性 |
| `infra/deployment.md` | 列表 | 检查一致性 |
| `shared/project-structure.md` | 列表 | 检查一致性 |
| `shared/coding-conventions.md` | 列表 | 检查一致性 |
| `frontend/styling-theming.md` | 列表 | 检查一致性 |
| `backend/migration-guide.md` | 列表 | 检查一致性 |
| `infra/testing-guide.md` | 列表 | 检查一致性 |
| `infra/error-diagnosis.md` | 列表 | 检查一致性 |

**重点修改**：`shared/apis-redline.md` 的"常见违规场景与正确做法"表格需转为 ✋ 列表格式。

### 步骤 6：增强 error-diagnosis.md

将现有内容扩展为「症状→假设→验证→修复」决策树结构，覆盖 6 个核心症状：

1. **接口返回 401** — 假设：Token 过期/Token 缺失/JWT Secret 变更
2. **接口返回 403** — 假设：权限未分配/权限池未配置/permissionValue 不匹配
3. **菜单不显示** — 假设：权限菜单未加载/definePageConfig 缺失/order 排序问题
4. **前端构建类型错误** — 假设：APIs 未同步/导入路径错误/组件未导出
5. **API 生成失败** — 假设：后端未运行/Swagger 不可达/Controller 缺少 @ApiTags
6. **数据库连接失败** — 假设：MySQL 未运行/配置错误/端口占用

决策树格式：
```markdown
### 症状：XXX

**假设 1**：YYYY
→ 验证：具体操作步骤
→ 修复：具体解决方法
```

保留原有的检查清单章节和速查表格，在其后追加决策树章节。

### 步骤 7：更新 SKILL.md 入口路由表

SKILL.md 的任务路由表更新为按领域分组的结构：

```markdown
| 你要做什么 | 加载文件 |
|-----------|---------|
| **后端开发** | |
| 新增后端模块 / Service / Controller / Entity | {{ref:backend/new-backend-module}} |
| 分页查询 / WhereBuilder / SQL 构建 | {{ref:backend/pagination-query}} |
| 数据库迁移 / Entity 变更 / 种子数据 | {{ref:backend/migration-guide}} |
| **前端开发** | |
| 新增前端页面 / 组件 / 表单 | {{ref:frontend/new-frontend-page}} |
| 查阅组件 API / 属性 / 使用场景 | {{ref:frontend/component-reference}} |
| 调整样式 / 主题 / 暗色模式 / SCSS | {{ref:frontend/styling-theming}} |
| **认证与权限** | |
| 排查权限 / 认证 / Token / 登录问题 | {{ref:auth/permission-debugging}} |
| 配置路由 / 守卫 / 菜单 / 页面注册 | {{ref:auth/routing-auth}} |
| 多租户 / 应用类型 / 应用实例 / 成员管理 | {{ref:auth/multi-tenant}} |
| **基础设施** | |
| 部署 / Docker / 数据库 / 健康检查 | {{ref:infra/deployment}} |
| 错误排查 / 构建失败 / 启动失败 / API 生成失败 | {{ref:infra/error-diagnosis}} |
| 编写测试 / 单元测试 / 集成测试 | {{ref:infra/testing-guide}} |
| **共享规范** | |
| 查看项目整体结构 / 框架能力边界 | {{ref:shared/project-structure}} |
| 命名规范 / 注释规范 / 编码惯例 | {{ref:shared/coding-conventions}} |
| apis 目录红线规则 | {{ref:shared/apis-redline}} |
| **验证清单** | |
| 后端模块 13 项清单 | {{ref:resources/backend-checklist}} |
| 前端页面 4 项清单 | {{ref:resources/frontend-checklist}} |
```

### 步骤 8：更新 validate-skill-docs.ts

在步骤 1 的基础上（已支持子目录扫描和路径引用），新增以下检查：

**8a. Red Flags 格式一致性检查**

```typescript
function validateRedFlagsFormat(result: ValidationResult): void
```
- 递归扫描所有 .md 文件中包含 `## 反模式` 的区块
- 检查区块内是否使用 ✋ emoji 列表格式
- 检测表格格式，输出 warning

**8b. 清单文件存在性检查**

```typescript
function validateChecklistFiles(result: ValidationResult): void
```
- 检查 `resources/backend-checklist.md` 和 `resources/frontend-checklist.md` 存在
- 检查 SKILL.md 中包含对应引用

**8c. 重复内容检测**

```typescript
function validateDuplicateContent(result: ValidationResult): void
```
- 检测"apis/"红线相关文本在 3+ 个文件中出现
- 检测权限编码完整段落在 2+ 个文件中重复
- 输出 warning，提示应改为 `{{ref:}}` 引用

**8d. 目录结构规范性检查**

```typescript
function validateDirectoryStructure(result: ValidationResult): void
```
- 检查 `backend/`、`frontend/`、`auth/`、`infra/`、`shared/`、`resources/` 子目录存在
- 检查根目录下不存在散落的 .md 文件（除 SKILL.md 外）

### 步骤 9：运行验证

```bash
pnpm validate:skill
```

确认所有检查通过。

---

## 执行顺序依赖

```
步骤 1（升级 {{ref:}} 支持）
  → 步骤 2（目录重组，依赖步骤 1 的子目录扫描能力）
    → 步骤 3（更新引用，依赖步骤 2 的文件位置）
      → 步骤 4（抽取清单，依赖步骤 3 的引用格式）
        → 步骤 5（统一 Red Flags，可并行）
        → 步骤 6（增强 error-diagnosis，可并行）
        → 步骤 7（更新 SKILL.md，依赖步骤 3）
      → 步骤 8（更新验证脚本，依赖步骤 1-7 全部完成）
    → 步骤 9（运行验证，依赖步骤 8）
```
