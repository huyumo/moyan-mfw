/**
 * @fileoverview 广告扩展包后端自启动入口
 * @description 独立运行扩展包后端，不依赖业务层
 */
import 'reflect-metadata'
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'
import { AdModule, AdPlacement, Ad } from './index'

async function bootstrap() {
  const result = await createExtensionBackendApp({
    name: '广告管理',
    module: AdModule,
    entities: [AdPlacement, Ad],
    manifest: {
      name: 'moyan-mfw-extension-ad',
      version: '0.1.0',
      displayName: '广告管理',
      description: '提供广告位管理功能，支持在广告位详情中管理广告内容',
      routePrefix: '/ext/ad',
      permCodeNodes: [
        { permCode: 'ad:placement:view',   permName: '查看广告位',   nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:placement:create', permName: '创建广告位',   nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:placement:update', permName: '编辑广告位',   nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:placement:delete', permName: '删除广告位',   nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:content:view',     permName: '查看广告内容', nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:content:create',   permName: '创建广告内容', nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:content:update',   permName: '编辑广告内容',   nodeType: 'TAG', group: '广告管理' },
        { permCode: 'ad:content:delete',   permName: '删除广告内容',   nodeType: 'TAG', group: '广告管理' },
      ],
      requiredExtensions: [],
      optionalExtensions: [],
      appTypes: ['*'],
      minFrameworkVersion: '1.0.0',
    },
  })

  await result.listen(3002)
}

bootstrap()
