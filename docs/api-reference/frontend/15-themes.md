# 15 · 主题系统

MFW 内置 9 套主题包，通过 CSS 变量实现全局换肤。

```typescript
import {
  themeRegistry,        // 主题注册表
  defaultThemeKey,      // 默认主题键：'default'
  getTheme,             // 根据名称获取主题
  getAvailableThemes,   // 获取所有主题列表
} from 'moyan-mfw-base/frontend'
```

---

## 内置主题

| 键名 | 名称 |
|------|------|
| `default` | 默认主题 |
| `ocean` | 海洋蓝 |
| `graphite` | 石墨灰 |
| `fintech` | 金融科技 |
| `tech` | 科技感 |
| `luxury` | 奢华金 |
| `nature` | 自然绿 |
| `aurora` | 极光 |
| `sunset` | 日落橙 |

---

## API

### `getTheme(name: string)`

根据名称获取主题配置。找不到时回退 `default`。

```typescript
const theme = getTheme('ocean')
// → 返回 ThemeColors 对象，包含 primary、success、warning、danger 等色阶
```

### `getAvailableThemes()`

返回所有可用主题数组。

```typescript
const themes = getAvailableThemes()
// → ThemeColors[]
```

### `themeRegistry`

主题注册表，`Record<string, ThemeManifest>`。

```typescript
const defaultTheme = themeRegistry.default
```

---

## 切换主题

```typescript
import { useLayoutStore } from 'moyan-mfw-base/frontend'

const layoutStore = useLayoutStore()
layoutStore.setTheme('ocean')
```
