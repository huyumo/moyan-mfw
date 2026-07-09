/**
 * @fileoverview 对象点分路径读写工具
 * @description 提供 `a.b.c` 形式路径到嵌套对象的 get/set/has 操作，供 MfwFormCard 等组件
 * 在 `formData = { a: { b: { c: '' } } }` 与 `key: 'a.b.c'` 之间做自动数据映射。
 * 不依赖任何第三方库；对单层（无 `.`）路径退化为普通属性访问，保持对扁平 key 的完全兼容。
 */

/**
 * 判断路径中某一段是否应作为数组索引
 * 仅纯数字字符串才视为数组索引（如 '0'、'3'），其余一律作为对象 key。
 */
const isArrayIndex = (segment: string): boolean => /^\d+$/.test(segment);

/**
 * 按 `.` 拆分路径
 * @example splitPath('a.b.c') // ['a','b','c']
 * @example splitPath('username') // ['username']
 */
const splitPath = (path: string): string[] => path.split('.');

/**
 * 按点分路径读取嵌套对象的值
 * 路径为空、或中途遇到 null/undefined 时返回 undefined。
 *
 * @example getValueByPath({ a: { b: { c: 1 } } }, 'a.b.c') // 1
 * @example getValueByPath({ username: 'foo' }, 'username') // 'foo'
 * @example getValueByPath({}, 'a.b.c') // undefined
 */
export function getValueByPath(obj: Record<string, any> | undefined, path: string): any {
  if (!obj || !path) {
    return undefined;
  }
  let current: any = obj;
  for (const segment of splitPath(path)) {
    if (current == null) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * 按点分路径写入嵌套对象的值
 * 中途缺失的层级会自动创建：若下一段 key 是纯数字则创建数组，否则创建普通对象。
 *
 * @example setValueByPath({}, 'a.b.c', 1) // { a: { b: { c: 1 } } }
 * @example setValueByPath({ list: [] }, 'list.0.name', 'x')
 *          // { list: [{ name: 'x' }] }
 * @example setValueByPath({ username: '' }, 'username', 'foo')
 *          // { username: 'foo' }
 */
export function setValueByPath(obj: Record<string, any>, path: string, value: any): void {
  if (!obj || !path) {
    return;
  }
  const segments = splitPath(path);
  const last = segments.pop()!;
  let current: any = obj;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1] ?? last;
    if (current[segment] == null) {
      current[segment] = isArrayIndex(nextSegment) ? [] : {};
    }
    current = current[segment];
  }
  current[last] = value;
}

/**
 * 判断点分路径对应的 key 是否在对象中已存在
 * 用于初始化默认值时判断是否已存在该字段，替代 `key in obj`。
 *
 * @example hasKeyByPath({ a: { b: 1 } }, 'a.b') // true
 * @example hasKeyByPath({ a: {} }, 'a.b') // false
 * @example hasKeyByPath({ username: '' }, 'username') // true
 */
export function hasKeyByPath(obj: Record<string, any> | undefined, path: string): boolean {
  if (!obj || !path) {
    return false;
  }
  const segments = splitPath(path);
  let current: any = obj;
  for (let i = 0; i < segments.length; i++) {
    if (current == null || typeof current !== 'object') {
      return false;
    }
    const segment = segments[i];
    if (!(segment in current)) {
      return false;
    }
    current = current[segment];
  }
  return true;
}
