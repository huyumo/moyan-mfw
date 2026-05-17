/**
 * @fileoverview 扩展包后端启动入口
 * @description 为扩展包提供统一的 NestJS 启动逻辑，封装路由前缀、CORS、Swagger。
 */
import { createBaseBackendApp } from './create-base-backend-app'

export interface CreateExtensionBackendAppOptions {
  name: string
  module: any
  entities?: any[]
  port?: number
}

export type { BaseBackendAppInstance as ExtensionBackendAppInstance } from './types/app-config.types'

function toPascalCase(str: string): string {
  return str.replace(/(^\w|-\w)/g, (c) => c.slice(-1).toUpperCase())
}

export async function createExtensionBackendApp(options: CreateExtensionBackendAppOptions) {
  const startTime = Date.now()
  const shortName = options.name
  const routePrefix = `/ext/${shortName}`
  const displayName = toPascalCase(shortName)

  console.log('\n' + '='.repeat(50))
  console.log(`[Extension] 🚀 启动扩展: ${displayName}`)
  console.log(`[Extension]    名称: ${shortName}`)
  console.log(`[Extension]    路由前缀: ${routePrefix}`)
  console.log(`[Extension]    模块: ${options.module?.name ?? 'unknown'}`)
  if (options.entities?.length) {
    console.log(`[Extension]    额外实体: ${options.entities.length} 个`)
  }
  console.log('='.repeat(50) + '\n')

  const swaggerGroup = {
    name: shortName,
    title: `${displayName} API`,
    description: '',
    include: [options.module],
  }

  try {
    const result = await createBaseBackendApp({
      name: options.name,
      modules: [options.module],
      moduleRoutes: [{ path: routePrefix, module: options.module }],
      extraEntities: options.entities || [],
      cors: true,
      syncAppTypes: false,
      swagger: [swaggerGroup],
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n[Extension] ✅ ${displayName} 启动完成 (${elapsed}s)`)
    console.log(`[Extension]    Swagger 文档: /api/swagger-${shortName}`)
    console.log(`[Extension]    API 路由: ${routePrefix}/*`)
    return result
  } catch (error) {
    console.error(`\n[Extension] ❌ ${displayName} 启动失败:`)
    console.error(error)
    throw error
  }
}
