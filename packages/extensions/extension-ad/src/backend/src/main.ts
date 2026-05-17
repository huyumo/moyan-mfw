/**
 * @fileoverview 广告管理扩展包后端独立启动入口
 */
import { NestFactory } from '@nestjs/core'
import { AdModule } from './ad.module'
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'

async function bootstrap() {
  const startTime = Date.now()

  console.log('[Ad] ====== Bootstrap Start ======')
  console.log(`[Ad] Node.js: ${process.version}`)
  console.log(`[Ad] ENV: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`[Ad] PORT: ${process.env.PORT ?? '3001 (default)'}`)

  try {
    const app = await createExtensionBackendApp({
      name: 'ad',
      module: AdModule,
    })

    const port = Number(process.env.PORT) || 3001
    await app.listen(port)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n[Ad] ✅ Server listening on http://localhost:${port} (${elapsed}s)`)
  } catch (error) {
    console.error('\n[Ad] ❌ Bootstrap failed:')
    console.error(error)
    process.exit(1)
  }
}

bootstrap()
