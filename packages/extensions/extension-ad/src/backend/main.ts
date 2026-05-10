/**
 * @fileoverview 广告扩展包后端自启动入口
 * @description 独立运行扩展包后端，不依赖业务层
 */
import { createExtensionBackendApp } from 'moyan-base-backend'
import { AdModule, AdPlacementType, AdPlacement, Ad } from './index'
import extensionManifest from '../extension.json'

const bootstrap = async () => {
  const { app } = await createExtensionBackendApp({
    manifest: extensionManifest,
    name: '广告管理',
    module: AdModule,
    entities: [AdPlacementType, AdPlacement, Ad],
  })

  await app.listen(3002)
  console.log('[Extension-AD] 后端启动: http://localhost:3002')
}

bootstrap()
