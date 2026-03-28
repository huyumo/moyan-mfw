<template>
  <page-scene class="tabs-page-scene" hiddenHeader="false">
    <el-tabs v-model="activeName" style="margin:0 20px;height: 100%;" class="tabs-page" @tab-change="handleClick">
      <el-tab-pane :label="page.title" :name="page.title" v-for="(page, index) in pages" :key="index">
        <component :is="page.component" v-if="opendPage.has(page.title)"></component>
      </el-tab-pane>
    </el-tabs>
  </page-scene>
</template>
<script lang="ts">
import { title } from 'process'
import { DefineComponent, PropType, Ref, VNode, defineComponent, onMounted, ref, toRef, onActivated } from 'vue'
import { PageComponent } from './type'
import { useRoute } from 'vue-router'
export default defineComponent({
  name: 'tabs-page',
  props: { pages: { type: Array as PropType<Array<{ component: PageComponent; title: string; active?: boolean }>> } },
  components: {},
  setup(props) {
    const route = useRoute()

    const pages = toRef(props, 'pages')
    const last = props.pages ? props.pages[0] : { title: '---' }
    const activeName = ref(route.query.tp_title || props.pages?.find((page) => page.active)?.title || last.title)

    const opendPage = new Set()
    activeName.value && opendPage.add(activeName.value)
    const handleClick = (tab: string) => {
      opendPage.add(tab)
    }

    onActivated(() => {
      activeName.value = route.query.tp_title || props.pages?.find((page) => page.active)?.title || last.title
    })

    return { activeName, handleClick, opendPage, pages }
  }
})
</script>
<style lang="scss">
.tabs-page-scene {
  padding: 0;
  .page-scene-main-box {
    padding: 0;
  }
  .table-list-box .table-list-box-footer {
    padding: 0;
  }
}
</style>
