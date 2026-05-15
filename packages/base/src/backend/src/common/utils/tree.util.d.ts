/**
 * @fileoverview 树形结构工具函数
 * @description 提供通用的树形结构转换方法，适用于任何树形数据
 */
/**
 * 树节点接口
 * @description 通用树节点结构，包含 id、parentId 和 children 属性
 */
export interface TreeNode<T = any> {
    id: string | number;
    parentId?: string | number | null;
    children?: T[];
}
/**
 * 扩展的树节点接口，支持动态属性访问
 */
export interface ExtendedTreeNode<T = any> extends TreeNode<T> {
    [key: string]: unknown;
}
/**
 * 平面数据转树形结构配置
 * @description 定义平面转树的配置选项
 */
export interface FlatToTreeOptions {
    /** 根节点的 parentId 值，默认为 null */
    rootParentId?: string | number | null;
    /** 是否保留原始数据中的 parentId 字段，默认为 true */
    keepParentId?: boolean;
    /** 是否保留空 children 字段，默认为 true */
    keepEmptyChildren?: boolean;
    /** 自定义子节点字段名，默认为 'children' */
    childrenField?: string;
    /** 自定义父节点 ID 字段名，默认为 'parentId' */
    parentIdField?: string;
}
/**
 * 树形结构转平面数据配置
 * @description 定义树转平面的配置选项
 */
export interface TreeToFlatOptions {
    /** 是否保留 children 字段，默认为 false */
    keepChildren?: boolean;
    /** 自定义子节点字段名，默认为 'children' */
    childrenField?: string;
}
/**
 * 平面数据转树形结构
 * @param flatData - 平面数据数组
 * @param options - 转换配置选项
 * @returns 树形结构数组
 *
 * @example
 * ```typescript
 * const flatData = [
 *   { id: 1, name: 'Root', parentId: null },
 *   { id: 2, name: 'Child 1', parentId: 1 },
 *   { id: 3, name: 'Child 2', parentId: 1 },
 *   { id: 4, name: 'Grandchild', parentId: 2 }
 * ];
 *
 * const tree = flatToTree(flatData);
 * // 结果:
 * // [
 * //   {
 * //     id: 1,
 * //     name: 'Root',
 * //     parentId: null,
 * //     children: [
 * //       { id: 2, name: 'Child 1', parentId: 1, children: [...] },
 * //       { id: 3, name: 'Child 2', parentId: 1, children: [] }
 * //     ]
 * //   }
 * // ]
 * ```
 */
export declare function flatToTree<T extends ExtendedTreeNode>(flatData: T[], options?: FlatToTreeOptions): T[];
/**
 * 树形结构转平面数据
 * @param treeData - 树形结构数组
 * @param options - 转换配置选项
 * @returns 平面数据数组
 *
 * @example
 * ```typescript
 * const tree = [
 *   {
 *     id: 1,
 *     name: 'Root',
 *     children: [
 *       { id: 2, name: 'Child 1', children: [] },
 *       { id: 3, name: 'Child 2', children: [] }
 *     ]
 *   }
 * ];
 *
 * const flatData = treeToFlat(tree);
 * // 结果:
 * // [
 * //   { id: 1, name: 'Root' },
 * //   { id: 2, name: 'Child 1' },
 * //   { id: 3, name: 'Child 2' }
 * // ]
 * ```
 */
export declare function treeToFlat<T extends ExtendedTreeNode>(treeData: T[], options?: TreeToFlatOptions): T[];
/**
 * 在树中查找节点
 * @param treeData - 树形结构数组
 * @param nodeId - 要查找的节点 ID
 * @param childrenField - 子节点字段名，默认为 'children'
 * @returns 找到的节点，未找到返回 undefined
 *
 * @example
 * ```typescript
 * const tree = [{ id: 1, children: [{ id: 2, children: [] }] }];
 * const node = findTreeNode(tree, 2);
 * // 结果: { id: 2, children: [] }
 * ```
 */
export declare function findTreeNode<T extends ExtendedTreeNode>(treeData: T[], nodeId: string | number, childrenField?: string): T | undefined;
/**
 * 获取树中所有节点的 ID
 * @param treeData - 树形结构数组
 * @param childrenField - 子节点字段名，默认为 'children'
 * @returns 所有节点的 ID 数组
 *
 * @example
 * ```typescript
 * const tree = [{ id: 1, children: [{ id: 2, children: [] }] }];
 * const ids = getTreeNodeIds(tree);
 * // // 结果: [1, 2]
 * ```
 */
export declare function getTreeNodeIds<T extends ExtendedTreeNode>(treeData: T[], childrenField?: string): (string | number)[];
