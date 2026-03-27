import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Mermaid 组件由 vitepress-plugin-mermaid 自动注入
  }
} satisfies Theme
