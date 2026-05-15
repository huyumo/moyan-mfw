/**
 * @fileoverview 鏉冮檺甯搁噺瀹氫箟
 * @description 瀹氫箟鍏ㄥ眬鏉冮檺浣嶈繍绠楀父閲忓拰宸ュ叿鍑芥暟锛堟敮鎸佷唬鐮佹墿灞曪級
 */
/**
 * 榛樿鏉冮檺閰嶇疆锛堝熀纭€妗嗘灦鎻愪緵锟?
 * 杩欎簺鏉冮檺鍊煎湪 base-backend 锟?base-frontend 涓凡浣跨敤锛屼笉鍙锟?
 */
export declare const DEFAULT_PERMISSION_VALUES: readonly ["娣诲姞", "缂栬緫", "鍒犻櫎", "瀵煎嚭", "瀵煎叆"];
/**
 * 榛樿鏉冮檺鍚嶇О绫诲瀷锛堝瓧闈㈤噺锟?
 */
export type DefaultPermissionName = (typeof DEFAULT_PERMISSION_VALUES)[number];
/**
 * 鎵╁睍鏉冮檺閰嶇疆锛堝彲閫夛級
 * 涓氬姟椤圭洰鍙互娣诲姞鏇村鏉冮檺锛屽锟?瀹℃壒', '鎷掔粷', '鍙戝竷', '褰掓。'
 */
export declare const EXTENSION_PERMISSION_VALUES: readonly ["瀹℃壒", "鎷掔粷", "鍙戝竷", "褰掓。"];
/**
 * 鎵╁睍鏉冮檺鍚嶇О绫诲瀷锛堝瓧闈㈤噺锟?
 */
export type ExtensionPermissionName = (typeof EXTENSION_PERMISSION_VALUES)[number];
/**
 * 鍩虹鏉冮檺鍚嶇О绫诲瀷锛堥粯锟?+ 鎵╁睍锟?
 */
export type BasePermissionName = DefaultPermissionName | ExtensionPermissionName;
/**
 * 娉ㄥ唽涓氬姟鎵╁睍鏉冮檺锟?
 * @param values - 涓氬姟鑷畾涔夋潈闄愬€兼暟锟?
 *
 * @example
 * ```typescript
 * // 锟?backend/src/permissions.ts 涓皟锟?
 * registerPermissionValues(['涓婃灦', '鍙戣揣', '閫€锟?]);
 * ```
 */
export declare function registerPermissionValues(values: string[]): void;
/**
 * 鑾峰彇瀹屾暣鐨勬潈闄愬€煎垪锟?
 * @returns 鎵€鏈夋潈闄愬€硷紙榛樿 + 鎵╁睍 + 涓氬姟鑷畾涔夛級
 */
export declare function getPermissionValues(): readonly string[];
/**
 * 褰撳墠鐢熸晥鐨勬潈闄愬€煎垪锟?
 */
export declare const PERMISSION_VALUES: readonly string[];
/**
 * 鏉冮檺閰嶇疆鎺ュ彛
 */
export interface PermissionConfig {
    values: readonly string[];
}
/**
 * 鍏ㄥ眬鏉冮檺閰嶇疆瀵硅薄
 */
export declare const PERMISSION_CONFIG: PermissionConfig;
/**
 * 鏍规嵁鏉冮檺鍚嶇О鏁扮粍鏋勫缓浣嶈繍绠楁潈闄愶拷?
 * @param names - 鏉冮檺鍚嶇О鏁扮粍锛屽 ['娣诲姞', '缂栬緫']
 * @returns bigint 浣嶈繍绠楋拷?
 *
 * @example
 * ```typescript
 * buildPerValue(['娣诲姞']) // 1n
 * buildPerValue(['娣诲姞', '缂栬緫']) // 3n
 * buildPerValue(['娣诲姞', '鍒犻櫎']) // 5n
 * ```
 */
export declare function buildPerValue(names: string[]): bigint;
/**
 * 鏍规嵁鏉冮檺鍚嶇О鑾峰彇鍗曚釜鏉冮檺浣嶏拷?
 * @param name - 鏉冮檺鍚嶇О
 * @returns bigint 鍗曚釜鏉冮檺浣嶏拷?
 *
 * @example
 * ```typescript
 * getPermValue('娣诲姞') // 1n
 * getPermValue('缂栬緫') // 2n
 * ```
 */
export declare function getPermValue(name: string): bigint;
/**
 * 鏍规嵁浣嶈繍绠楀€艰В鏋愪负鏉冮檺鍚嶇О鏁扮粍
 * @param value - 浣嶈繍绠楋拷?
 * @returns 鏉冮檺鍚嶇О鏁扮粍
 *
 * @example
 * ```typescript
 * parsePerValue(3n) // ['娣诲姞', '缂栬緫']
 * parsePerValue(5n) // ['娣诲姞', '鍒犻櫎']
 * ```
 */
export declare function parsePerValue(value: bigint): string[];
/**
 * 妫€鏌ユ槸鍚﹀寘鍚寚瀹氭潈锟?
 * @param value - 浣嶈繍绠楋拷?
 * @param name - 鏉冮檺鍚嶇О
 * @returns boolean 鏄惁鍖呭惈
 *
 * @example
 * ```typescript
 * hasPermission(3n, '娣诲姞') // true
 * hasPermission(3n, '鍒犻櫎') // false
 * ```
 */
export declare function hasPermission(value: bigint, name: string): boolean;
/**
 * 鑾峰彇鎵€鏈夋潈闄愰€夐」锛堢敤锟?UI 灞曠ず锟?
 * @returns 鏉冮檺閫夐」鏁扮粍 {name, label, value}
 */
export declare function getPermissionOptions(): Array<{
    name: string;
    label: string;
    value: bigint;
}>;
export declare function initPermissionValueCache(values: Array<{
    name: string;
    bitValue: bigint | number | string;
}>): void;
export declare function getPermissionValueCache(): Map<string, bigint>;
