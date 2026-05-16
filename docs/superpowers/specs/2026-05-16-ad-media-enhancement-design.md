# 广告媒体增强设计文档

## 概述

本文档描述广告管理功能的增强设计，包括：
1. 广告表单移除广告位选择，绑定死
2. 广告 URL 支持图片和视频上传，使用项目标准资源格式
3. 广告列表改为卡片展示，支持拖拽排序

## 背景

当前广告管理功能存在以下问题：
- 广告表单需要手动选择广告位，操作繁琐
- 广告只支持图片 URL，不支持视频
- 广告列表使用表格展示，无法直观预览和排序

## 设计目标

1. **简化操作**：广告表单从详情抽屉传递 placementId，无需手动选择
2. **支持视频**：广告支持图片和视频两种媒体类型
3. **标准格式**：使用项目标准的 `ImageResourceDto` 和 `MediaResourceDto` 格式
4. **直观展示**：广告列表使用卡片展示，支持拖拽排序

## 架构设计

### 数据模型变更

**Ad 实体修改：**

```typescript
// 删除字段
imageUrl: string

// 新增字段
mediaType: 'image' | 'video'  // 媒体类型
image: ImageResourceDto       // 图片资源（JSON）
video: MediaResourceDto       // 视频资源（JSON）
```

**ImageResourceDto 格式：**
```typescript
{
  src: string      // 图片 URL
  width: number    // 图片宽度（像素）
  height: number   // 图片高度（像素）
}
```

**MediaResourceDto 格式：**
```typescript
{
  url: string      // 视频 URL
  name: string     // 原始文件名
  type: string     // MIME 类型
  size?: number    // 文件大小（字节）
  duration?: number // 时长（秒）
}
```

### 组件结构

```
ad-placement-detail/Index.vue (详情抽屉)
├── 广告卡片网格 (新增)
│   └── AdCard (新组件)
│       ├── 媒体预览区 (图片/视频缩略图)
│       └── 操作按钮区 (编辑、删除、启用/禁用)
├── 新建广告按钮
└── 广告表单弹窗
    └── AdForm (修改)
        ├── 媒体类型切换 (图片/视频)
        ├── 图片上传 (MfwImageSingle)
        └── 视频上传 (MfwUpload resourceType="media")
```

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/entities/ad.entity.ts` | 修改 | 添加 mediaType、image、video 字段 |
| `backend/dto/req/create-ad.dto.ts` | 修改 | 更新创建 DTO |
| `backend/dto/req/update-ad.dto.ts` | 修改 | 更新更新 DTO |
| `backend/dto/res/ad-response.dto.ts` | 修改 | 更新响应 DTO |
| `frontend/apis/ad/schemas.ts` | 自动生成 | API 类型定义 |
| `frontend/components/ad-form/Index.vue` | 修改 | 移除广告位选择，添加媒体上传 |
| `frontend/components/ad-card/Index.vue` | 新增 | 广告卡片组件 |
| `frontend/components/ad-placement-detail/Index.vue` | 修改 | 卡片展示 + 拖拽排序 |
| `database/migrations/*.ts` | 新增 | 数据迁移脚本 |

## 详细设计

### 1. 后端数据模型

#### 1.1 Ad 实体修改

```typescript
@Entity('ext_ad_contents')
export class Ad extends Base {
  // ... 现有字段 ...

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
}
```

#### 1.2 DTO 修改

**CreateAdDto:**
```typescript
export class CreateAdDto {
  @ApiProperty({ description: '广告位 ID' })
  @IsString()
  placementId: string

  @ApiProperty({ description: '广告标题' })
  @IsString()
  title: string

  @ApiProperty({ description: '媒体类型', enum: ['image', 'video'] })
  @IsEnum(['image', 'video'])
  mediaType: 'image' | 'video'

  @ApiProperty({ description: '图片资源', required: false })
  @ValidateNested()
  @Type(() => ImageResourceDto)
  image?: ImageResourceDto

  @ApiProperty({ description: '视频资源', required: false })
  @ValidateNested()
  @Type(() => MediaResourceDto)
  video?: MediaResourceDto

  // ... 其他字段 ...
}
```

### 2. 前端组件

#### 2.1 广告表单 (AdForm)

**Props:**
```typescript
interface Props {
  placementId: string  // 从详情抽屉传递，绑定死
  data?: AdResponseDto // 编辑时传入
}
```

**模板结构:**
```vue
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <!-- 媒体类型切换 -->
    <el-form-item label="媒体类型" prop="mediaType">
      <el-radio-group v-model="form.mediaType">
        <el-radio value="image">图片</el-radio>
        <el-radio value="video">视频</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- 图片上传 -->
    <el-form-item v-if="form.mediaType === 'image'" label="广告图片" prop="image">
      <MfwImageSingle 
        v-model="form.image" 
        :crop="false"
        :max-size="10"
        placeholder="点击上传图片"
      />
    </el-form-item>

    <!-- 视频上传 -->
    <el-form-item v-if="form.mediaType === 'video'" label="广告视频" prop="video">
      <MfwUpload 
        v-model="form.video"
        resource-type="media"
        :max-size="100"
        accept="video/*"
        :limit="1"
      />
    </el-form-item>

    <!-- 其他字段：标题、跳转方式、投放时间等 -->
    <!-- ... -->
  </el-form>
</template>
```

#### 2.2 广告卡片组件 (AdCard)

**Props:**
```typescript
interface Props {
  ad: AdResponseDto
}
```

**事件:**
```typescript
interface Emits {
  (e: 'edit', ad: AdResponseDto): void
  (e: 'delete', ad: AdResponseDto): void
  (e: 'toggle-status', ad: AdResponseDto): void
}
```

**模板结构:**
```vue
<template>
  <el-card class="ad-card" :body-style="{ padding: '0' }" shadow="hover">
    <!-- 媒体预览区 -->
    <div class="media-preview">
      <!-- 图片预览 -->
      <img 
        v-if="ad.mediaType === 'image' && ad.image" 
        :src="ad.image.src" 
        class="media-image"
      />
      <!-- 视频预览（显示第一帧） -->
      <video 
        v-else-if="ad.mediaType === 'video' && ad.video" 
        :src="ad.video.url"
        class="media-video"
        muted
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
      >
        {{ ad.status === STATUS.ENABLED ? '禁用' : '启用' }}
      </el-button>
      <el-button type="primary" size="small" @click="handleEdit" v-permission="{ value: ['编辑'] }">
        编辑
      </el-button>
      <el-button type="danger" size="small" @click="handleDelete" v-permission="{ value: ['删除'] }">
        删除
      </el-button>
    </div>
  </el-card>
</template>
```

#### 2.3 详情抽屉改造 (AdPlacementDetail)

**模板结构:**
```vue
<template>
  <MfwDrawer v-model="visible" title="广告位详情" :size="600">
    <!-- 广告位信息 -->
    <div class="placement-info">
      <!-- ... -->
    </div>

    <!-- 广告列表 -->
    <div class="ad-section">
      <div class="section-header">
        <span>广告列表</span>
        <el-button type="primary" size="small" @click="handleAddAd" v-permission="{ value: ['添加'] }">
          新建广告
        </el-button>
      </div>

      <!-- 拖拽排序卡片网格 -->
      <draggable 
        v-model="ads" 
        class="ad-grid"
        item-key="id"
        animation="200"
        @end="handleDragEnd"
      >
        <template #item="{ element }">
          <AdCard 
            :ad="element"
            @edit="handleEditAd"
            @delete="handleDeleteAd"
            @toggle-status="handleToggleAdStatus"
          />
        </template>
      </draggable>
    </div>

    <!-- 广告表单弹窗 -->
    <MfwAdForm ref="formRef" :placement-id="placementId" />
  </MfwDrawer>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'

const ads = ref<AdResponseDto[]>([])
const placementId = ref<string>('')

const handleDragEnd = async (event: any) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return
  
  // 更新排序
  const adIds = ads.value.map(ad => ad.id)
  await new ApiAdUpdateSort({ body: { ids: adIds } }, { hintSuccess: true })
}

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
</script>
```

### 3. 数据迁移

#### 3.1 迁移脚本

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AdMediaMigration1234567890 implements MigrationInterface {
  name = 'AdMediaMigration1234567890'

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

### 4. API 变更

#### 4.1 新增排序 API

```typescript
// backend/controllers/ad.controller.ts
@Patch('sort')
@RequirePermission({ permCode: 'ext:ad:*', permissionValue: ['编辑'] })
async updateSort(@Body() dto: UpdateAdSortDto) {
  return this.adService.updateSort(dto.ids)
}

// backend/dto/req/update-ad-sort.dto.ts
export class UpdateAdSortDto {
  @ApiProperty({ description: '广告 ID 列表（按排序顺序）' })
  @IsArray()
  @IsString({ each: true })
  ids: string[]
}

// backend/services/ad.service.ts
async updateSort(ids: string[]) {
  const promises = ids.map((id, index) => 
    this.adRepository.update(id, { sortOrder: index })
  )
  await Promise.all(promises)
}
```

## 技术要点

### 1. 媒体上传

- **图片上传**：使用 `MfwImageSingle` 组件，返回 `ImageResource` 格式
- **视频上传**：使用 `MfwUpload` 组件，`resourceType="media"`，返回 `MediaResource` 格式
- **类型切换**：通过 `el-radio-group` 切换媒体类型，动态显示对应上传组件

### 2. 拖拽排序

- 使用 `vuedraggable` 库实现拖拽排序
- 拖拽结束后调用 API 更新排序
- 使用 `animation` 属性添加动画效果

### 3. 数据验证

- 媒体类型必填
- 图片类型时 `image` 字段必填
- 视频类型时 `video` 字段必填

## 测试要点

### 功能测试

1. **广告表单**
   - 验证 placementId 正确传递
   - 验证媒体类型切换正常
   - 验证图片上传正常
   - 验证视频上传正常

2. **广告列表**
   - 验证卡片正确显示媒体预览
   - 验证拖拽排序正常工作
   - 验证操作按钮功能正常

3. **数据迁移**
   - 验证现有数据正确迁移
   - 验证回滚功能正常

### 性能测试

1. 拖拽排序的流畅性
2. 视频预览加载速度

## 风险与缓解

### 风险 1：数据迁移失败

**缓解措施：**
- 在迁移前备份数据
- 提供回滚脚本
- 在测试环境充分测试

### 风险 2：视频文件过大影响上传

**缓解措施：**
- 设置视频文件大小限制（如 100MB）
- 提供压缩建议
- 支持断点续传（可选）

## 实施计划

1. 修改后端实体和 DTO
2. 创建数据库迁移脚本
3. 修改广告表单组件
4. 创建广告卡片组件
5. 改造详情抽屉组件
6. 运行数据迁移
7. 测试验证

## 验收标准

1. 广告表单不显示广告位选择，placementId 正确传递
2. 广告支持图片和视频两种媒体类型
3. 图片和视频使用项目标准资源格式
4. 广告列表使用卡片展示
5. 拖拽排序功能正常
6. 现有数据正确迁移
7. 代码通过 TypeScript 类型检查
8. 代码符合项目编码规范
