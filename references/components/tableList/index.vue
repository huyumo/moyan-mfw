<template>
  <div class="table-list-box">
    <el-table
      ref="tableRef"
      class="table-list-h"
      :data="tableData1"
      style="width: 100%"
      v-bind="tableProps"
      v-loading="loading"
      :rowkey="rowkey"
      @sort-change="sortChange"
      @select="handleSelect"
      @select-all="handleSelectAll"
    >
      <el-table-column v-if="selection" type="selection" width="55" />
      <template v-for="(item, index) in tableColumn" :key="index">
        <template v-if="showColumn(item)">
          <el-table-column
            :label="item.label"
            :prop="item.prop"
            :width="item.width"
            :minWidth="item.minWidth"
            :key="index"
            :sortable="item.sortable"
            v-bind="item.elProps"
            v-if="item.slot"
          >
            <template #default="scope">
              <slot
                v-if="item.slot"
                :key="scope.row.id"
                :name="`column-${item.prop.replace(/\./g, '_')}`"
                v-bind="scope"
                :value="get(scope.row, item.prop)"
                :prop="item.prop"
              >
              </slot>
            </template>
          </el-table-column>
          <el-table-column
            :label="item.label"
            :prop="item.prop"
            :width="item.width"
            :minWidth="item.minWidth"
            :sortable="item.sortable"
            :formatter="item.formatter"
            v-bind="item.elProps"
            v-else-if="item.component && item.component.name"
          >
            <template #default="scope">
              <component
                :is="item.component.name"
                :value="get(scope.row, item.prop)"
                v-bind="item.component && item.component.elProps ? item.component.elProps : {}"
                v-on="item.component && item.component.on ? item.component.on : {}"
              ></component>
            </template>
          </el-table-column>
          <el-table-column
            :label="item.label"
            :prop="item.prop"
            :width="item.width"
            :minWidth="item.minWidth"
            :sortable="item.sortable"
            :formatter="item.formatter"
            v-bind="item.elProps"
            v-else
          >
          </el-table-column>
        </template>
      </template>
      <slot name="default"></slot>
      <el-table-column
        v-if="tableRowHandle.show"
        :width="tableRowHandle.width"
        label="操作"
        :fixed="tableRowHandle.fixed"
      >
        <template v-if="columnControl" #header>
          <div class="table-row-handle-cell">
            <span>操作</span>
            <el-button text @click="openColumnControl">
              <i class="table-row-handle-icon mo-icon icon-jichu_gengduoshuiping"></i
            ></el-button>
          </div>
        </template>
        <!-- <template #default="scope">
          <template v-if="isDropdown">
            <template v-for="(item, index) in tableRowHandle.dropdown?.atLeast" :key="index">
              <auth-button class="button-simple" @click="handleButtons[index].onclick(scope)"
                v-if="showButton(handleButtons[index], scope)" :elProps="{
                  disabled: disabledButton(handleButtons[index], scope),
                  type: getHandleButtonType(handleButtons[index].type, scope, index),
                  text: getHandleButtonStr(handleButtons[index].text, scope, index)
                }" :auth_node_key="handleButtons[index].auth_node_key">
              </auth-button>
            </template>

            <el-popover popper-class="tabel-list-popover" placement="left" effect="light" width="auto" :hide-after="100"
              trigger="hover">
              <template #reference>
                <el-button class="button-simple" :type="tableRowHandle.dropdown?.type">
                  <i v-if="tableRowHandle.dropdown?.icon" class="mo-icon" :class="tableRowHandle.dropdown?.icon"></i>
                  {{ tableRowHandle.dropdown?.text }}
                </el-button>
              </template>
              <template #default>
                <template v-for="(item, index) in handleButtons.length" :key="index">
                  <auth-button class="button-simple" @click="handleButtons[index].onclick(scope)" v-if="
                    index + 1 >
                    (tableRowHandle.dropdown && tableRowHandle.dropdown.atLeast
                      ? tableRowHandle.dropdown.atLeast
                      : 1) && showButton(handleButtons[index], scope)
                  " :elProps="{
                    disabled: disabledButton(handleButtons[index], scope),
                    type: getHandleButtonType(handleButtons[index].type, scope, index),
                    text: getHandleButtonStr(handleButtons[index].text, scope, index)
                  }" :auth_node_key="handleButtons[index].auth_node_key">
                  </auth-button>
                </template>
              </template>
            </el-popover>
          </template>
          <template v-else>
            <template v-for="(item, index) in handleButtons" :key="index">
              <auth-button class="button-simple" @click="item.onclick(scope)" v-if="showButton(item, scope)" :elProps="{
                disabled: disabledButton(item, scope),
                type: getHandleButtonType(item.type, scope, index),
                text: getHandleButtonStr(item.text, scope, index)
              }" :auth_node_key="item.auth_node_key">
              </auth-button>
            </template>
          </template>
        </template> -->
        <template #default="scope">
          <template v-if="isDropdown && tableRowHandle.dropdown?.atLeast">
            <template v-for="(item, index) in getDropdownButtons(handleButtons, scope)" :key="index">
              <auth-button
                class="button-simple"
                @click="item.onclick(scope)"
                :elProps="{
                  disabled: disabledButton(item, scope),
                  type: getHandleButtonType(item.type, scope, index),
                  text: getHandleButtonStr(item.text, scope, index)
                }"
                :auth_node_key="item.auth_node_key"
              >
              </auth-button>
            </template>

            <el-popover
              popper-class="tabel-list-popover"
              v-if="getRowHandleButtons(handleButtons, scope).length > tableRowHandle.dropdown.atLeast"
              placement="left"
              effect="light"
              width="auto"
              :hide-after="100"
              trigger="hover"
            >
              <template #reference>
                <el-button class="button-simple" :type="tableRowHandle.dropdown?.type">
                  <i v-if="tableRowHandle.dropdown?.icon" class="mo-icon" :class="tableRowHandle.dropdown?.icon"></i>
                  {{ tableRowHandle.dropdown?.text }}
                </el-button>
              </template>
              <template #default>
                <template v-for="(item, index) in getRowHandleButtons(handleButtons, scope)" :key="index">
                  <auth-button
                    class="button-simple"
                    @click="item.onclick(scope)"
                    v-if="
                      index + 1 >
                        (tableRowHandle.dropdown && tableRowHandle.dropdown.atLeast
                          ? tableRowHandle.dropdown.atLeast
                          : 1)
                    "
                    :elProps="{
                      disabled: disabledButton(item, scope),
                      type: getHandleButtonType(item.type, scope, index),
                      text: getHandleButtonStr(item.text, scope, index)
                    }"
                    :auth_node_key="item.auth_node_key"
                  >
                  </auth-button>
                </template>
              </template>
            </el-popover>
          </template>
          <template v-else>
            <template v-for="(item, index) in handleButtons" :key="index">
              <auth-button
                class="button-simple"
                @click="item.onclick(scope)"
                v-if="showButton(item, scope)"
                :elProps="{
                  disabled: disabledButton(item, scope),
                  type: getHandleButtonType(item.type, scope, index),
                  text: getHandleButtonStr(item.text, scope, index)
                }"
                :auth_node_key="item.auth_node_key"
              >
              </auth-button>
            </template>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-list-box-footer" v-loading="pageTotal.loading">
      <el-pagination
        background
        v-if="!hidePagination && !pageTotal.loading"
        layout="sizes,total, prev, pager, next"
        :total="pageTotal.total"
        :page-sizes="[20, 50, 100]"
        v-model:currentPage="requestParams.page"
        :page-count="pageCount"
        v-model:page-size="requestParams.limit"
        @size-change="exePageRequest(requestParams)"
        @current-change="exePageRequest(requestParams)"
      >
      </el-pagination>
      <div class="table-list-box-footer_other">
        <slot name="footerMain"></slot>
      </div>
      <el-button-group class="table-list-footer-button-group" type="primary">
        <slot name="footerButtonGroup"> </slot>
        <el-button v-if="columnControl" bg @click="openColumnControl">
          <i class="table-row-handle-icon mo-icon icon-jichu_fenlei2"></i>
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { defineComponent, toRef, PropType, ref, Ref, inject, computed, SetupContext, getCurrentInstance, nextTick } from 'vue'
import { TableColumn, TableRowHandle, RowHandleItme, ColumnControl, TableListDefaultConfig } from './type'
import { getHandleButtons } from './handlers'
import { lodash } from './uitl'
import MoPopup from '../popup'
import ColumnControlVue from './columnControl.vue'
import { DB } from '@/lib/uilt.db'
import { useRouter } from 'vue-router'
import { $Mo } from '@/lib/uilt.mo'
import type { TableInstance, TableProps } from 'element-plus'
import { storePermission } from '@/common/use/store/permission'
import { testAuth } from '@/router/authentication'

const get = lodash.get
const ctx = getCurrentInstance();
const emit = defineEmits(['tableDataLoad', 'selection-change'])
const props = defineProps({
  rowkey: { type: String, default: 'id' },
  tableProps: Object as PropType<Partial<TableProps<any>>>,
  selection: Boolean,
  tableRowHandle: Object,
  selectionData: Array,
  performManually: Boolean, // 手动执行
  // tableData: Object,
  tableColumn: Array as PropType<TableColumn>,
  pageRequest: Function,
  hidePagination: Boolean,
  asyncCount: Boolean,
  columnControl: { type: Object as PropType<ColumnControl> }
})

const tableRef = ref<TableInstance>()
const tableRowHandle = toRef(props, 'tableRowHandle') as Ref<TableRowHandle>
const tableColumn = toRef(props, 'tableColumn', [])
const tableProps = toRef(props, 'tableProps', { border: false })
const pageRequest = toRef(props, 'pageRequest')
const selectionData = inject<Ref<Array<any>>>('selectionData', ref([]))
const selectionMap :Map<string,any>= new Map()
const tableData1 = ref([])
const fullPath = useRouter().currentRoute.value.fullPath
const loading = inject<Ref<boolean>>('loading', ref(false))
const columnControl = ref(Object.assign({}, TableListDefaultConfig.columnControl))
const pageCount = computed(() => {
  return pageTotal.value.total / requestParams.value.limit > 1000 ? 1000 : Math.ceil(pageTotal.value.total / requestParams.value.limit)
})

const pageTotal = ref({
  total: 0,
  loading: false
})
if (typeof props.columnControl !== 'undefined') {
  columnControl.value = props.columnControl
}

const options = tableColumn.value.reduce(
  (a, b, index) => {
    if (!columnControl.value) return a
    if (columnControl.value.display === 'alone') {
      if (b.display) {
        a.display.push(b.prop)
      }
    } else {
      a.display.push(b.prop)
    }
    a.all.push(b.prop)
    b.sortNumber = index
    return a
  },
  { all: [] as string[], display: [] as string[] }
)

const checkedKeys = ref<string[]>([])
const listKey = $Mo.strToHash(`${fullPath}_${options.all.join('_')}`)
const sort = ref<string[]>([])
const handleShowColumn = () => {
  const db: DB = new DB()
  const cache = db.get(listKey, options)
  checkedKeys.value = cache.display
  sort.value = cache.all
  tableColumn.value.forEach((item) => {
    item.sortNumber = sort.value.findIndex((key: string) => item.prop === key)
  })
  tableColumn.value.sort((a, b) => {
    return (a.sortNumber || 0) - (b.sortNumber || 0)
  })
}

handleShowColumn()

const requestParams = ref<{
  page: number
  limit: number
  keyword?: string
  total?: number
  $order_by_field?: string
  $order_by_sort?: 'DESC' | 'ASC'
}>({
  page: 1,
  limit: 20,
  total: 0
})

const exePageRequest = async (value: any) => {

  if (typeof pageRequest.value === 'function') {
    loading.value = true
    if (props.asyncCount) {
      pageTotal.value.loading = true
    }
    const result = await pageRequest.value(value, pageTotal).finally(() => {
      loading.value = false
    })

    tableData1.value = result && result.rows ? result.rows || [] : []
    if (props.asyncCount) {
      // pageTotal.value.loading = !!result.loading
      // pageTotal.value.total = pageTotal.value.total || result.total
    } else {
      pageTotal.value.total = result.total
    }
    emit('tableDataLoad', tableData1)
    nextTick().then(()=>{
      selectionMap.forEach((row)=>{
        const row1 = tableData1.value.find((item)=>{return item[props.rowkey]===row[props.rowkey]})
       row1 && tableRef.value!.toggleRowSelection(row1,true)
      })
    })

  }
}

const handelShowColumn = (item: any) => {
  if (typeof item.show === 'function') {
    return item.show(item)
  } else if (typeof item.show === 'boolean') {
    return item.show
  }
  return true
}

const showColumn = (item: any) => {
  const display = checkedKeys.value.includes(item.prop)
  if (!display && !!columnControl.value) return false
  return handelShowColumn(item)
}

const exeFun = (formData: any) => {
  requestParams.value = formData
  exePageRequest(requestParams.value)
}

const defaultTableListOptions = {
  fun: exeFun,
  exe: () => {
    defaultTableListOptions.fun({
      page: 1,
      limit: 20
    })
  }
}

const injectOptions = inject('tableListOptions', defaultTableListOptions)

injectOptions.fun = exeFun
!props.performManually && injectOptions.exe()

const handleButtons = ref(getHandleButtons(tableRowHandle.value, ctx))

const showButton = (rowHandleItme: RowHandleItme, scope: any) => {
  if(rowHandleItme.auth_node_key){
    const buttonOption = storePermission.activeRoute?.value.meta.pageAuthTags[rowHandleItme.auth_node_key]
    if( !testAuth(buttonOption?.id)){
      return false
    }
  }

  let show = false
  if (typeof rowHandleItme.show === 'function') {
    show = rowHandleItme.show(scope)
  } else {
    show = !!rowHandleItme.show
  }
  if (show) {
    scope.displayedButtons = scope.displayedButtons || new Set()
    scope.displayedButtons.add(rowHandleItme.emit)
  }
  return show
}

const disabledButton = (rowHandleItme: RowHandleItme, scope: any) => {
  if (typeof rowHandleItme.disabled === 'function') {
    return rowHandleItme.disabled(scope) || false
  }
  return rowHandleItme.disabled || false
}

const getHandleButtonStr = (
  text: string | null | ((scope: any, index: number) => string) | undefined,
  scope: any,
  index: number
) => {
  if (typeof text === 'function') {
    return text(scope, index)
  } else {
    return text
  }
}

const getHandleButtonType = (
  type: string | null | ((scope: any, index: number) => string) | undefined,
  scope: any,
  index: number
) => {
  if (typeof type === 'function') {
    return type(scope, index)
  } else {
    return type
  }
}

const isDropdown = ref(false)

if (tableRowHandle.value.dropdown && tableRowHandle.value.dropdown.atLeast) {
  tableRowHandle.value.dropdown = Object.assign(
    {
      atLeast: 1,
      text: '更多',
      type: 'primary',
      icon: 'icon-gengduo2'
    },
    tableRowHandle.value.dropdown
  )
  isDropdown.value = true
}

const onView = (e: any) => { }

const sortChange = (e: any) => {
  if (e && e.column && typeof e.column.sortable === 'string' && e.order) {
    requestParams.value.$order_by_field = e.column.sortable
    requestParams.value.$order_by_sort = e.order === 'descending' ? 'DESC' : 'ASC'
  } else {
    requestParams.value.$order_by_field = undefined
    requestParams.value.$order_by_sort = undefined
  }

  exeFun(requestParams.value)
}



const handleSelect = (e:any[],row:any)=>{
  const key = props.rowkey
  tableData1.value.forEach((item:any)=>{
    selectionMap.delete(item[props.rowkey])
    e.some((item1)=>item1[key]===item[key]) && selectionMap.set(item[key],item)
  })
  selectionData.value = [...selectionMap.values()]
  ctx?.emit('selection-change', selectionData.value)
}

const handleSelectAll = (e:any[])=>{
  const key = props.rowkey
  tableData1.value.forEach((item:any)=>{
    selectionMap.delete(item[props.rowkey])
    e.some((item1)=>item1[key]===item[key]) && selectionMap.set(item[key],item)
  })
  selectionData.value = [...selectionMap.values()]
  ctx?.emit('selection-change', selectionData.value)
}

const openColumnControl = () => {
  MoPopup.open({
    title: '列设置',
    component: ColumnControlVue,
    popupProps: { size: 300 },
    elProps: {
      context: listKey,
      tableColumn: tableColumn.value
        .map((item) => {
          return { prop: item.prop, label: item.label, show: handelShowColumn(item) }
        })
        .filter((item) => item.show),
      checkedKeys: $Mo.clone(checkedKeys.value),
      sort: $Mo.clone(sort.value)
    },
    on: {
      confirm: (data) => {
        console.log(data)
        handleShowColumn()
      }
    }
  })
}

const getRowHandleButtons = (handleButtons: ({
  icon: string;
  onclick: (scope: any) => void;
} & RowHandleItme)[], scope: any) => {
  if(scope.row.allButtons) return scope.row.allButtons
  const allButtons = handleButtons.filter((item) => showButton(item, scope))
  Object.defineProperties(scope.row, {
    allButtons:{
      value: allButtons,
      writable: false,
      enumerable: false,
      configurable: true
    },
    allButtonsLength:{
      value: allButtons.length,
      writable: false,
      enumerable: false,
      configurable: true
    }
  })
  return scope.row.allButtons
}

const getDropdownButtons = (handleButtons: ({
  icon: string;
  onclick: (scope: any) => void;
} & RowHandleItme)[], scope: any) => {
  if( scope.row.dropdownButtons) return  scope.row.dropdownButtons
  const allButtons = getRowHandleButtons(handleButtons, scope)
  let newButtons = allButtons
  if (tableRowHandle.value.dropdown?.atLeast && allButtons.length >= tableRowHandle.value.dropdown.atLeast) {
    newButtons = allButtons.slice(0, tableRowHandle.value.dropdown.atLeast)
  }
  Object.defineProperty(scope.row, 'dropdownButtons', {
    value: newButtons,
    writable: false,
    enumerable: false,
    configurable: true
  })
  return  scope.row.dropdownButtons
}
</script>
<style lang="scss">
.table-list-box-footer {
  padding: 0 10px;
}

.el-popover.tabel-list-popover {
  padding: 5px 10px;
  width: auto;
  min-width: 50px;
  height: 44px;
}

.table-row-handle-cell {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-content: center;

  // position: relative;
  > span {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .el-button {
    position: absolute;
    right: 0;
    top: 10px;
  }
}

.table-row-handle-icon {
  font-size: 20px;
}

.table-list-footer-button-group {
  .el-button {
    padding: 0px 5px;
  }
}
</style>
