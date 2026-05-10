# moyan-extension-ad

## 概述

MFW 广告管理扩展包，提供完整的广告投放管理能力：广告位类型配置、广告位管理、广告内容管理。

支持三种跳转方式：

| 跳转方式 | 标识 | 说明 |
|---------|------|------|
| 小程序跳转 | `miniapp` | 配置 AppId + 路径，跳转到微信/支付宝小程序 |
| App 内部跳转 | `internal` | 配置内部路由路径，在 App 内打开指定页面 |
| 外部链接跳转 | `external` | 配置 HTTP/HTTPS 链接，通过系统浏览器打开 |

## 安装

```bash
pnpm add moyan-extension-ad
```

## 配置

### 注册扩展包模块

```typescript
// backend/src/main.ts
import { AdModule } from 'moyan-extension-ad/backend'
import { AdPlacementType, AdPlacement, Ad } from 'moyan-extension-ad/backend'

createBaseBackendApp({
  modules: [AdModule],
  entities: [AdPlacementType, AdPlacement, Ad],
})
```

### 分配权限位值

在 `backend/src/permissions.config.ts` 中为广告管理的权限节点分配位值：

```typescript
export const permissionValueMap = {
  // 广告管理扩展包
  'ad:placement:view':   0x0100_0001n,
  'ad:placement:create': 0x0100_0002n,
  'ad:placement:update': 0x0100_0004n,
  'ad:placement:delete': 0x0100_0008n,
  'ad:type:view':        0x0100_0010n,
  'ad:type:create':      0x0100_0020n,
  'ad:type:update':      0x0100_0040n,
  'ad:type:delete':      0x0100_0080n,
  'ad:content:view':     0x0100_0100n,
  'ad:content:create':   0x0100_0200n,
  'ad:content:update':   0x0100_0400n,
  'ad:content:delete':   0x0100_0800n,
}
```

### 注册前端路由

```typescript
// frontend/src/main.ts
import { adRoutes } from 'moyan-extension-ad/frontend'

createBaseAdminApp({
  extraRoutes: [...adRoutes],
})
```

## 数据模型

### 广告位类型配置 (ext_ad_placement_types)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar(64) | 类型名称 |
| code | varchar(64) | 类型编码（唯一） |
| width | int | 宽度(px) |
| height | int | 高度(px) |
| description | varchar(255) | 描述 |
| status | tinyint | 状态 (1=启用 0=禁用) |
| sortOrder | int | 排序号 |

### 广告位 (ext_ad_placements)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar(64) | 广告位名称 |
| code | varchar(64) | 广告位编码（唯一） |
| placementTypeId | uuid | 广告位类型 ID（FK） |
| description | varchar(255) | 描述 |
| status | tinyint | 状态 |
| sortOrder | int | 排序号 |

### 广告内容 (ext_ad_contents)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| placementId | uuid | 所属广告位 ID（FK） |
| title | varchar(128) | 广告标题 |
| imageUrl | varchar(500) | 广告图片 URL |
| linkType | varchar(32) | 跳转类型: miniapp / internal / external |
| linkUrl | varchar(500) | 跳转链接（linkType=external 时） |
| miniAppId | varchar(255) | 小程序 AppId（linkType=miniapp 时） |
| miniAppPath | varchar(255) | 小程序路径（linkType=miniapp 时） |
| internalRoute | varchar(255) | App 内部路由（linkType=internal 时） |
| startTime | datetime | 投放开始时间 |
| endTime | datetime | 投放结束时间 |
| status | tinyint | 状态 |
| sortOrder | int | 排序号 |

## 权限节点

| permCode | 名称 | 类型 | 说明 |
|----------|------|------|------|
| `ad:placement:view` | 查看广告位 | TAG | 查看广告位列表和详情 |
| `ad:placement:create` | 创建广告位 | TAG | 创建新的广告位 |
| `ad:placement:update` | 编辑广告位 | TAG | 编辑广告位信息 |
| `ad:placement:delete` | 删除广告位 | TAG | 删除广告位 |
| `ad:type:view` | 查看类型配置 | TAG | 查看广告位类型配置 |
| `ad:type:create` | 创建类型配置 | TAG | 创建新的尺寸类型 |
| `ad:type:update` | 编辑类型配置 | TAG | 编辑类型配置 |
| `ad:type:delete` | 删除类型配置 | TAG | 删除类型配置 |
| `ad:content:view` | 查看广告内容 | TAG | 查看广告内容列表和详情 |
| `ad:content:create` | 创建广告内容 | TAG | 在广告位下创建广告 |
| `ad:content:update` | 编辑广告内容 | TAG | 编辑广告内容 |
| `ad:content:delete` | 删除广告内容 | TAG | 删除广告内容 |

> 以上节点由扩展包声明，位值由业务层在 `permissions.config.ts` 中统一分配。

## API 接口

### 广告位类型配置

| 方法 | 路径 | 说明 | 所需权限 |
|------|------|------|---------|
| GET | `/api/ext/ad-placement-types` | 分页查询 | `ad:type:view` |
| GET | `/api/ext/ad-placement-types/:id` | 查询详情 | `ad:type:view` |
| POST | `/api/ext/ad-placement-types` | 创建类型配置 | `ad:type:create` |
| PUT | `/api/ext/ad-placement-types/:id` | 更新类型配置 | `ad:type:update` |
| DELETE | `/api/ext/ad-placement-types/:id` | 删除类型配置 | `ad:type:delete` |

### 广告位

| 方法 | 路径 | 说明 | 所需权限 |
|------|------|------|---------|
| GET | `/api/ext/ad-placements` | 分页查询 | `ad:placement:view` |
| GET | `/api/ext/ad-placements/:id` | 查询详情 | `ad:placement:view` |
| POST | `/api/ext/ad-placements` | 创建广告位 | `ad:placement:create` |
| PUT | `/api/ext/ad-placements/:id` | 更新广告位 | `ad:placement:update` |
| DELETE | `/api/ext/ad-placements/:id` | 删除广告位 | `ad:placement:delete` |

### 广告内容

| 方法 | 路径 | 说明 | 所需权限 |
|------|------|------|---------|
| GET | `/api/ext/ad-contents` | 分页查询 | `ad:content:view` |
| GET | `/api/ext/ad-contents/:id` | 查询详情 | `ad:content:view` |
| POST | `/api/ext/ad-contents` | 创建广告内容 | `ad:content:create` |
| PUT | `/api/ext/ad-contents/:id` | 更新广告内容 | `ad:content:update` |
| DELETE | `/api/ext/ad-contents/:id` | 删除广告内容 | `ad:content:delete` |

## 依赖

| 依赖包 | 类型 | 说明 |
|--------|------|------|
| moyan-base-backend | peer | 后端框架基础 |
| moyan-mfw-base-frontend | peer | 前端框架基础 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.1.0 | 2026-05-09 | 初始版本：广告位类型配置、广告位管理、广告内容管理 |
