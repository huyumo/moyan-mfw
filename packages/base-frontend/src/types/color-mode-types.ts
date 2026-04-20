export type ColorMode = 'light' | 'dark' | 'system';

export const COLOR_MODE_VALUES: ColorMode[] = ['light', 'dark', 'system'];

export function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && COLOR_MODE_VALUES.includes(value as ColorMode);
}