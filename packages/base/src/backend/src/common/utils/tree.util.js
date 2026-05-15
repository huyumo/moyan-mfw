"use strict";
/**
 * @fileoverview 树形结构工具函数
 * @description 提供通用的树形结构转换方法，适用于任何树形数据
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatToTree = flatToTree;
exports.treeToFlat = treeToFlat;
exports.findTreeNode = findTreeNode;
exports.getTreeNodeIds = getTreeNodeIds;
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
function flatToTree(flatData, options = {}) {
    const { rootParentId = null, keepParentId = true, keepEmptyChildren = true, childrenField = 'children', parentIdField = 'parentId', } = options;
    const nodeMap = new Map();
    const rootNodes = [];
    for (const item of flatData) {
        const node = { ...item };
        setProperty(node, childrenField, []);
        nodeMap.set(node.id, node);
    }
    for (const item of flatData) {
        const node = nodeMap.get(item.id);
        if (!node)
            continue;
        const parentId = getProperty(item, parentIdField) ?? rootParentId;
        if (parentId === rootParentId || parentId === undefined) {
            rootNodes.push(node);
        }
        else if (parentId !== null) {
            const parent = nodeMap.get(parentId);
            if (parent) {
                const parentChildren = getProperty(parent, childrenField);
                if (!parentChildren) {
                    setProperty(parent, childrenField, []);
                }
                const updatedChildren = getProperty(parent, childrenField);
                updatedChildren.push(node);
            }
            else {
                rootNodes.push(node);
            }
        }
        if (!keepParentId) {
            deleteProperty(node, parentIdField);
        }
    }
    if (!keepEmptyChildren) {
        const removeEmptyChildren = (nodes) => {
            for (const n of nodes) {
                const children = getProperty(n, childrenField);
                if (Array.isArray(children) && children.length === 0) {
                    deleteProperty(n, childrenField);
                }
                else if (Array.isArray(children)) {
                    removeEmptyChildren(children);
                }
            }
        };
        removeEmptyChildren(rootNodes);
    }
    return rootNodes;
}
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
function treeToFlat(treeData, options = {}) {
    const { keepChildren = false, childrenField = 'children' } = options;
    const result = [];
    function traverse(nodes) {
        for (const node of nodes) {
            const item = { ...node };
            if (!keepChildren) {
                deleteProperty(item, childrenField);
            }
            result.push(item);
            const children = getProperty(node, childrenField);
            if (children && Array.isArray(children)) {
                traverse(children);
            }
        }
    }
    traverse(treeData);
    return result;
}
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
function findTreeNode(treeData, nodeId, childrenField = 'children') {
    for (const node of treeData) {
        if (node.id === nodeId) {
            return node;
        }
        const children = getProperty(node, childrenField);
        if (children && Array.isArray(children)) {
            const found = findTreeNode(children, nodeId, childrenField);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}
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
function getTreeNodeIds(treeData, childrenField = 'children') {
    const ids = [];
    function traverse(nodes) {
        for (const node of nodes) {
            ids.push(node.id);
            const children = getProperty(node, childrenField);
            if (children && Array.isArray(children)) {
                traverse(children);
            }
        }
    }
    traverse(treeData);
    return ids;
}
function getProperty(obj, key) {
    return obj[key];
}
function setProperty(obj, key, value) {
    obj[key] = value;
}
function deleteProperty(obj, key) {
    delete obj[key];
}
//# sourceMappingURL=tree.util.js.map