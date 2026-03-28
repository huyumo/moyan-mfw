import { computed, defineComponent, PropType, ref, Ref, toRef, watch } from 'vue'
import { ElMessage, UploadProps } from 'element-plus'

export const getFileFilter = (props: any, defaultSize: number = 50 * 1024 * 1024, defaultType: Array<string> = []) => {
  const maxSize = computed(() => props.maxSize || defaultSize)
  const fileType = computed<string[]>(() => props.fileType || defaultType)

  const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
    if (!Array.isArray(fileType.value)) {
      ElMessage.error(`允许上传的文件格式为参数应该为数组，得到的却是字符串${fileType.value}`)
    }
    if (fileType.value.length > 0) {
      const t = !fileType.value.some((item) => {
        const s = rawFile.name.split('.').pop()
        return s == item || rawFile.type.indexOf(item) > -1
      })

      if (t) {
        ElMessage.error(`允许上传的文件格式为${fileType.value.join('、')}`)
        return false
      }
    } else if (rawFile.size > maxSize.value) {
      ElMessage.error(`文件不能超过${maxSize.value / 1024 / 1024}MB`)
      return false
    }

    return true
  }

  return {
    beforeAvatarUpload
  }
}
