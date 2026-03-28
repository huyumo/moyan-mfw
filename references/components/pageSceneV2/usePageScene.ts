import { $Mo } from '@/lib/uilt.mo'
import { inject, onDeactivated, onMounted, ref, computed } from 'vue'

export const usePageScene = (eventExeFun: (params: Record<string, any>) => void) => {
  const pageSceneV2SubRef = ref()
  const defaultTableListOptions = {
    subComponentFuns: new Map() as Map<string, (params: Record<string, any>) => void>,
    fun: (params: any) => { },
    exe: (fun?: (params: Record<string, any>) => void) => {
      if (fun) {
        fun({})
      } else {
        defaultTableListOptions.fun({}) // 执行tableList 请求接口的默认方法
        const funs = [...defaultTableListOptions.subComponentFuns.values()]
        funs.forEach((fun) => fun({}))
      }
    }
  }


  const injectOptions = inject('tableListOptions', defaultTableListOptions)
  const _id = $Mo.numbering()
  const id = computed(() => {
    return pageSceneV2SubRef.value?.id || _id
  })

  onMounted(() => {
    injectOptions.subComponentFuns.set(id.value, eventExeFun)
    injectOptions.exe(eventExeFun)
  })

  onDeactivated(() => {
    injectOptions.subComponentFuns.delete(id.value)
  })
  return {
    pageSceneV2SubRef
  }
}
