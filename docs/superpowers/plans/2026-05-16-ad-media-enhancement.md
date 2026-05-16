# 广告媒体增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强广告管理功能，支持图片/视频上传、卡片展示和拖拽排序

**Architecture:** 修改后端实体添加媒体字段，改造前端表单和列表组件，使用项目标准的 ImageResourceDto/MediaResourceDto 格式

**Tech Stack:** NestJS + TypeORM + Vue 3 + Element Plus + vuedraggable

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/extensions/extension-ad/src/backend/src/entities/ad.entity.ts` | 修改 | 添加 mediaType、image、video 字段 |
| `packages/extensions/extension-ad/src/backend/src/dto/req/create-ad.dto.ts` | 修改 | 更新创建 DTO |
| `packages/extensions/extension-ad/src/backend/src/dto/req/update-ad.dto.ts` | 修改 | 更新更新 DTO |
| `packages/extensions/extension-ad/src/backend/src/dto/res/ad-response.dto.ts` | 修改 | 更新响应 DTO |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-form/Index.vue` | 修改 | 移除广告位选择，添加媒体上传 |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-card/Index.vue` | 新增 | 广告卡片组件 |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue` | 修改 | 卡片展示 + 拖拽排序 |
| `packages/extensions/extension-ad/database/migrations/` | 新增 | 数据迁移脚本 |

---

## Task 1: 修改后端实体和 DTO

**Files:**
- Modify: `packages/extensions/extension-ad/src/backend/src/entities/ad.entity.ts`
- Modify: `packages/extensions/extension-ad/src/backend/src/dto/req/create-ad.dto.ts`
- Modify: `packages/extensions/extension-ad/src/backend/src/dto/req/update-ad.dto.ts`
- Modify: `packages/extensions/extension-ad/src/backend/src/dto/res/ad-response.dto.ts`

- [ ] **Step 1: 修改 Ad 实体**

在 `packages/extensions/extension-ad/src/backend/src/entities/ad.entity.ts` 中：

1. 导入资源类型：
```typescript
import { ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'
```

2. 删除 `imageUrl` 字段

3. 添加新字段：
```typescript
@Column({ 
  type: 'enum', 
  enum: ['image', 'video'], 
  default: 'image',
  comment: '媒体类型' 
})
mediaType: 'image' | 'video'

@Column({ 
  type: 'json', 
  nullable: true,
  comment: '图片资源' 
})
image: ImageResourceDto

@Column({ 
  type: 'json', 
  nullable: true,
  comment: '视频资源' 
})
video: MediaResourceDto
```

- [ ] **Step 2: 修改 CreateAdDto**

在 `packages/extensions/extension-ad/src/backend/src/dto/req/create-ad.dto.ts` 中：

1. 删除 `imageUrl` 字段

2. 添加新字段：
```typescript
@ApiProperty({ description: '媒体类型', enum: ['image', 'video'], default: 'image' })
@IsEnum(['image', 'video'])
mediaType: 'image' | 'video'

@ApiProperty({ description: '图片资源', required: false })
@IsOptional()
@ValidateNested()
@Type(() => ImageResourceDto)
image?: ImageResourceDto

@ApiProperty({ description: '视频资源', required: false })
@IsOptional()
@ValidateNested()
@Type(() => MediaResourceDto)
video?: MediaResourceDto
```

- [ ] **Step 3: 修改 UpdateAdDto**

同 CreateAdDto，删除 `imageUrl`，添加 `mediaType`、`image`、`video` 字段。

- [ ] **Step 4: 修改 AdResponseDto**

在 `packages/extensions/extension-ad/src/backend/src/dto/res/ad-response.dto.ts` 中：

1. 删除 `imageUrl` 字段

2. 添加新字段：
```typescript
@ApiProperty({ description: '媒体类型', enum: ['image', 'video'] })
mediaType: 'image' | 'video'

@ApiProperty({ description: '图片资源', required: false })
image?: ImageResourceDto

@ApiProperty({ description: '视频资源', required: false })
video?: MediaResourceDto
```

- [ ] **Step 5: 验证类型检查**

Run: `pnpm typecheck:base-backend`
Expected: 无类型错误

---

## Task 2: 创建数据迁移脚本

**Files:**
- Create: `packages/extensions/extension-ad/database/migrations/YYYYMMDDHHMMSS-ad-media.ts`

- [ ] **Step 1: 创建迁移文件**

创建文件 `packages/extensions/extension-ad/database/migrations/YYYYMMDDHHMMSS-ad-media.ts`：

**命名格式说明：**
- 使用 `YYYYMMDDHHMMSS` 格式的时间戳（如 `20260516143000`）
- 或使用项目迁移命名规范（如有）

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdMedia20260516143000 implements MigrationInterface {
  name = 'AdMedia20260516143000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加新字段
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      ADD COLUMN mediaType VARCHAR(10) DEFAULT 'image' COMMENT '媒体类型',
      ADD COLUMN image JSON COMMENT '图片资源',
      ADD COLUMN video JSON COMMENT '视频资源'
    `)

    // 2. 迁移现有数据
    await queryRunner.query(`
      UPDATE ext_ad_contents 
      SET image = JSON_OBJECT('src', imageUrl, 'width', 0, 'height', 0)
      WHERE imageUrl IS NOT NULL AND imageUrl != ''
    `)

    // 3. 删除旧字段
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents DROP COLUMN imageUrl
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      ADD COLUMN imageUrl VARCHAR(500) COMMENT '广告图片 URL'
    `)
    
    await queryRunner.query(`
      UPDATE ext_ad_contents 
      SET imageUrl = JSON_UNQUOTE(JSON_EXTRACT(image, '$.src'))
      WHERE image IS NOT NULL
    `)
    
    await queryRunner.query(`
      ALTER TABLE ext_ad_contents 
      DROP COLUMN mediaType,
      DROP COLUMN image,
      DROP COLUMN video
    `)
  }
}
```

- [ ] **Step 2: 验证迁移文件**

Run: `ls packages/extensions/extension-ad/database/migrations/`
Expected: 显示新创建的迁移文件

---

## Task 3: 重新生成 API 类型

**Files:**
- Auto-generated: `packages/extensions/extension-ad/src/frontend/src/apis/ad/schemas.ts`

- [ ] **Step 1: 运行 API 生成命令**

Run: `pnpm build:api`
Expected: API 类型重新生成成功

- [ ] **Step 2: 验证生成的类型**

检查 `packages/extensions/extension-ad/src/frontend/src/apis/ad/schemas.ts` 中是否包含新的 `mediaType`、`image`、`video` 字段。

---

## Task 4: 创建广告卡片组件

**Files:**
- Create: `packages/extensions/extension-ad/src/frontend/src/components/ad-card/Index.vue`

- [ ] **Step 1: 创建 AdCard 组件**

创建文件 `packages/extensions/extension-ad/src/frontend/src/components/ad-card/Index.vue`：

```vue
<!--
/**
 * @fileoverview 广告卡片组件
 * @description 展示广告信息，支持图片/视频预览
 */
-->
<template>
  <el-card class="ad-card" :body-style="{ padding: '0' }" shadow="hover">
    <!-- 媒体预览区 -->
    <div class="media-preview">
      <!-- 图片预览 -->
      <img 
        v-if="ad.mediaType === 'image' && ad.image" 
        :src="ad.image.src" 
        :alt="ad.title"
        class="media-image"
      />
      <!-- 视频预览 -->
      <video 
        v-else-if="ad.mediaType === 'video' && ad.video" 
        :src="ad.video.url"
        class="media-video"
        muted
        preload="metadata"
      />
      <!-- 空状态 -->
      <div v-else class="empty-placeholder">
        <el-icon :size="32"><Picture /></el-icon>
      </div>
      
      <!-- 媒体类型标签 -->
      <el-tag class="media-type-tag" size="small" :type="ad.mediaType === 'image' ? 'success' : 'warning'">
        {{ ad.mediaType === 'image' ? '图片' : '视频' }}
      </el-tag>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-section">
      <el-button 
        :type="ad.status === STATUS.ENABLED ? 'warning' : 'success'"
        size="small"
        @click="handleToggleStatus"
        v-permission="{ value: ['编辑'] }"
        data-testid="toggle-status-btn"
      >
        {{ ad.status === STATUS.ENABLED ? '禁用' : '启用' }}
      </el-button>
      <el-button type="primary" size="small" @click="handleEdit" v-permission="{ value: ['编辑'] }" data-testid="edit-btn">
        编辑
      </el-button>
      <el-button type="danger" size="small" @click="handleDelete" v-permission="{ value: ['删除'] }" data-testid="delete-btn">
        删除
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import { StatusDict } from 'moyan-mfw-base/shared'
import type { AdResponseDto } from '../../apis/ad/schemas'

interface Props {
  ad: AdResponseDto
}

const props = defineProps<Props>()

interface Emits {
  (e: 'edit', ad: AdResponseDto): void
  (e: 'delete', ad: AdResponseDto): void
  (e: 'toggle-status', ad: AdResponseDto): void
}

const emit = defineEmits<Emits>()

defineOptions({ name: 'MfwAdCard' })

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }

const handleEdit = () => {
  emit('edit', props.ad)
}

const handleDelete = () => {
  emit('delete', props.ad)
}

const handleToggleStatus = () => {
  emit('toggle-status', props.ad)
}
</script>

<style scoped>
.ad-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.ad-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.media-preview {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-image,
.media-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.media-type-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.action-section {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
```

- [ ] **Step 2: 验证组件创建**

Run: `ls packages/extensions/extension-ad/src/frontend/src/components/ad-card/`
Expected: 显示 `Index.vue` 文件

---

## Task 5: 修改广告表单组件

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-form/Index.vue`

- [ ] **Step 1: 读取现有文件**

读取 `packages/extensions/extension-ad/src/frontend/src/components/ad-form/Index.vue` 的内容。

- [ ] **Step 2: 修改 Props**

将 Props 改为：
```typescript
const props = defineProps<{
  id?: string
  placementId: string  // 从详情抽屉传递，绑定死
  mediaType?: 'image' | 'video'
  image?: ImageResource
  video?: MediaResource
  title?: string
  linkType?: string
  linkUrl?: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  sortOrder?: number
}>()
```

- [ ] **Step 3: 移除广告位选择器**

删除 `onMounted` 中加载广告位列表的逻辑，删除 `placementOptions` 变量。

- [ ] **Step 4: 更新表单数据**

```typescript
const form = reactive({
  placementId: props.placementId,  // 从 props 获取，绑定死
  mediaType: props.mediaType || 'image',
  image: props.image || undefined,
  video: props.video || undefined,
  title: props.title || '',
  // ... 其他字段
})
```

- [ ] **Step 5: 更新 formTemplate**

在 `formTemplate` 中添加媒体类型和上传字段：

```typescript
const formTemplate = computed<FormItemConfig[]>(() => {
  const base: FormItemConfig[] = [
    // 移除 placementId 选择器
    { key: 'title', label: '广告标题', component: 'el-input',
      rules: [{ required: true, message: '请输入广告标题', trigger: 'blur' }],
      elProps: { placeholder: '请输入广告标题', clearable: true } },
    { key: 'mediaType', label: '媒体类型', component: 'el-radio-group',
      rules: [{ required: true, message: '请选择媒体类型', trigger: 'change' }],
      elProps: { options: [
        { label: '图片', value: 'image' },
        { label: '视频', value: 'video' }
      ]} },
  ]

  // 根据媒体类型显示对应上传组件
  if (form.mediaType === 'image') {
    base.push({ key: 'image', label: '广告图片', component: 'MfwImageSingle',
      rules: [{ required: true, message: '请上传广告图片', trigger: 'change' }],
      elProps: { crop: false, maxSize: 10, placeholder: '点击上传图片' } })
  } else if (form.mediaType === 'video') {
    base.push({ key: 'video', label: '广告视频', component: 'MfwUpload',
      rules: [{ required: true, message: '请上传广告视频', trigger: 'change' }],
      elProps: { resourceType: 'media', maxSize: 100, accept: 'video/*', limit: 1 } })
  }

  // ... 其他字段
  return base
})
```

- [ ] **Step 6: 更新 onConfirm**

```typescript
const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')
  const body = { ...form }
  // 根据 mediaType 清理不需要的字段
  if (body.mediaType === 'image') {
    delete body.video
  } else {
    delete body.image
  }
  if (isEdit.value) {
    await new ApiAdUpdate({ params: { id: props.id! }, body })
  } else {
    await new ApiAdCreate({ body })
  }
}
```

- [ ] **Step 7: 验证类型检查**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

---

## Task 6: 改造详情抽屉组件

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue`

- [ ] **Step 1: 安装 vuedraggable 依赖**

Run: `pnpm add vuedraggable@next -F @internal/ad-frontend`
Expected: 安装成功

- [ ] **Step 2: 读取现有文件**

读取 `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue` 的内容。

- [ ] **Step 3: 导入依赖**

```typescript
import draggable from 'vuedraggable'
import MfwAdCard from '../ad-card/Index.vue'
import { ApiAdBatchUpdateSort } from '../../apis/ad'
```

- [ ] **Step 4: 替换表格为卡片网格**

将现有的表格组件替换为：
```vue
<draggable 
  v-model="ads" 
  class="ad-grid"
  item-key="id"
  animation="200"
  @end="handleDragEnd"
>
  <template #item="{ element }">
    <MfwAdCard 
      :ad="element"
      @edit="handleEditAd"
      @delete="handleDeleteAd"
      @toggle-status="handleToggleAdStatus"
    />
  </template>
</draggable>
```

- [ ] **Step 5: 添加拖拽排序处理函数**

使用现有的 `ApiAdBatchUpdateSort` API：
```typescript
const handleDragEnd = async (event: any) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return
  
  // 使用现有 API 格式: { items: { id, sortOrder }[] }
  const items = ads.value.map((ad, index) => ({ id: ad.id, sortOrder: index }))
  await new ApiAdBatchUpdateSort({ body: { items } }, { hintSuccess: true })
}
```

- [ ] **Step 6: 修改新建广告按钮**

确保传递 `placementId`：
```typescript
const handleAddAd = () => {
  MfwPopup.open({
    title: '新建广告',
    type: 'dialog',
    component: MfwAdForm,
    data: { placementId: placementId.value },
    popupProps: { width: 550 },
    on: { confirm: loadAds },
  })
}
```

- [ ] **Step 7: 添加样式**

```css
.ad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 100px;
}
```

- [ ] **Step 8: 验证类型检查**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

---

## Task 7: 运行类型检查

**Files:**
- 无文件变更，仅验证

- [ ] **Step 1: 运行完整类型检查**

Run: `pnpm typecheck`
Expected: 无类型错误

- [ ] **Step 2: 如有错误，修复并重新检查**

根据错误信息修复类型问题，然后重新运行 `pnpm typecheck`

---

## Task 8: 测试验证

**Files:**
- 无文件变更，仅验证

- [ ] **Step 1: 启动前端开发服务器**

Run: `pnpm dev:frontend`
Expected: 前端服务启动成功

- [ ] **Step 2: 手动测试功能**

在浏览器中验证：
1. 广告表单不显示广告位选择
2. 媒体类型切换正常
3. 图片上传正常
4. 视频上传正常
5. 广告列表卡片展示正常
6. 拖拽排序正常工作

- [ ] **Step 3: 停止开发服务器**

按 `Ctrl+C` 停止开发服务器

---

## Task 9: 提交代码

**Files:**
- 无文件变更，仅提交

- [ ] **Step 1: 查看变更**

Run: `git status`
Expected: 显示所有修改的文件

- [ ] **Step 2: 添加文件到暂存区**

Run: `git add packages/extensions/extension-ad/`

- [ ] **Step 3: 提交代码**

Run: `git commit -m "feat(ad): 支持图片/视频上传和拖拽排序

- 修改 Ad 实体，添加 mediaType、image、video 字段
- 使用 ImageResourceDto 和 MediaResourceDto 标准格式
- 广告表单移除广告位选择，从详情抽屉传递 placementId
- 广告列表改为卡片展示，支持拖拽排序
- 添加数据迁移脚本"`
Expected: 提交成功

---

## 验收标准

- [ ] 广告表单不显示广告位选择，placementId 正确传递
- [ ] 广告支持图片和视频两种媒体类型
- [ ] 图片和视频使用项目标准资源格式
- [ ] 广告列表使用卡片展示
- [ ] 拖拽排序功能正常
- [ ] 现有数据正确迁移
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码符合项目编码规范
