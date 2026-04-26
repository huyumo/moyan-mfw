# mfw-guide Skill 评估报告

> 评估日期：2026-04-26
> 评估范围：`.trae/skills/mfw-guide/` 全部 16 个文件（1 SKILL.md + 15 子文档）

---

## 一、多维度评估

### 1. 组织结构 ⭐⭐⭐⭐ (4/5)

**架构设计**：采用「入口路由 + 专题文档」两层级架构。

**优点：**
- SKILL.md 承担「路由表 + 红线 + 验证清单 + 经验速查」四重角色，Agent 无需加载全部文档即可快速定位
- 按关注点拆分，粒度恰当（如 pagination-query.md 仅讲分页）
- 每个文件的 frontmatter 声明了 dependencies，理论上可实现增量加载

**不足：**
- dependencies 字段仅为文档性质，Skill 加载机制不会自动按依赖链拉取
- 缺少版本协调策略，多文件同步更新时难以追踪一致性
- scope 分类粒度不统一（shared/backend/frontend/auth/infra 五种，auth 和 infra 仅各出现一次）

### 2. 实用性 ⭐⭐⭐⭐½ (4.5/5)

| 场景 | 覆盖度 | 说明 |
|------|--------|------|
| 新增后端 CRUD 模块 | ★★★★★ | 13 项清单 + 完整代码模板 + 权限编码 + 异常使用表 |
| 新增前端列表页 | ★★★★★ | 完整 MfwListPage/MfwFormCard/MfwPopup 模板 + 4 项清单 |
| 分页查询实现 | ★★★★★ | PaginationX + WhereBuilder 完整 API + 条件分组示例 |
| 权限/认证排查 | ★★★★☆ | 链路完整，但缺少实际调试命令 |
| 样式/主题开发 | ★★★★☆ | 9 套主题色值表 + BEM 规范，缺复杂布局案例 |
| 错误诊断 | ★★★☆☆ | 偏检查清单，缺决策树 |
| 数据库迁移 | ★★★★☆ | 流程完整，缺端到端示例 |

**最大亮点**：模板代码"可复制性"极高，几乎可直接粘贴后替换业务字段即用。

**经验教训速查**（SKILL.md 底部 8 条）是实战中反复踩坑的总结，AI Agent 最缺乏、最无法自行推导的知识。

### 3. 收益 ⭐⭐⭐⭐⭐ (5/5)

- **代码一致性保障**：显式的「反模式」+「清单」双保险，将隐含团队约定转化为可执行检查项
- **降低人机协作成本**：持久化知识库，实现「一次编写，持续生效」
- **新人上手加速**：13 项后端清单、4 项前端清单比任何 README 都更具操作性
- **红线防御**：三条红线 + apis-redline.md 的"违规 vs 正确"对照表，防止最高频错误

### 4. 弊端 ⭐⭐⭐ (3/5)

- **维护滞后风险（最大弊端）**：Skill 文档与代码库是两个独立信息源，代码重构后文档可能未更新
- **信息过载**：16 个文件 3500+ 行，全量加载占用大量 context window
- **过度约束**：模板过于具体 + "立即停止"措辞极强，可能抑制合理变通
- **重复内容**：apis/ 红线在 5 个文件中重复；权限编码在 3 个文件重复；MfwPopup 示例在 2 个文件重复

### 5. 标准化 ⭐⭐⭐⭐ (4/5)

- frontmatter 元数据规范统一
- "反模式 — 立即停止" 是标志性设计模式
- 但 Red Flags 格式不一致（表格 vs 列表），代码模板标注方式也不统一

**综合评分：4.1 / 5**

---

## 二、与 scripts/generators 的关系

### 关系定义：参数收集器 ↔ 知识库管道

```
plop 收集参数 → 拼装生成指令 → 指令中引用 {{ref:new-backend-module}} → AI Agent 读取 Skill 文档 → 生成代码
```

| plop 生成器 | 引用的 Skill 文档 | 关系 |
|------------|-----------------|------|
| backend-module | `{{ref:new-backend-module}}` | plop 输出元数据 + 引用 13 项清单 |
| frontend-page | `{{ref:new-frontend-page}}` | plop 输出元数据 + 引用 4 项清单 |
| frontend-component | `{{ref:coding-conventions}}` | plop 输出元数据 + 引用编码规范 |

### plop 在 scripts/ 的原因

1. 由 `pnpm gen:xxx` 调用——项目级命令，开发者直接使用
2. plop 是项目依赖——devDependencies 声明了 `plop: ^4.0.5`
3. 需要独立于 Skill 运行——即使不用 AI Agent，开发者也可跑 plop 看生成指令

### 死代码发现

`scripts/generators/helpers/` 下 3 个文件（kebab-case.ts、pascal-case.ts、permission-code.ts）未被 plopfile.ts 导入使用——plopfile.ts 在内部自行定义了 pascalCase/camelCase/upperCase helper。

---

## 三、目录结构优化方案

### 原建议（已确认不可行）

```
.trae/skills/mfw-guide/
  ├── docs/backend/new-backend-module.md   ← 子目录分组
  ├── docs/frontend/new-frontend-page.md   ← 子目录分组
  └── resources/templates/                  ← 模板资源
```

**不可行原因**：`{{ref:}}` 正则 `\w[\w-]*` 不匹配 `/`，validate-skill-docs.ts 仅做根目录 `readdirSync`，Trae IDE Skill 加载器可能也仅扫描根目录。

### 调整后方案（可行）

- 保持 `.md` 文件扁平，维持 `{{ref:}}` 兼容性
- 抽取清单为独立 `.md` 文件（backend-checklist.md、frontend-checklist.md）
- 通过 SKILL.md 路由表和文件命名约定实现逻辑分组
- 延期子目录分组，待 Trae 支持递归扫描后实施

---

## 四、`{{ref:}}` 机制技术约束

| 项目 | 详情 |
|------|------|
| 正则 | `/\{\{ref:(\w[\w-]*)\}\}/g` — 不匹配 `/` |
| 扫描范围 | `fs.readdirSync(SKILL_DIR)` — 仅根目录，非递归 |
| 映射方式 | `refName` → `refName.md` 同目录文件 |
| 当前引用 | 全部 26 处均为扁平文件名 |
| plop 中的使用 | 作为输出文本提示，plop 本身不做 `{{ref:}}` 解析 |
