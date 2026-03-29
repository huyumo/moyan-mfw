<template>
  <div class="upload-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 单图上传</span>
      </template>
      <MfwUpload
        v-model="imageUrl1"
        :limit="1"
        empty-text="上传单图"
      />
      <div class="demo-data">
        <strong>图片 URL:</strong>
        <pre>{{ imageUrl1 || '未选择' }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 多图上传</span>
      </template>
      <MfwUpload
        v-model="imageUrls2"
        :multiple="true"
        :limit="9"
        empty-text="上传图片"
      />
      <div class="demo-data">
        <strong>图片列表:</strong>
        <pre>{{ imageUrls2.length > 0 ? JSON.stringify(imageUrls2, null, 2) : '未选择' }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: 列表样式 - picture</span>
      </template>
      <MfwUpload
        v-model="imageUrl3"
        list-type="picture"
        empty-text="上传文件"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 列表样式 - text</span>
      </template>
      <MfwUpload
        v-model="imageUrl4"
        list-type="text"
        empty-text="上传文件"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 5: 文件类型限制</span>
      </template>
      <MfwUpload
        v-model="fileUrl5"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        :max-size="20"
        empty-text="上传办公文件 (最大 20MB)"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 6: 禁用状态</span>
      </template>
      <MfwUpload
        v-model="imageUrl6"
        :disabled="true"
        empty-text="禁用状态"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MfwUpload } from 'moyan-mfw-base-frontend'

// ==================== 示例 1: 单图上传 ====================
const imageUrl1 = ref<string>('')

// ==================== 示例 2: 多图上传 ====================
const imageUrls2 = ref<string[]>([])

// ==================== 示例 3: 列表样式 - picture ====================
const imageUrl3 = ref<string>('')

// ==================== 示例 4: 列表样式 - text ====================
const imageUrl4 = ref<string>('')

// ==================== 示例 5: 文件类型限制 ====================
const fileUrl5 = ref<string>('')

// ==================== 示例 6: 禁用状态 ====================
const imageUrl6 = ref<string>('https://example.com/sample.jpg')
</script>

<style scoped lang="scss">
.upload-demo {
  padding: 24px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-data {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.demo-data pre {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
}
</style>
