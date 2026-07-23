## 修改文件：`packages/base/src/frontend/src/components/table/action-buttons/render.ts`

### 改动1：折叠按钮数 >= 2 时才显示"更多"

**问题：** 当 `maxVisible=2`，有3个按钮时，当前代码会显示2个可见 + 1个"更多"按钮，但"更多"下拉里只有1个按钮，显得多余。

**修复：** 调整折叠阈值，使"更多"按钮仅在隐藏按钮 >= 2 个时才出现。

- **第80行：** 将 `if (filteredByPermission.length <= maxVisible)` 改为 `if (filteredByPermission.length <= maxVisible + 1)`
- 效果：
  - 3个按钮, maxVisible=2 → 全部直接显示（不折叠）
  - 4个按钮, maxVisible=2 → 2个可见 + "更多"含2个隐藏
  - 5个按钮, maxVisible=2 → 2个可见 + "更多"含3个隐藏

### 改动2：移除"更多"按钮前面的图标

**问题：** "更多"按钮目前带有 `icon: More`（三个点图标），需要移除。

**修复：** 从 `renderMoreButton` 函数中删除 `icon: More`。

- **第59行：** 删除 `icon: More,`

### 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `packages/base/src/frontend/src/components/table/action-buttons/render.ts` | 第80行改条件；第59行删图标 |