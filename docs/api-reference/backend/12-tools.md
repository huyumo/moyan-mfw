# 12 · 工具函数

## 目录

- [`hashPassword` / `verifyPassword`](#hashpassword-verifypassword) — 密码加密与验证
- [树形工具函数](#树形工具函数) — 暂未从顶层导出

---

## `hashPassword` / `verifyPassword`

基于 bcrypt 的密码工具。

```typescript
import { hashPassword, verifyPassword } from 'moyan-mfw-base/backend'
```

### `hashPassword(plain: string): Promise<string>`

对明文密码进行 bcrypt 哈希。

```typescript
const hashed = await hashPassword('myPassword123')
// → $2b$10$...
```

### `verifyPassword(plain: string, hash: string): Promise<boolean>`

校验明文密码与哈希值是否匹配。

```typescript
const isValid = await verifyPassword('myPassword123', hashed)
// → true
```

---

## 树形工具函数

以下函数位于 `common/utils/tree.util.ts`，但**当前未通过顶层 index.ts 导出**。如需使用，请直接从源码路径导入或在框架后续版本中关注导出情况：

| 函数 | 说明 |
|------|------|
| `flatToTree<T>(list, options?)` | 扁平数组转树形结构 |
| `treeToFlat<T>(tree, options?)` | 树形结构转扁平数组 |
| `findTreeNode<T>(tree, predicate)` | 在树中查找节点 |
| `getTreeNodeIds<T>(tree)` | 获取树中所有节点 ID |

相关类型：

```typescript
interface TreeNode {
  id: string
  parentId?: string | null
  children?: TreeNode[]
}

interface FlatToTreeOptions {
  idKey?: string        // 默认 'id'
  parentKey?: string    // 默认 'parentId'
  childrenKey?: string  // 默认 'children'
  rootParentId?: string | null  // 根节点 parentId 值
}
```
