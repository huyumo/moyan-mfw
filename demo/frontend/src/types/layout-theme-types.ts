/**
 * @fileoverview 布局主题类型定义。
 */

/**
 * 主题令牌接口。
 */
export interface ThemeTokens {
  /** 应用背景色 */
  appBackground: string;
  /** 表面背景色 */
  surfaceBackground: string;
  /** 边框颜色 */
  borderColor: string;
  /** 文本颜色 */
  textColor: string;
  /** 次要文本颜色 */
  mutedTextColor: string;
  /** 主题主色 */
  primaryColor: string;
  /** 头部渐变背景 */
  headerGradient: string;
  /** 头部文本颜色 */
  headerTextColor: string;
  /** 卡片阴影 */
  cardShadow: string;
}

/**
 * 主题令牌调色板接口。
 */
export interface ThemeTokenPalette {
  light: ThemeTokens;
  dark: ThemeTokens;
}

/**
 * 主题令牌输入类型。
 */
export type ThemeTokenInput = ThemeTokens | ThemeTokenPalette;

/**
 * 主题包接口。
 */
export interface ThemePack {
  /** 主题显示标签 */
  label: string;
  /** 主题令牌 */
  tokens: ThemeTokenInput;
}

/**
 * 主题注册表类型。
 */
export type ThemeRegistry = Record<string, ThemePack>;

/**
 * 主题选项接口。
 */
export interface ThemeOption {
  /** 主题键名 */
  key: string;
  /** 主题显示标签 */
  label: string;
}
