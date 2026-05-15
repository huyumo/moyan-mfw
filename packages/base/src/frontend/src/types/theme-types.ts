export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  gradient?: string;
}

export interface ThemePackage {
  name: string;
  label: string;
  colors: ThemeColors;
  description?: string;
  author?: string;
  version?: string;
}

export interface ThemeRegistry {
  [key: string]: ThemePackage;
}

export function isThemePackage(value: unknown): value is ThemePackage {
  if (typeof value !== 'object' || value === null) return false;
  const pkg = value as Record<string, unknown>;
  return (
    typeof pkg.name === 'string' &&
    typeof pkg.label === 'string' &&
    typeof pkg.colors === 'object'
  );
}