<template>
  <div>
    <el-tree
      ref="columnControl"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      :data="data"
      draggable
      default-expand-all
      node-key="prop"
      show-checkbox
      :default-checked-keys="checkedKeys"
      @check-change="checkChange"
      @node-drag-end="handleDragEnd"
      @node-drop="handleNodeDrop"
    >
      <template #default="{ node }">
        <div class="custom-tree-node">
          <span>{{ node.label }}</span>
          <i class="mo-icon icon-jichu_paixu"></i>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import{ref,Ref, inject, PropType, toRef} from 'vue'
import type Node from 'element-plus/es/components/tree/src/model/node'
import type { DragEvents } from 'element-plus/es/components/tree/src/model/useDragNode'
import type {  AllowDropType, NodeDropType} from 'element-plus/es/components/tree/src/tree.type'
import { TableColumn } from './type'
import { DB } from '@/lib/uilt.db'



const columnControl = ref()
const emit = defineEmits(['check-change'])
const props = defineProps({
  context:String,
  tableColumn:Array,
  checkedKeys:Array,
  sort:Array
})


const tableColumn= ref(props.tableColumn||[])
const checkedKeys= ref(props.checkedKeys||[])
const sort= ref(props.sort||[])

const allowDrop = (draggingNode: Node, dropNode: Node, type: AllowDropType) => {
  return type !== 'inner' && draggingNode.level===dropNode.level
}
const allowDrag = (draggingNode: Node,dropNode: Node, type: AllowDropType) => {
  return type !== 'inner'
}
const setData =()=>{
  const db: DB = new DB()
  const data = {
      display:checkedKeys.value,
      all:sort.value
    }
  props.context && db.set(props.context,data)
}

const handleDragEnd = (  draggingNode: Node,
  dropNode: Node,
  dropType: NodeDropType,
  ev: DragEvents)=>{
    sort.value = dropNode.parent.childNodes.map((item)=>item.key) as string[]
}

const checkChange = (data:any,e:Node,ee:any)=>{
  checkedKeys.value =columnControl.value.getCheckedKeys()
}

const handleNodeDrop = (draggingNode:Node)=>{
  columnControl.value.setChecked(draggingNode.key, true);
}

const onConfirm = (done:()=>void)=>{
  setData()
  done()
}

defineExpose({onConfirm})

const data = ref([
  {
    label:'列表字段',
    prop:'all',
    children:tableColumn
  }
])
</script>
<style lang="scss" scoped>
.custom-tree-node {
  width: 100%;
  display: flex;
  justify-content: space-between;
  > i {
    display: none;
  }
  &:hover {
    > i {
      display: inline-block;
    }
  }
}
</style>
