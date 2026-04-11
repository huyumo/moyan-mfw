# Harness 提取报告

**日期**: 2026-04-11  
**状态**: ✅ 提取完成

---

## 一、提取背景

用户要求：将 `.claude\harness` 提取到独立项目 `E:\Moyan\moyan\moyan-mfw-workspace\workspace04\harness`，使其成为不针对特定项目的通用型 Hooks 系统。

---

## 二、清理工作

### 2.1 code-quality-gate.ts

**问题**：硬编码了 `nongqing`, `nongqing-backend` 等项目特定目录名。

**修复**：
- 新增 `detectSubProjects()` 函数，动态检测子项目
- 自动识别 TypeScript 和 Vue 项目能力
- 动态构建自测报告路径、E2E 测试目录、源代码扫描目录

### 2.2 settings.json

**问题**：所有 hook 命令使用绝对路径 `e:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw/.claude/harness`。

**修复**：改为相对路径 `cd .claude/harness && pnpm run ...`

### 2.3 文档清理

| 文件 | 修复内容 |
|------|---------|
| `docs/FAQ.md` | 移除示例绝对路径 |
| `docs/INIT-GUIDE.md` | 移除示例绝对路径 |
| `TEST-FLOW.md` | 移除示例绝对路径 |
| `docs/requirement-analysis-improvement.md` | 移除示例绝对路径 |

---

## 三、新增配置模板

### examples/ 目录

```
examples/
├── config.example.json      # Harness 主配置模板
├── team.example.json        # 团队配置模板
└── settings.example.json    # settings.json 模板
```

所有模板文件使用通用占位符：
- `"name": "Your Project Harness"`
- `"name": "Your Project Team"`
- 路径使用相对路径 `.claude/harness`

---

## 四、独立项目结构

```
E:\Moyan\moyan\moyan-mfw-workspace\workspace04\harness\
├── README.md                 # 通用使用说明（已更新）
├── package.json              # NPM 包配置（已更新）
├── tsconfig.json
├── .gitignore
├── config.json               # 主配置（保留当前项目配置）
├── team.json                 # 团队配置（保留当前项目配置）
├── start.bat, start.sh
├── examples/                 # 配置模板（新增）
│   ├── config.example.json
│   ├── team.example.json
│   └── settings.example.json
├── hooks/                    # Hook 脚本（已通用化）
├── scripts/                  # 工具脚本
├── templates/                # 模板文件
├── docs/                     # 文档（已清理）
└── utils/                    # 工具函数
```

**排除目录**：
- `node_modules/` - 运行时依赖，新项目独立安装
- `output/` - 运行时输出，不复制

---

## 五、新项目使用流程

### 步骤 1: 复制 harness

```bash
# 从独立项目目录复制
xcopy /E /I harness\.claude new-project\.claude

# 或从当前项目复制
xcopy /E /I moyan-mfw\.claude\harness new-project\.claude\harness
```

### 步骤 2: 配置项目

```bash
cd new-project\.claude\harness

# 复制配置模板
copy examples\config.example.json config.json
copy examples\team.example.json team.json
copy examples\settings.example.json ..\..\settings.json

# 编辑配置文件，修改项目名称和团队成员
```

### 步骤 3: 运行初始化

```bash
cd scripts
.\init-project.bat
```

### 步骤 4: 安装依赖

```bash
cd ..
pnpm install
```

### 步骤 5: 验证安装

```bash
pnpm start
```

---

## 六、文件清单

| 文件/目录 | 状态 | 说明 |
|-----------|------|------|
| `README.md` | ✅ 已更新 | 通用使用说明 |
| `package.json` | ✅ 已更新 | NPM 包配置，添加 keywords |
| `examples/` | ✅ 新增 | 配置模板目录 |
| `hooks/code-quality-gate.ts` | ✅ 已通用化 | 移除项目特定硬编码 |
| `docs/*.md` | ✅ 已清理 | 移除项目特定路径 |
| `TEST-FLOW.md` | ✅ 已清理 | 移除项目特定路径 |

---

## 七、验证结果

### 当前项目（moyan-mfw）验证

```bash
# 运行 hooks 验证
cd .claude/harness
pnpm start

# 预期：身份报告和会话开始检查通过
```

### 独立项目（harness）验证

```bash
# 进入独立项目
cd E:\Moyan\moyan\moyan-mfw-workspace\workspace04\harness

# 安装依赖
pnpm install

# 运行 hooks 验证（需要 TASK.md 存在）
pnpm start
```

---

## 八、后续建议

### 立即可用
- ✅ 当前项目 moyan-mfw 可继续使用 harness
- ✅ 独立项目 harness 可作为模板复制到其他项目

### 改进建议
1. 为 harness 添加单元测试
2. 将 harness 发布为 NPM 包（可选）
3. 添加更多配置示例（前端项目、后端项目、全栈项目）

---

## 九、总结

**提取状态**: ✅ 完成

**清理项**:
- ✅ code-quality-gate.ts 项目特定硬编码
- ✅ settings.json 绝对路径
- ✅ 文档中的项目特定路径

**新增项**:
- ✅ examples/ 配置模板目录
- ✅ 通用 README.md
- ✅ 更新 package.json 为 NPM 包格式

**可用性**:
- ✅ 当前项目 moyan-mfw 可继续使用
- ✅ 新项目可复制 harness 模板使用
- ✅ Harness 已成为通用型 Hooks 系统

---

**报告生成时间**: 2026-04-11  
**执行团队**: PM-Agent, Dev-Agent
