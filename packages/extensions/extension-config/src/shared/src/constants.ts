/**
 * @fileoverview 配置管理共享常量
 */

/**
 * 配置类型枚举
 * @description 0=公共（无需认证可访问），1=私有（需管理员权限）
 */
export enum ConfigType {
  PUBLIC = 0,
  PRIVATE = 1,
}
