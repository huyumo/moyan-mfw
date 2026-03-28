<template>
  <div class="mo-form-stlye page-scene-main-box">
    <el-header class="scene-header" v-if="!hiddenHeader">
      <div class="filter-row">
        <div class="custom-header-left">
          <slot name="header-left"></slot>
        </div>
        <form-bar :form-data="formData" :template="searchFormTemplate" @change="formCard.searchFormChange"></form-bar>
        <div class="custom-header-box">
          <slot name="header"></slot>
        </div>
      </div>
      <div class="advanced-options">
        <!-- <div> -->
        <el-button v-if="useSearchPanel" @click="advancedPanel.openAdvancedPanel" type="success" :icon="Search"
          >高级</el-button
        >
        <el-button
          @click="doSearch"
          v-loading="loading"
          v-if="searchFormTemplate.length > 0"
          type="primary"
          plain
          :icon="Search"
        ></el-button>
        <el-button @click="refreshHandler" v-loading="loading" type="primary" :icon="Refresh"></el-button>
        <!-- </div> -->
      </div>
    </el-header>
    <div class="filter-panel" v-if="showFilterPanel">
      <span>条件：</span>
      <el-tag v-for="(item, index) in viewTexts" :key="index">{{ item.label }}:{{ item.value }}</el-tag>
    </div>
    <div class="page-component-main">
      <slot></slot>
    </div>
    <el-drawer v-model="advancedPanel.drawer" size="500" direction="rtl" :before-close="advancedPanel.handleClose">
      <template #title>
        <div class="flex-space-between">
          <span class="ft-16">高级筛选</span>
          <el-button
            v-loading="loading"
            class="button-simple"
            style="margin-right:10px"
            @click="refreshHandler"
            type="primary"
            :icon="Refresh"
            >重置</el-button
          >
        </div>
      </template>
      <div class="search-panel-content">
        <div class="search-panel-slot">
          <slot v-if="slots['search-panel']" name="search-panel"></slot>
          <div v-else>
            <FormCardVue
              :form-data="formData"
              :pChange="advancedPanel.drawer"
              :template="searchFormTemplate"
              @change="formCard.searchFormChange"
            ></FormCardVue>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="subPagePanel.drawer"
      direction="rtl"
      :before-close="subPagePanel.handleClose"
      size="800px"
      append-to-body
      :title="subPagePanel.options.title"
    >
      <template v-if="subPagePanel.drawer">
        <component
          :is="subPagePanel.options.component"
          v-bind="subPagePanel.options.props"
          v-on="subPagePanel.options.on"
        ></component>
      </template>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { defineComponent, toRef, ref, PropType, computed, provide, reactive, inject } from 'vue'
import { Refresh, Search, Eleme } from '@element-plus/icons-vue'
import { SearchFormTemplateArray } from '../formCard/type'
import { handleSetTextFun, getViewTexts, searchStr } from './handlers'
import FormCardVue from '../formCard/index.vue'

const slots = defineSlots()
const emit = defineEmits(['refresh', 'search', 'search-panel-close', 'sub-page-panel-close'])
const props = defineProps({
  hiddenHeader: { type: Boolean, default: false }, // 是否隐藏头
  searchForm: { type: Object, default: () => {} }, // 搜索表单
  showFilterPanel: Boolean,

  /**
   * 搜索模板
   */
  searchFormTemplate: {
    type: Array as PropType<SearchFormTemplateArray>,
    default: () => {
      return []
    }
  },
  searchFormData: Object as any
})

const hiddenHeader = toRef(props, 'hiddenHeader')
const showFilterPanel = toRef(props, 'showFilterPanel', false)
const searchFormTemplate = toRef(props, 'searchFormTemplate', [])
const useSearchPanel = ref(false)
const searchFormData = toRef(props, 'searchFormData')
const loading = ref(false)

const formData = inject('searchFormData',ref(
  searchFormData.value || {
    page: 1,
    limit: 20,
    total: 0
  }
)) 

const tableListOptions = reactive({
  subComponentFuns: new Map() as Map<string, (params: Record<string, any>) => void>,
  fun: (params: Record<string, any>) => {},
  exe: (fun?: (params: Record<string, any>) => void) => {
    if (!loading.value) {
      if (fun) {
        fun(formData.value)
      } else {
        tableListOptions.fun(formData.value) // 执行tableList 请求接口的默认方法
        const funs = [...tableListOptions.subComponentFuns.values()]
        funs.forEach((fun) => fun(formData.value))
      }
    }
  }
})

handleSetTextFun(searchFormTemplate.value)

/**
 * 高级搜索模板
 */
const advancedPanel = ref({
  drawer: ref(false),
  openAdvancedPanel() {
    advancedPanel.value.drawer = true
  },
  handleClose(done: Function) {
    done()
    emit('search-panel-close')
  }
})

const subPagePanel = ref({
  title: ref(''),
  drawer: ref(false),
  options: { title: '', component: null as any, props: {}, on: {} },
  open(options: { title?: string; component: any; props?: { [key: string]: any }; on?: { [key: string]: Function } }) {
    subPagePanel.value.options = Object.assign({}, subPagePanel.value.options, options)
    subPagePanel.value.drawer = true
  },
  handleClose(done: Function) {
    done()
    emit('sub-page-panel-close')
  },
  close() {
    subPagePanel.value.drawer = false
  }
})

/**
 * 刷新操作 , 重置搜索数据
 */
const refreshHandler = () => {
  const data: any = {}
  /**
   * 重置筛选条件tag 数据
   */
  searchFormTemplate.value.forEach((item) => {
    data[item.key] = item.value
    item.viewText = {
      label: item.label || '',
      value: ''
    }
    item.setViewText &&
      item.value &&
      item.setViewText({ row: item, key: item.key, value: item.value, formData: { [item.key]: item.value } })
  })

  formData.value.total = 0
  formData.value.page = 1
  /**
   * 重置form 数据
   */

  Object.assign(formData.value, data)
  // emit('search', {
  //   value: '',
  //   key: undefined,
  //   row: undefined,
  //   formData: formData.value,
  //   type: 'refresh'
  // })

  emit('refresh', formData.value)
  setSearchStr()
}

const setSearchStr = () => {
  !loading.value && tableListOptions.exe()
}

const formCard = {
  searchFormTemplate,
  searchFormChange: (e: any) => {
    emit('search', e.formData)
    // emit('refresh', formData.value)
    setSearchStr()
  }
}

useSearchPanel.value = formCard.searchFormTemplate.value.some((item) => {
  return !(item.headerBar && item.headerBar.show)
})

/**
 * 添加标签计算属性
 */
const viewTexts = computed(() => {
  return getViewTexts(searchFormTemplate.value)
})

const doRefresh = () => {
  refreshHandler()
}

const doSearch = () => {
  console.log('-----------doSearch-----------')

  emit('search', formData.value)
  setSearchStr()
}

const exec = () => {
  emit('refresh', formData.value)
}

provide('subPagePanel', subPagePanel.value)
provide('doRefresh', doRefresh)
provide('tableListOptions', tableListOptions)
provide('loading', loading)
defineExpose({
  exec,
  doSearch,
  doRefresh,
  subPagePanel
})
</script>
