import { defineComponent, onMounted, PropType, ref } from 'vue'
import { SimpleDocument, GetTableColumnFun, GetEditTemplateFun, ProtocolTypes } from '@/components/simpleDocument'
import { config } from '@/config'
import { ApiSimpleDocumentGetOnlyKeys } from "@/apis/micro-system";
import { SearchFormTemplateArray } from '../formCard/type';
import { activeApp } from './use';

export default defineComponent({
  props: {
    protocolTypes: {
      type: Array as PropType<ProtocolTypes>,
      default: () => []
    },
    docKey: {
      type: String,
      default: 'documentProtocol'
    },
    customSearchFormTemplate: Array as PropType<SearchFormTemplateArray>,
    appDict: { type: Array as PropType<ProtocolTypes> }
  },
  name: 'ProtocolPage',
  setup(props) {

    const protocolTypes = ref(props.protocolTypes || [])

    const getOnlyKeys = () => {
      new ApiSimpleDocumentGetOnlyKeys({ params: { doc_key: props.docKey, source_app: activeApp.value } }).then((ret) => {
        protocolTypes.value = props.protocolTypes.filter((item) => {
          return !ret.includes(item.value)
        })
      })
    }

    const getTableColumnFun: GetTableColumnFun<typeof SimpleDocument> = (vm) => {
      return [
        {
          prop: 'title',
          label: '协议名称',
          width: 200
        },
        { prop: 'content', label: '协议内容', show: false },
        { prop: 'only_key', label: '', show: false },
        {
          prop: 'summary',
          label: '协议内容'
        }
      ]
    }

    const getEditTemplateFun: GetEditTemplateFun = () => {
      return [
        {
          key: 'app_id',
          label: '应用',
          type: 'el-select-v2',
          show: !!props.appDict,
          value: activeApp,
          disabled: true,
          elProps: { options: props.appDict, placeholder: '应用' },
          rules: { required: true, message: '应用不能为空', type: 'string' }
        },
        {
          key: 'only_key',
          label: '调用key',
          type: 'el-select-v2',
          elProps: { options: protocolTypes },
          rules: { required: true, message: '调用key不能为空', type: 'string' },
          change: (scope) => {
            const item = props.protocolTypes?.find((item) => { return item.value === scope.value }) || { value: '', label: '' }
            scope.formData.title = item.label
          },
          show: (scope) => !scope.formData.id && config.debug
        },
        {
          key: 'title',
          label: '协议名称',
          type: 'el-input',
          rules: { required: true, message: '协议名称不能为空', type: 'string' }
        },
        {
          key: 'content',
          label: '协议内容',
          type: 'quill-editor',
          rules: { required: true, message: '标签文案不能为空', type: 'string' }
        }
      ]
    }


    onMounted(getOnlyKeys)

    return { getTableColumnFun, getEditTemplateFun, getOnlyKeys }
  },
  render() {
    return <SimpleDocument
      getTableColumnFun={this.getTableColumnFun}
      getEditTemplateFun={this.getEditTemplateFun}
      doc_key={this.docKey}
      showAdd={() => config.debug}
      showDel={() => config.debug}
      onSave={this.getOnlyKeys}
      onDel={this.getOnlyKeys}
      onGetList={this.getOnlyKeys}
      customSearchFormTemplate={this.customSearchFormTemplate}
    >
    </SimpleDocument>
  }
})
