import { storeUser } from "@/common/use/store/user"
import { $Mo } from "@/lib/uilt.mo"
import { ElMessageBox } from "element-plus"
import { onMounted, ref, Ref, toRef, watch, defineExpose } from "vue"
import { useRoute } from "vue-router"

export const useDraftDox = (options: {
  props: Record<string, any>,
  mode: Ref<'add' | 'edit' | 'view'>,
  formTemplate: Ref<any>,
  formGroup: Ref<any>,
  formData: Ref<Record<string, any>>,
  initTemplateItem: (item: any) => void,
  emit:(event:any,...args: any[])=>void
}
) => {

  const { mode,props, formTemplate, formGroup, formData, initTemplateItem ,emit} = options
  const dataLoad = ref(false)
  const hash = ref('') // 用于缓存表单数据

  /**
   * 初始化hash
   */
  const initHash = () => {
    const keys1 = formTemplate.value.map((item: any) => {
      return item.label + item.type + item.key
    })
    const keys2 = formGroup.value?.groups?.map((item: any) => {
      return item?.template?.map((item2: any) => {
        return item2.label + item2.type + item2.key
      }) || []
    }) || []

    const route = useRoute()

    const keys = [...keys1, ...keys2]
    hash.value = $Mo.md5(JSON.stringify({ keys, path: route.fullPath }))
  }



  /**
 * 加载草稿数据
 */
  const loadCache = async () => {
    if (props.draftDox && mode.value == 'add') {
      const cache = storeUser.db.get('formCardData_' + hash.value)
      // 检查缓存数据是否与formData.value一致
      if (cache && JSON.stringify(cache) !== JSON.stringify(formData.value)) {
        await ElMessageBox.confirm('有未保存的数据存放在草稿箱，是否加载草稿数据？', '提示', {
          type: 'primary',
          confirmButtonText: '加载草稿箱数据',
          cancelButtonText: '不加载',
        })
        Object.assign(formData.value, cache)
        // formData.value = cache
        formTemplate.value.forEach(initTemplateItem)
        dataLoad.value = true
      } else {
        dataLoad.value = true
      }
    } else {
      dataLoad.value = true
    }
    emit('draftDoxLoad',formData.value)
  }
  /**
   * 清理草稿箱内容
   */
  const clearDraftBox = () => {
    storeUser.db.del('formCardData_' + hash.value)
  }


  watch(formData, () => {
    if (mode.value === 'add' && dataLoad.value) {
      storeUser.db.set('formCardData_' + hash.value, formData.value)
    }
  }, { deep: true })



  // initHash()
  // loadCache()

  return{
    initHash,
    loadCache,
    clearDraftBox
  }
}