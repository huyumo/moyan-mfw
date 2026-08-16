# 组件 · 展示类（display）

## `MfwDateFormat` — 日期格式化

```vue
<MfwDateFormat :value="row.createdAt" fmt="YYYY-MM-DD HH:mm:ss" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `Date / string / number / null` | 日期值 |
| `fmt` | `string` | 格式化模板（dayjs），默认 `YYYY-MM-DD HH:mm:ss` |
| `emptyText` | `string` | 空值显示，默认 `--` |
| `className` | `string` | 自定义类名 |

## `MfwImageFormat` — 图片格式化

```vue
<MfwImageFormat :value="row.logo" width="60" :preview="true" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `string / ImageResource / 数组` | 图片值（支持数组轮播/多图预览） |
| `width` / `height` | `number / string` | 展示尺寸 |
| `preview` | `boolean` | 点击放大预览 |
| `fit` | `'fill' 'contain' 'cover' 等` | object-fit |
| `round` | `boolean` | 圆角 |

## `MfwDictFormat` — 字典格式化

```vue
<MfwDictFormat :value="row.status" :dict="statusItems" :as-tag="true" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `string / number / 数组` | 字典值（支持数组 → 多个标签） |
| `dict` | `DictItem[]` | 字典项 `{ value, label, type? }`（可用 `toItems(DictClass)` 生成） |
| `asTag` | `boolean` | 渲染为 el-tag（颜色取 item.type） |
| `emptyText` | `string` | 空值显示 |

## `MfwTagFormat` — 标签格式化

```vue
<MfwTagFormat value="已发货" type="success" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `value` | `string / null` | 文本 |
| `type` | `primary / success / warning / danger / info` | 标签类型 |
| `autoColor` | `boolean` | 按文本自动着色 |
| `round` / `effect` | — | 圆角 / `light` `dark` `plain` |## `MfwUserFormat` — 用户信息展示

```vue
<MfwUserFormat :user-id="row.ownerId" :fetcher="fetchUser" mode="card" />
```

| Prop | 类型 | 说明 |
|------|------|------|
| `userId` | `string / number` | 用户 ID |
| `fetcher` | `(userId) => Promise<UserInfo>` | 用户信息获取函数（必传，框架不内置数据源） |
| `mode` | `avatar / name / card / full` | 展示模式 |
| `showDepartment` / `showPosition` / `showStatus` | `boolean` | 附加信息 |
| `clickable` | `boolean` | 可点击（emit click） |

## `MfwCardPanel` — 卡片面板

```vue
<MfwCardPanel
  :header="{ title: '店铺信息', subtitle: '基础资料', status: { value: 'active', type: 'success', text: '营业中' } }"
  :items="[{ key: 'name', label: '店名' }, { key: 'logo', label: 'Logo', format: 'image' }]"
  :data="shopData"
/>
```

## `ParticleBackground` — 粒子背景

登录页等场景的装饰性背景组件，直接引入使用即可：

```vue
<ParticleBackground />
```## `MfwFormat` — 统一格式化入口

根据 `format` 属性分发到以上组件：

```vue
<MfwFormat format="date" :value="row.createdAt" />
<MfwFormat format="dict" :value="row.status" :dict="items" />
<MfwFormat format="image" :value="row.logo" />
<MfwFormat format="tag" :value="row.state" type="success" />
```

## `MfwDetail` / `MfwDetailPanel` — 详情面板

```vue
<MfwDetailPanel
  :data="detailData"
  :items="[",
    { label: '公司名称', key: 'companyName' },",
    { label: '创建时间', key: 'createdAt', format: 'date' },",
    { label: '状态', key: 'status', format: 'dict', dict: statusItems, span: 2 },",
  ]"
  :columns="2"
  title="供应商详情"
/>
```

`DetailItem`：`label` / `key` / `format`（`text / date / image / dict / tag / user / custom`）/ `formatOptions` / `dict` / `dateFormat` / `span` / `hidden` / `customRender`。
