import DefaultTheme from 'vitepress/theme'
import mermaid from 'mermaid'

mermaid.initialize({
  securityLevel: 'loose',
  startOnLoad: true,
  theme: 'default',
})

export default {
  extends: DefaultTheme,
  async enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      const runMermaid = async () => {
        // 等待 Shiki 代码高亮完成
        await new Promise(resolve => setTimeout(resolve, 100))

        const elements = document.querySelectorAll('.language-mermaid pre code')
        elements.forEach((el) => {
          const code = el.textContent.replace(/\n$/, '')
          const container = document.createElement('div')
          container.className = 'mermaid'
          container.textContent = code

          // 替换整个 language-mermaid 容器
          const parent = el.closest('.language-mermaid')
          if (parent) {
            parent.replaceWith(container)
          }
        })

        try {
          await mermaid.run()
        } catch (e) {
          console.error('Mermaid error:', e)
        }
      }

      router.onAfterRouteChanged = runMermaid
      setTimeout(runMermaid, 100)
    }
  },
}
