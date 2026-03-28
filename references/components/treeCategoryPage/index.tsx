import { defineComponent, onMounted, PropType, ref, toRef, provide } from 'vue'
import { PageSceneV2 } from '@/components/pageSceneV2/type'
import Edit from './edit.vue'
import { ApiTreeCategoryRootByKey, ApiTreeCategoryDel, ApiTreeCategoryUpdateSorts } from '@/apis/micro-system'
import { DtoTreeCategory, TreeCategory, VoTreeCategoryEditBody } from '@/apis/micro-system/schemas'
import { ElMessage, ElMessageBox, } from 'element-plus'
import { ElTree, ElButton } from 'element-plus'
import { MoUitls } from '@/lib/uilt.mo'
import AuthButton from '../permission/authButton'
import ElPageSceneV2 from '@/components/pageSceneV2/index.vue'
import { TreeNode } from 'element-plus/es/components/tree-v2/src/types'
import type Node from 'element-plus/es/components/tree/src/model/node'
import { FormTemplateArray } from '@/components/formCard/type'
import { DefineComponent, VNode } from 'vue'
import { config } from '@/config'
import { NodeDropType } from 'element-plus/es/components/tree/src/tree.type'


export interface TreeScope { node: TreeNode | Node, data: DtoTreeCategory }

export type ExpandFormRowsProp = (scope: { template: FormTemplateArray, formData: VoTreeCategoryEditBody, parentData: VoTreeCategoryEditBody, showIcon: Boolean }) => FormTemplateArray
export type RenderExpandRowProp = (node: TreeNode | Node, data: DtoTreeCategory) => VNode | DefineComponent<any> | Function | DefineComponent | undefined
export type AllowDropProp = (draggingNode: Node, dropNode: Node, type: NodeDropType) => boolean
export type AllowDragProp = (draggingNode: Node) => boolean
export type NodeShowIconProp = (node: TreeNode | Node | null, data: DtoTreeCategory | null, mode: 'add' | 'edit' | 'view') => boolean
export type NodeShowCpButtonProp = (node: TreeNode | Node, data: DtoTreeCategory) => boolean
export type NodeShowRemoveButtonProp = NodeShowCpButtonProp
export type NodeShowAddButtonProp = NodeShowCpButtonProp

/**
 * 根分类配置
 * 如果数据库中没有rootKey的记录则自动创建，categoryName：为创建时传入的分类名称
 */
export type RootProp = { root_key: string; category_name: string, used_table_name?: string[] }

/**
 * 拷贝配置
 */
export type CpProp = {
  buttonText: string // 拷贝按钮显示文字
  handler: (node: TreeNode | Node, data: DtoTreeCategory) => Promise<string> // 点击拷贝按钮的返回要复制的额内容处理方法
}

export default defineComponent({
  props: {
    cp: Object as PropType<CpProp>, // 拷贝配置
    useIcon: Boolean, // 是否使用图标
    root: Object as PropType<RootProp>, // 根分类配置
    nodeShowAddButton: Function as PropType<NodeShowAddButtonProp>, // 动态判断是否显示添加按钮
    nodeShowRemoveButton: Function as PropType<NodeShowRemoveButtonProp>, // 动态判断是否显示删除按钮
    nodeShowCpButton: Function as PropType<NodeShowCpButtonProp>, // 动态判断是否显示复制按钮
    nodeShowIcon: Function as PropType<NodeShowIconProp>, // 动态判断是否显示icon
    nodeShowIconNumber: Number, // 显示icon 数量（1只显示1张，2显示选中和未选择状态的icon）
    allowDrop: Function as PropType<AllowDropProp>, // 请看 https://element-plus.org/zh-CN/component/tree.html#%E5%B1%9E%E6%80%A7
    allowDrag: Function as PropType<AllowDragProp>, // 请看 https://element-plus.org/zh-CN/component/tree.html#%E5%B1%9E%E6%80%A7
    expandFormRows: Function as PropType<ExpandFormRowsProp>,// 扩展表单内容
    renderExpandRow: Function as PropType<RenderExpandRowProp> // 在tree 列表渲染扩展字段显示
  },
  setup(props) {
    const cp = toRef(props, 'cp')
    const useIcon = toRef(props, 'useIcon')
    const root = toRef(props, 'root')
    const nodeShowAddButton = toRef(props, 'nodeShowAddButton', () => true)
    const nodeShowRemoveButton = toRef(props, 'nodeShowRemoveButton', () => true)
    const nodeShowCpButton = toRef(props, 'nodeShowCpButton', () => true)
    const nodeShowIcon = toRef(props, 'nodeShowIcon', () => true)
    const expandFormRows = toRef(props, 'expandFormRows', (scope) => scope.template)
    const renderExpandRow = toRef(props, 'renderExpandRow', () => undefined)
    const nodeShowIconNumber = toRef(props, 'nodeShowIconNumber', 1)

    provide('expandFormRows', expandFormRows.value)

    const pageScene = ref<PageSceneV2>()
    const dataSource = ref<Array<DtoTreeCategory>>([])
    const rootNode = ref<DtoTreeCategory>()
    const searchFormData = ref<any>({})
    const defaultExpandedKeys = ref<any>([])
    const getTree = async (e?: any) => {
      const tree = await new ApiTreeCategoryRootByKey({
        params: { root_key: root.value?.root_key || 'default', category_name: root.value?.category_name, used_table_name: root.value?.used_table_name, create: 1 }
      })
      rootNode.value = tree
      dataSource.value = tree.children
    }

    const edit = (node: TreeNode, data: DtoTreeCategory) => {
      const parentData = Array.isArray(node.parent?.data) ? rootNode.value : node.parent?.data
      const showParent = node.level > 1
      pageScene.value?.subPagePanel.open({
        title: '编辑',
        component: Edit,
        props: { formData: data, parentData, showParent, nodeShowIconNumber, showIcon: nodeShowIcon.value(node, data || null, 'edit') },
        on: {
          save: () => {
            defaultExpandedKeys.value = [node.parent?.data.id]
            getTree(searchFormData.value)
          }
        }
      })
    }

    const append = (node: TreeNode | null, data?: DtoTreeCategory) => {
      const showParent = node && node.level > 0
      pageScene.value?.subPagePanel.open({
        title: '添加',
        component: Edit,
        props: { formData: { expand: {} }, parentData: data, showParent, nodeShowIconNumber, showIcon: nodeShowIcon.value(node, data || null, 'add') },
        on: {
          save: () => {
            defaultExpandedKeys.value = [data?.id]
            getTree(searchFormData.value)
          }
        }
      })
    }

    const remove = (node: TreeNode, data: DtoTreeCategory) => {
      ElMessageBox.confirm(`确定要删除节点:${data.category_name} ?`, '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '再想想'
      }).then(() => {
        new ApiTreeCategoryDel({ params: { id: data.id } }).then(() => {
          defaultExpandedKeys.value = [node.parent?.data.id]
          getTree(searchFormData.value)
        })
      })
    }

    const cpHandler = (node: TreeNode, data: DtoTreeCategory) => {
      cp.value?.handler(node, data).then((res: any) => {
        MoUitls.$mo.cpv2(res)
        ElMessage.info(`拷贝:${res}`)
      })
    }

    const allowDrop = toRef(props, 'allowDrop', (draggingNode: Node, dropNode: Node, type: NodeDropType) => {
      if (type === 'inner') return false
      if (draggingNode.parent.id !== dropNode.parent.id || draggingNode.parent.data.id !== dropNode.parent.data.id) return false
      return true
    })
    const allowDrag = toRef(props, 'allowDrag', (draggingNode: Node) => {
      return true
    })

    /**
     * 拖拽完成回调事件
     */
    const onNodeDrop = (draggingNode: Node, dropNode: Node) => {
      let ids = []
      if (Array.isArray(dropNode.parent.data)) {
        ids = (rootNode.value as DtoTreeCategory).children.map((item: any) => item.id)
      } else if (dropNode.parent && Array.isArray(dropNode.parent.data.children)) {
        const brotherNode: Array<TreeCategory> = dropNode.parent.data.children
        ids = brotherNode.map((item) => item.id)
      }
      new ApiTreeCategoryUpdateSorts({ params: { ids } })
    }

    onMounted(() => {
      getTree()
    })


    /**
     * 渲染复制按钮
     * @param param0 
     * @returns 
     */
    const renderCpButton = ({ node, data }: TreeScope) => {
      if (cp && nodeShowCpButton.value(node, data)) {
        return (
          <ElButton type='text' onClick={(evt: any) => {
            cpHandler(node, data)
            evt.stopPropagation()
          }}>
            {cp.value?.buttonText}
          </ElButton>
        )
      }
    }

    /**
    * 渲染添加按钮
    * @param param0 
    * @returns 
    */
    const renderAddButton = ({ node, data }: TreeScope) => {
      if (nodeShowAddButton.value(node, data)) {
        return (
          <AuthButton onClick={(evt: any) => {
            append(node, data)
            evt.stopPropagation()
          }}
            auth_node_key="add"
            elProps={{ type: "text" }}
            class="color-success"
          ></AuthButton>
        )
      }
    }


    /**
    * 渲染删除按钮
    * @param param0 
    * @returns 
    */
    const renderRemoveButton = ({ node, data }: TreeScope) => {
      if (nodeShowRemoveButton.value(node, data)) {
        if (!config.debug && data.delete_mode !== 0) return
        return (
          <AuthButton onClick={(evt: any) => {
            remove(node, data)
            evt.stopPropagation()
          }}
            auth_node_key="del"
            elProps={{ type: "text" }}
            class="color-danger"
          ></AuthButton>
        )
      }
    }

    const renderTreeV2SlotDefault = ({ node, data }: TreeScope) => {
      if (!data) return
      return (
        <div class="custom-tree-node">
          <div class="custom-tree-node-title">
            <span>{data.category_name}</span>
          </div>
          <div class="custom-tree-node-main">
            {(() => {
              if (nodeShowIcon.value(node, data, 'view') && data.icon) {
                const arr = [<el-avatar size={30} shape="square" src={data.icon} style=" margin-right: 5px;" />]
                nodeShowIconNumber.value >= 2 && arr.push(<el-avatar size={30} shape="square" src={data.active_icon} />)
                return (arr)
              }
            })()}
            {renderExpandRow.value(node, data)}
          </div>
          <div class="custom-tree-node-rigth">
            {renderCpButton({ node, data })}
            {renderAddButton({ node, data })}
            <AuthButton onClick={
              (evt: any) => {
                evt.stopPropagation()
                return edit(node, data)
              }}
              auth_node_key="edit"
              elProps={{ type: "text" }}
              class="color-warning">
            </AuthButton>
            {renderRemoveButton({ node, data })}
          </div>
        </div>
      )
    }

    const renderElTreeV2 = () => {
      if (root.value) {
        return (<ElTree
          class="auth-node-tree"
          data={dataSource.value}
          node-key="id"
          accordion
          draggable
          highlight-current={true}
          allow-drop={allowDrop.value}
          allow-drag={allowDrag.value}
          default-expanded-keys={defaultExpandedKeys.value}
          v-slots={{ default: renderTreeV2SlotDefault }}
          onNode-drop={onNodeDrop}
        >
        </ElTree>)
      } else {
        return <el-empty v-else description="没有定义rootKey" />
      }
    }



    return {
      root,
      pageScene,
      dataSource,
      cp,
      useIcon,
      searchFormData,
      defaultExpandedKeys,
      append,
      remove,
      edit,
      getTree,
      cpHandler,
      nodeShowAddButton,
      nodeShowRemoveButton,
      nodeShowCpButton,
      rootNode,
      renderTreeV2SlotDefault,
      renderElTreeV2,
      // allowDrop,
      // allowDrag
    }
  },


  render() {
    return (
      <ElPageSceneV2 ref="pageScene" searchFormData={this.searchFormData} onRefresh={this.getTree} v-slots={{
        header: () => (
          <auth-button auth_node_key="add" onClick={() => { this.append(null, this.rootNode) }}></auth-button>
        ),
        default: () => (
          <div class="page-main-box">
            {this.renderElTreeV2()}
          </div>
        )
      }}>
      </ElPageSceneV2>
    )
  }
})

