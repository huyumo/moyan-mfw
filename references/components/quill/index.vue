<template>
  <div class="mo-quill-editor" style="margin-bottom: 5px; border-radius: 10px">
    <el-upload
      :id="id"
      :class="`editor-img-uploader editor-img-uploader_${id}`"
      :show-file-list="false"
      :headers="headers"
      :httpRequest="httpRequest"
      :on-success="handleAvatarSuccess"
      :before-upload="beforeAvatarUpload"
    >
      <i class="el-icon-plus editor-img-uploader"></i>
    </el-upload>
    <QuillEditor
      v-if="!disabled1"
      ref="myQuillEditor"
      v-model:content="modelValue"
      theme="snow"
      contentType="html"
      @textChange="onTextChange"
      :options="options"
    />
    <div class="quill-editor-html-box" v-if="disabled1" v-html="modelValue"></div>
  </div>
</template>

<script lang="ts">
import { QuillEditor, Quill, Delta } from '@vueup/vue-quill'
import { defineComponent, reactive, ref, toRaw, toRef, PropType, watch } from 'vue'
// import config from '../api/config'
import { ElMessage } from 'element-plus'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { getUploader, UploadType } from '../upload/uploader'
import { MoUitls } from '@/lib/uilt.mo'
import { config } from '@/config'

export default defineComponent({
  components: { QuillEditor },
  emits: ['update:modelValue', 'change'],
  props: {
    // 富文本编辑器
    modelValue: String,
    uploadType: String as PropType<UploadType>,
    disabled: Boolean
  },
  setup(props, ctx) {
    const modelValue = toRef(props, 'modelValue', '')
    const disabled = toRef(props, 'disabled', false)
    const disabled1 = ref(disabled.value)

    watch(disabled, (value) => {
      disabled1.value = value
    })

    // let upLoadUrl = ref(config.baseUrl.product + '/api/uploadFileTwo?token=' + sessionStorage.getItem('token'))
    // const upLoadUrl = ref('/upload')
    const uploadType = toRef(props, 'uploadType', config.upload.uploadType)
    // const uploadType = toRef(props, 'uploadType', 'Form')
    const headers = reactive({
      token: sessionStorage.getItem('token')
    })
    const myQuillEditor = ref<InstanceType<typeof QuillEditor> | null>()
    const id = ref(MoUitls.$mo.randomString())
    // 粘贴图片
    const customImgForPaste = (node: HTMLImageElement, delta: Delta) => {
      delta.forEach((op: any) => {
        if (op.insert && op.insert.image) {
          let file = MoUitls.$mo.base64ToFile(op?.insert?.image)
          if (file) {
            const formData = new FormData()
            formData.append('files', file)
            // 上传图片
            httpRequest({ file, filename: 'file', onProgress: (e: ProgressEvent) => {} } as any).then((res) => {
              // 获取url
              const link = res.url
              const quill = myQuillEditor.value?.getQuill()
              const range = quill.getSelection(true)
              quill.insertEmbed(range.index, 'image', link)
            })
          }
        }
      })
      delta.ops = []
      return delta
    }

    const options = reactive({
      modules: {
        toolbar: {
          container: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ['clean'],
            ['image']
          ],
          handlers: {
            image: function(value: any) {
              if (value && document) {
                // 调用element图片上传
                const el = document.querySelector(`.editor-img-uploader_${id.value}>.el-upload`) as any
                el.click()
              } else {
                Quill.format('image', true)
              }
            }
          }
        },
        clipboard: {
          matchers: [
            // 粘贴事件和setEditorContents有冲突报错，但在readOnly=true的时候可以正常使用
            // 临时处理方式：需要setEditorContents的地方先将readOnly=true再使用，或者先去掉粘贴功能比如表单编辑的时候
            ['img', customImgForPaste]
          ]
        },
        history: {
          delay: 1000,
          maxStack: 50,
          userOnly: false
        }
      }
    })

    // 图片上传成功返回图片地址
    const handleAvatarSuccess = (res: any, file: any) => {
      // 如果上传成功
      if (res && myQuillEditor.value) {
        if (res.url) {
          // 获取富文本实例
          let quill = toRaw(myQuillEditor.value).getQuill()
          // 获取光标位置
          let length = quill.selection.savedRange.index
          // 插入图片，res为服务器返回的图片链接地址
          quill.insertEmbed(length, 'image', res.url)
          // 调整光标到最后
          quill.setSelection(length + 1)
        }
      } else {
        ElMessage({
          message: '提交失败！',
          type: 'error'
        })
      }
    }
    // 图片上传前拦截
    const beforeAvatarUpload = (file: any) => {
      const type = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg']
      const isJPG = type.includes(file.type)
      const isLt2M = file.size / 1024 / 1024 < 10
      if (!isJPG) {
        ElMessage({
          message: '图片格式错误',
          type: 'success'
        })
      }
      if (!isLt2M) {
        ElMessage({
          message: '上传图片不能超过' + 10 + 'M',
          type: 'success'
        })
      }
      return isJPG && isLt2M
    }

    const httpRequest = async (options: any) => {
      const uploader = getUploader(uploadType.value)
      const result = await uploader.upload(options)
      return result
    }

    const onTextChange = (e: any) => {
      const html = myQuillEditor.value?.getHTML()
      const text = myQuillEditor.value?.getText()
      ctx.emit('update:modelValue', html)
      ctx.emit('change', { html, text })
    }

    return {
      options,
      modelValue,
      // upLoadUrl,
      headers,
      myQuillEditor,
      handleAvatarSuccess,
      beforeAvatarUpload,
      onTextChange,
      httpRequest,
      id,
      disabled1
    }
  }
})
</script>
<style lang="scss">
.editor-img-uploader {
  display: none;
}

.ql-editor {
  min-height: 300px;
  max-height: 500px;

  p {
    display: flex;
    width: 100%;
  }
}

.mo-quill-editor {
  .ql-toolbar.ql-snow .ql-formats {
    margin-right: 0;
  }

  & {
    width: 100%;
  }

  // overflow: hidden;

  .quill-editor-html-box {
    width: 100%;
    height: 100%;
    min-height: 300px;
    max-height: 500px;
    padding: 0px 10px;
    border: 3px solid #eee;
    border-radius: 5px;

    img {
      max-width: 100%;
    }

    & {
      overflow: auto;
    }
  }
}
</style>
