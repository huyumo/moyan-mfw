import { TableRowHandle, TableColumn } from '@/components/tableList/type'
import { defineComponent, onMounted, PropType, ref, toRef, reactive } from 'vue'
import { PageSceneV2 } from '@/components/pageSceneV2/type'
import { SearchFormTemplate, FormTemplateArray, SearchFormTemplateArray } from '@/components/formCard/type'
import Edit from './edit'
import { ApiSimpleDocumentDel, ApiSimpleDocumentListByKey } from '@/apis/micro-system'
import { ElMessageBox } from 'element-plus'
import { MoUitls } from '@/lib/uilt.mo'
import { ElMessage } from 'element-plus'
import ProtocolPage from "./protocol"
export { Edit }


/**
 * 拷贝配置
 */
export type CpProp = {
  buttonText?: string // 拷贝按钮显示文字
  handler: (scope: any) => Promise<string> // 点击拷贝按钮的返回要复制的额内容处理方法
}

export type ProtocolTypes = Array<{ value: string, label: string }> // 协议类型字段

export type NodeShowCpButtonProp = (scope: any) => boolean

export const SimpleDocument = defineComponent({
  emits: ['save', 'del', 'getList'],
  props: {
    cp: Object as PropType<CpProp>, // 拷贝配置
    doc_key: String,
    customSearchFormTemplate: Array as PropType<SearchFormTemplateArray>,
    getTableColumnFun: Function as PropType<GetTableColumnFun<any>>,
    getEditTemplateFun: Function as PropType<GetEditTemplateFun>,
    getDelhint: Function as PropType<GetDelhint<any>>,
    nodeShowCpButton: Function as PropType<NodeShowCpButtonProp>, // 动态判断是否显示复制按钮
    showAdd: Function as PropType<NodeShowCpButtonProp>, // 显示添加按钮处理方法
    showDel: Function as PropType<NodeShowCpButtonProp> // 显示删除按钮处理方法
  },
  setup(props, { emit }) {
    const getTableColumnFun = toRef(props, 'getTableColumnFun', (vm) => [])
    const getEditTemplateFun = toRef(props, 'getEditTemplateFun', () => [])
    const getDelhint = toRef(props, 'getDelhint', () => '确定要删除吗？')
    const load = ref(false)
    const doc_key = toRef(props, 'doc_key', 'default')
    const vm = reactive({})
    const cp = toRef(props, 'cp')
    const nodeShowCpButton = toRef(props, 'nodeShowCpButton', () => true)
    const pageScene = ref<PageSceneV2>()
    const tableColumn = ref<TableColumn>([])
    const showAdd = toRef(props, 'showAdd', () => true)
    const showDel = toRef(props, 'showDel', () => true)

    const tableRowHandle = ref<TableRowHandle>({
      show: true,
      width: 210,
      fixed: 'right',
      custom: [
        { show: true, text: '编辑', type: 'primary', emit: 'edit', auth_node_key: 'edit' },
        { show: showDel.value, text: '删除', type: 'danger', emit: 'del', auth_node_key: 'del' },
      ]
    })

    cp.value && tableRowHandle.value.custom?.push({ text: cp.value?.buttonText || '复制地址', type: 'info', show: (scope) => nodeShowCpButton.value(scope), emit: 'cp', auth_node_key: 'cp' })

    const editTemplate = ref<FormTemplateArray>([])

    const { keyword, created_t }: SearchFormTemplate = {
      keyword: {
        label: '标题',
        key: 'keyword',
        type: 'el-input',
        headerBar: {
          show: true,
          width: '160px'
        }
      },
      created_t: {
        label: '添加时间',
        key: 'created_t',
        type: 'el-date-picker',
        elProps: {
          type: 'daterange',
          'startPlaceholder': '开始时间',
          'endPlaceholder': '结束时间',
        },
        headerBar: {
          show: true,
          width: '200px'
        }
      }
    }
    const searchFormTemplate = ref<SearchFormTemplateArray>(props.customSearchFormTemplate || [keyword, created_t])

    const pageRequest = async (e: any) => {
      e.doc_key = doc_key.value
      e.select = ['id'].concat(tableColumn.value.map((item) => {
        return item.prop
      }))
      emit('getList', e)
      return await new ApiSimpleDocumentListByKey({ params: e })
    }

    const addAndEdit = (scope?: any) => {

      pageScene.value?.subPagePanel.open({
        title: '添加',
        component: Edit,
        props: { formData: scope ? MoUitls.$mo.clone(scope.row) : {}, doc_key: doc_key.value, template: MoUitls.$mo.clone(editTemplate.value) },
        on: {
          save: () => {
            emit('save', scope)
            pageScene.value?.doSearch()
          }
        }
      })
    }

    const del = (scope?: any) => {
      ElMessageBox.confirm(getDelhint.value(vm), '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await new ApiSimpleDocumentDel({ params: { ids: [scope.row.id] } })
        emit('del', scope)
        pageScene.value?.doSearch()
      })
    }

    const cpHandler = (scope: any) => {
      cp.value?.handler(scope).then((res: any) => {
        MoUitls.$mo.cpv2(res)
        ElMessage.info(`拷贝:${res}`)
      })
    }


    return {
      pageScene,
      tableColumn,
      tableRowHandle,
      addAndEdit,
      del,
      pageRequest,
      getTableColumnFun,
      getEditTemplateFun,
      load,
      editTemplate,
      doc_key,
      vm,
      cpHandler,
      searchFormTemplate,
      showAdd
    }
  },
  mounted() {
    this.tableColumn = this.getTableColumnFun(this) as any
    this.editTemplate = this.getEditTemplateFun() as any
    this.vm = this
    this.load = true
  },
  render() {
    if (!this.load) return
    return (
      <page-scene-v2 ref="pageScene" showFilterPanel searchFormTemplate={this.searchFormTemplate} use-search-panel v-slots={{
        header: () => {
          return this.showAdd(this) ? (<el-button onClick={() => { this.addAndEdit() }}>添加</el-button>) : undefined
        },
        default: () => {
          return (
            <table-list
              tableColumn={this.tableColumn}
              pageRequest={this.pageRequest}
              tableRowHandle={this.tableRowHandle}
              onEdit={this.addAndEdit}
              onDel={this.del}
              onCp={this.cpHandler}
            ></table-list>
          )
        }
      }}>
      </page-scene-v2>
    )
  }
})

export type GetTableColumnFun<T> = (vm: T) => TableColumn
export type GetEditTemplateFun = () => FormTemplateArray
export type GetDelhint<T> = (vm: T) => string

export default SimpleDocument

export { ProtocolPage }