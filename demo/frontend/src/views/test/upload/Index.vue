/**
 * @fileoverview 上传组件演示页
 * @description 演示 MfwUploadFile（按钮式单文件）与 MfwUploadFileDrag（拖拽式多文件）的用法，
 * 实时展示 v-model 回填的数据结构。
 */

<template>
  <section class="mfw-upload-demo">
    <h2>上传组件演示</h2>
    <p class="desc">
      下方两个用例分别演示 <code>MfwUploadFile</code>（按钮式单文件）与
      <code>MfwUploadFileDrag</code>（拖拽式多文件）。上传成功后右侧实时展示 v-model 回填的数据结构。
      上传走 <code>VITE_UPLOAD_TYPE</code>/<code>VITE_UPLOAD_FORM_URL</code> 配置，demo 默认 Form 模式
      打到 <code>/api/upload-files</code>。
    </p>

    <div class="layout">
      <!-- 用例一：MfwUploadFile -->
      <div class="case">
        <div class="case-head">
          <h3>① MfwUploadFile（按钮式单文件）</h3>
          <ElButton size="small" @click="singleValue = ''">清空</ElButton>
        </div>
        <div class="case-body">
          <MfwUploadFile
            v-model="singleValue"
            :max-size="50"
            :file-type="['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip']"
            business-type="demo-single"
            @success="onSingleSuccess"
            @error="onSingleError"
            @remove="onSingleRemove"
          />
        </div>
        <pre class="json-preview">{{ formatJson(singleValue) }}</pre>
      </div>

      <!-- 用例二：MfwUploadFileDrag -->
      <div class="case">
        <div class="case-head">
          <h3>② MfwUploadFileDrag（拖拽式多文件）</h3>
          <ElButton size="small" @click="multiValue = []">清空</ElButton>
        </div>
        <div class="case-body">
          <MfwUploadFileDrag
            v-model="multiValue"
            :multiple="false"
            :limit="1"
            :max-size="100"
            business-type="demo-drag"
            @success="onDragSuccess"
            @error="onDragError"
            @remove="onDragRemove"
          />
        </div>
        <pre class="json-preview">{{ formatJson(multiValue) }}</pre>
      </div>
    </div>

    <ElDivider />

    <div class="events">
      <h3>事件日志</h3>
      <ElButton size="small" @click="logs = []">清空日志</ElButton>
      <ul class="log-list">
        <li v-for="(item, idx) in logs" :key="idx">
          <ElTag :type="item.type" size="small">{{ item.tag }}</ElTag>
          <span class="log-time">{{ item.time }}</span>
          <span class="log-msg">{{ item.msg }}</span>
        </li>
        <li v-if="!logs.length" class="empty">暂无事件</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElDivider, ElTag, ElMessage } from 'element-plus';
import { MfwUploadFile, MfwUploadFileDrag } from 'moyan-mfw-base/frontend';
import type { FileResource, UploadResult } from 'moyan-mfw-base/frontend';

const singleValue = ref<FileResource | string>('');
const multiValue = ref<FileResource[]>([]);

interface LogItem {
  tag: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  msg: string;
  time: string;
}
const logs = ref<LogItem[]>([]);

const pushLog = (tag: string, type: LogItem['type'], msg: string) => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ tag, type, msg, time });
};

const formatJson = (value: unknown): string => {
  try {
    if (value === '' || value === null || value === undefined) return '""';
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

// ===== MfwUploadFile 事件 =====
const onSingleSuccess = (result: UploadResult) => {
  pushLog('single:success', 'success', `上传成功 url=${result.url}`);
};
const onSingleError = (error: Error) => {
  pushLog('single:error', 'danger', `上传失败 ${error.message}`);
};
const onSingleRemove = () => {
  pushLog('single:remove', 'info', '移除文件');
};

// ===== MfwUploadFileDrag 事件 =====
const onDragSuccess = (result: UploadResult) => {
  pushLog('drag:success', 'success', `上传成功 url=${result.url}`);
};
const onDragError = (error: Error) => {
  pushLog('drag:error', 'danger', `上传失败 ${error.message}`);
};
const onDragRemove = () => {
  pushLog('drag:remove', 'info', '移除文件');
};
</script>

<style scoped lang="scss">
.mfw-upload-demo {
  padding: 16px;

  h2 {
    margin: 0 0 8px;
  }

  .desc {
    margin: 0 0 16px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;

    code {
      background: var(--el-fill-color-light);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 12px;
    }
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  .case {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    background: var(--el-bg-color);

    .case-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 15px;
      }
    }

    .case-body {
      margin-bottom: 12px;
    }
  }

  .json-preview {
    margin: 0;
    padding: 12px;
    background: var(--el-fill-color-darker);
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.5;
    max-height: 220px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .events {
    h3 {
      margin: 0 0 12px;
      font-size: 15px;
    }

    .log-list {
      list-style: none;
      margin: 12px 0 0;
      padding: 0;
      max-height: 240px;
      overflow: auto;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 6px;

      li {
        padding: 6px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .log-time {
          color: var(--el-text-color-secondary);
          font-family: monospace;
        }

        .log-msg {
          flex: 1;
          word-break: break-all;
        }

        &.empty {
          color: var(--el-text-color-secondary);
          justify-content: center;
        }
      }
    }
  }
}
</style>
