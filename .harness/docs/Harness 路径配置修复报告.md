# Harness 路径配置修复报告

**修复日期**: 2026-04-11  
**修复状态**: ✅ 完成  
**修复人员**: 技术负责人

---

## 问题概述

Harness hooks 中存在路径配置不一致的问题，导致 hooks 无法正确加载项目配置文件。

---

## 发现的问题

### P1 - 路径不一致

**问题描述**: `paths.json` 中定义的路径是 `.harness/config/xxx.json`，但多个 hooks 中使用的是 `.claude/harness/config/xxx.json`。

**受影响的文件**:

| 文件 | 硬编码的错误路径 |
|------|-----------------|
| `docs-template-hook.ts` | `.claude/harness/config/docs.json` |
| `backend-security-hook.ts` | `.claude/harness/config/backend.json` |
| `frontend-guidelines-hook.ts` | `.claude/harness/config/frontend.json` |
| `architect-context-hook.ts` | `.claude/harness/config/tech-stack.json` |
| `review-checklist-hook.ts` | `.claude/harness/config/review.json` |
| `paths.ts` (默认配置) | `.claude/harness/config/*.json` |

**正确的路径** (来自 `paths.json`):

```json
{
  "input": {
    "config": {
      "docs": ".harness/config/docs.json",
      "backend": ".harness/config/backend.json",
      "frontend": ".harness/config/frontend.json",
      "techStack": ".harness/config/tech-stack.json",
      "review": ".harness/config/review.json"
    }
  }
}
```

---

## 修复内容

### 1. 修复 `utils/paths.ts`

**修改内容**:
- `loadPathsConfig()`: 从 `.claude/harness/config/paths.json` → `.harness/config/paths.json`
- `getDefaultPathsConfig()`: 所有默认路径从 `.claude/harness/config/*` → `.harness/config/*`

### 2. 修复 Hooks

所有受影响的 hooks 统一修改为：
1. 导入 `findProjectRoot` 和 `loadPathsConfig` 从 `../utils/paths`
2. 删除本地重复的 `findProjectRoot()` 函数
3. `loadConfig()` 函数改为使用 `loadPathsConfig()` 获取路径

**修复的 hooks**:
- `hooks/docs-template-hook.ts`
- `hooks/backend-security-hook.ts`
- `hooks/frontend-guidelines-hook.ts`
- `hooks/architect-context-hook.ts`
- `hooks/review-checklist-hook.ts`

---

## 修复验证

### TypeScript 检查

```bash
pnpm exec tsc --noEmit hooks/*.ts
# ✅ 无错误
```

### Hook 执行测试

| Hook | 修复前 | 修复后 | 状态 |
|------|--------|--------|------|
| hook:docs-template | ❌ 无法加载配置 | ✅ 加载 `.harness/config/docs.example.json` | ✅ |
| hook:backend-security | ❌ 无法加载配置 | ✅ 加载 `.harness/config/backend.example.json` | ✅ |
| hook:frontend-guidelines | ❌ 无法加载配置 | ✅ 加载 `.harness/config/frontend.example.json` | ✅ |
| hook:architect-context | ❌ 无法加载配置 | ✅ 加载 `.harness/config/tech-stack.example.json` | ✅ |
| hook:review-checklist | ❌ 无法加载配置 | ✅ 加载 `.harness/config/review.example.json` | ✅ |

---

## 修复后的代码示例

### 修复前的 `loadConfig` 函数

```typescript
function loadConfig(projectRoot: string): { config: any | null; path: string | null } {
  const configPaths = [
    path.join(projectRoot, '.claude', 'harness', 'config', 'backend.json'),
    path.join(projectRoot, '.claude', 'harness', 'config', 'backend.example.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return { config: JSON.parse(content), path: configPath };
      } catch (e) {
        continue;
      }
    }
  }

  return { config: null, path: null };
}
```

### 修复后的 `loadConfig` 函数

```typescript
import { findProjectRoot, loadPathsConfig } from '../utils/paths';

function loadConfig(projectRoot: string): { config: any | null; path: string | null } {
  const paths = loadPathsConfig(projectRoot);
  const configPath = paths.input.config.backend;

  // 检查项目特定配置
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return { config: JSON.parse(content), path: configPath };
    } catch (e) {
      // 继续尝试示例配置
    }
  }

  // 尝试示例配置
  const exampleConfigPath = configPath.replace('.json', '.example.json');
  if (fs.existsSync(exampleConfigPath)) {
    try {
      const content = fs.readFileSync(exampleConfigPath, 'utf-8');
      return { config: JSON.parse(content), path: exampleConfigPath };
    } catch (e) {
      // 继续
    }
  }

  return { config: null, path: null };
}
```

---

## 影响范围

### 正面影响
- ✅ 所有 hooks 现在使用统一的路径配置源 (`paths.json`)
- ✅ 未来只需修改 `paths.json` 即可调整所有路径
- ✅ 消除了硬编码路径，提高了可维护性

### 潜在影响
- ⚠️ 如果其他项目使用 `.claude/harness/config/` 路径，需要迁移到 `.harness/config/`
- ⚠️ 建议检查其他未修复的 hooks 是否存在类似问题

---

## 后续建议

1. **创建项目特定配置**: 根据需要创建 `.harness/config/*.json` 文件定义项目特定规范
2. **检查其他 hooks**: 审查其他 hooks 是否存在类似的硬编码路径问题
3. **更新文档**: 更新 Harness 文档，说明正确的路径配置

---

**修复人员**: 技术负责人  
**修复时间**: 2026-04-11T16:30:00Z
