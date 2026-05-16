/**
 * @fileoverview MfwVideoSingle 视频上传组件
 * @description 单视频上传组件，支持视频预览和上传进度显示
 */

import './style.scss';

import { defineComponent, ref, computed, type PropType } from 'vue';
import { ElMessage, ElProgress } from 'element-plus';
import { Plus, VideoPlay, Delete } from '@element-plus/icons-vue';
import { FormUploader } from './uploader';
import type { MediaResource, UploadMethodType } from './types';

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default defineComponent({
  name: 'MfwVideoSingle',

  props: {
    modelValue: { type: Object as PropType<MediaResource>, default: undefined },
    uploadType: { type: String as PropType<UploadMethodType>, default: undefined },
    maxSize: { type: Number, default: 100 },
    accept: { type: String, default: 'video/*' },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '点击上传视频' },
    businessType: { type: String, default: undefined },
    uploadUrl: { type: String, default: '/api/upload-files' },
  },

  emits: ['update:modelValue', 'change', 'success', 'error'],

  setup(props, { emit, expose }) {
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const inputRef = ref<HTMLInputElement | null>(null);
    const previewVisible = ref(false);

    const hasVideo = computed(() => !!props.modelValue?.url);

    const triggerFileInput = () => {
      if (props.disabled || uploading.value) return;
      inputRef.value?.click();
    };

    const handleFileChange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const maxSize = props.maxSize * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error(`视频大小不能超过 ${props.maxSize}MB`);
        target.value = '';
        return;
      }

      if (!file.type.startsWith('video/')) {
        ElMessage.error('请上传视频文件');
        target.value = '';
        return;
      }

      await handleUpload(file);
      target.value = '';
    };

    const handleUpload = async (file: File) => {
      uploading.value = true;
      uploadProgress.value = 0;

      try {
        const uploader = new FormUploader(props.uploadUrl, props.businessType);
        const result = await uploader.upload({
          file,
          filename: 'file',
          onProgress: (percentage) => {
            uploadProgress.value = percentage;
          },
        });

        const duration = await getVideoDuration(file);
        const videoResource: MediaResource = {
          url: result.url,
          name: result.originalName,
          type: result.mimeType,
          size: result.fileSize,
          duration,
        };

        emit('update:modelValue', videoResource);
        emit('change', videoResource);
        emit('success', result);
      } catch (error: any) {
        ElMessage.error(error?.message || '上传失败');
        emit('error', error);
      } finally {
        uploading.value = false;
        uploadProgress.value = 0;
      }
    };

    const handleRemove = (e: Event) => {
      e.stopPropagation();
      emit('update:modelValue', undefined);
      emit('change', undefined);
    };

    const handlePreview = (e: Event) => {
      e.stopPropagation();
      previewVisible.value = true;
    };

    const closePreview = () => {
      previewVisible.value = false;
    };

    expose({ isUploading: uploading });

    return () => (
      <div class="mfw-video-single">
        <input
          ref={inputRef}
          type="file"
          accept={props.accept}
          style="display: none;"
          onChange={handleFileChange}
          disabled={props.disabled}
        />

        <div class="video-uploader" onClick={triggerFileInput}>
          {hasVideo.value ? (
            <div class="video-preview-box">
              <video
                class="video-preview"
                src={props.modelValue!.url}
                preload="metadata"
              />
              <div class="video-overlay">
                <VideoPlay class="play-icon" />
              </div>
              <div class="video-info">
                <span class="video-name">{props.modelValue!.name}</span>
                {props.modelValue!.duration && (
                  <span class="video-duration">{formatDuration(props.modelValue!.duration)}</span>
                )}
              </div>
              <span class="video-actions" onClick={(e: Event) => e.stopPropagation()}>
                <span class="action-icon" onClick={handlePreview}>
                  <VideoPlay />
                </span>
                {!props.disabled && (
                  <span class="action-icon action-icon-delete" onClick={handleRemove}>
                    <Delete />
                  </span>
                )}
              </span>
            </div>
          ) : uploading.value ? (
            <div class="video-uploading">
              <ElProgress
                type="circle"
                percentage={uploadProgress.value}
                width={60}
              />
              <span class="upload-text">上传中...</span>
            </div>
          ) : (
            <div class="video-placeholder">
              <span class="placeholder-icon">
                <Plus />
              </span>
              <span class="placeholder-text">{props.placeholder}</span>
            </div>
          )}
        </div>

        {previewVisible.value && props.modelValue?.url && (
          <div class="video-preview-modal" onClick={closePreview}>
            <div class="video-preview-content" onClick={(e: Event) => e.stopPropagation()}>
              <video
                class="preview-video"
                src={props.modelValue.url}
                controls
                autoplay
              />
              <span class="close-btn" onClick={closePreview}>×</span>
            </div>
          </div>
        )}
      </div>
    );
  },
});
