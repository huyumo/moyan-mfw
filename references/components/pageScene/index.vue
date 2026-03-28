<template>
  <div class="mo-form-stlye page-scene-main-box">
    <el-header class="scene-header" v-if="!hiddenHeader">
      <div class="filter-row">
        <slot name="header"></slot>
      </div>
      <div class="advanced-options">
        <div>
          <el-button v-if="useSearchPanel" @click="advancedPanel.openAdvancedPanel" type="primary" :icon="Search"
            >高级</el-button
          >
          <el-button @click="refreshHandler" type="primary" :icon="Refresh"></el-button>
        </div>
      </div>
    </el-header>
    <div class="page-component-main">
      <slot></slot>
    </div>
    <el-drawer v-model="advancedPanel.drawer" direction="rtl" :before-close="advancedPanel.handleClose">
      <template #title>
        <div class="flex-space-between">
          <span class="ft-16">高级筛选</span>
          <el-button
            class="button-simple"
            style="margin-right:10px"
            @click="refreshHandler"
            type="success"
            :icon="Refresh"
            >重置</el-button
          >
        </div>
      </template>
      <div class="search-panel-content">
        <div class="search-panel-slot">
          <slot name="search-panel"></slot>
        </div>
        <!-- <div class="search-panel-footer">
          <div>
            <el-button @click="searchConfirmHandler" type="primary" :icon="Search">搜索</el-button>
            <el-button @click="refreshHandler" type="success" :icon="Refresh">重置</el-button>
          </div>
        </div> -->
      </div>
    </el-drawer>
  </div>
</template>
<script lang="ts">
import { defineComponent, toRef, ref, watch } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import { MoUitls } from '@/lib/uilt.mo'

export default defineComponent({
  emits: ['refresh', 'search-panel-close', 'search-panel-confirm'],
  props: {
    hiddenHeader: { type: Boolean, default: false }, // 是否隐藏头
    useSearchPanel: { type: Boolean, default: false }, // 是否使用高级搜索
    searchForm: { type: Object, default: () => {} } // 搜索表单
  },
  setup(props, { emit }) {
    const hiddenHeader = toRef(props, 'hiddenHeader')
    const useSearchPanel = toRef(props, 'useSearchPanel')
    const searchForm = toRef(props, 'searchForm') // 搜索表单
    const searchFormBak = MoUitls.$mo.clone(searchForm.value)
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

    /**
     * 刷新操作 , 重置搜索数据
     */
    const refreshHandler = () => {
      emit('refresh', MoUitls.$mo.clone(searchFormBak))
    }

    /**
     * 高级搜索面板确认
     */
    const searchConfirmHandler = () => {
      advancedPanel.value.drawer = false
      emit('search-panel-confirm')
    }

    return {
      hiddenHeader,
      useSearchPanel,
      advancedPanel,
      searchForm,
      Refresh,
      Search,
      refreshHandler,
      searchConfirmHandler
    }
  }
})
</script>
