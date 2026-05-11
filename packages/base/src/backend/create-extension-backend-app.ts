/**
 * @fileoverview 扩展包后端启动入口
 * @description 为扩展包提供统一的 NestJS 启动逻辑，封装 manifest 校验、CORS、Swagger。
 */
import { createBaseBackendApp } from './create-base-backend-app'

export interface ExtensionManifest {
  name: string
  version: string
  displayName: string
  description: string
  routePrefix: string
  permCodeNodes: Array<{
    permCode: string
    permName: string
    nodeType: string
    group: string
  }>
  requiredExtensions: string[]
  optionalExtensions: string[]
  appTypes: string[]
  minFrameworkVersion: string
  provides?: Record<string, unknown>
}

export interface CreateExtensionBackendAppOptions {
  manifest: ExtensionManifest
  name: string
  module: any
  entities?: any[]
  port?: number
}

export type { BaseBackendAppInstance as ExtensionBackendAppInstance } from './types/app-config.types'

function validateManifest(manifest: ExtensionManifest): void {
  const required = ['name', 'version', 'displayName', 'description', 'routePrefix', 'permCodeNodes'] as const
  for (const field of required) {
    if (!(manifest as any)[field]) {
      throw new Error(`[Extension] extension.json 缺少必填字段: ${field}`)
    }
  }

  if (!manifest.routePrefix.startsWith('/ext/')) {
    throw new Error(
      `[Extension] routePrefix 必须 /ext/{ns} 格式，当前: "${manifest.routePrefix}"`,
    )
  }

  const ns = manifest.routePrefix.replace('/ext/', '')
  for (const node of manifest.permCodeNodes) {
    if (!node.permCode || !node.permName) {
      throw new Error(`[Extension] permCodeNode 缺少 permCode 或 permName`)
    }
    if (!node.permCode.startsWith(`${ns}:`)) {
      throw new Error(
        `[Extension] permCode "${node.permCode}" 必须以命名空间 "${ns}:" 开头`,
      )
    }
  }

  console.log(`[Extension] ✅ ${manifest.displayName} v${manifest.version} 清单校验通过`)
}

export async function createExtensionBackendApp(
  options: CreateExtensionBackendAppOptions,
) {
  validateManifest(options.manifest)

  const shortName = options.manifest.name.replace('moyan-extension-', '')

  const swaggerGroup = {
    name: shortName,
    title: `${options.manifest.displayName} API`,
    description: options.manifest.description,
    include: [options.module],
  }

  const result = await createBaseBackendApp({
    name: options.name,
    modules: [options.module],
    extraEntities: options.entities || [],
    cors: true,
    syncAppTypes: false,
    swagger: [swaggerGroup],
  })

  return result
}
