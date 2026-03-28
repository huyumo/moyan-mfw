import { TableRowHandle } from './type'
import { toRef, PropType, ref, Ref, SetupContext, ComponentInternalInstance } from 'vue'

/**
 * 获取操作栏按钮
 * @param tableRowHandle
 * @returns
 */
export const getHandleButtons = (tableRowHandle: TableRowHandle, ctx: ComponentInternalInstance | null) => {
  const rowHandleButtons = []

  /**
   * 处理内置按钮
   */
  tableRowHandle.view &&
    rowHandleButtons.push(
      Object.assign(
        {
          icon: 'icon-chakan5',
          onclick: (scope: any) => {
            ctx?.emit('view', scope)
          }
        },
        tableRowHandle.view
      )
    )
  tableRowHandle.edit &&
    rowHandleButtons.push(
      Object.assign(
        {
          icon: 'icon-bianji',
          type: 'primary',
          onclick: (scope: any) => {
            ctx?.emit('edit', scope)
          }
        },
        tableRowHandle.edit
      )
    )
  tableRowHandle.remove &&
    rowHandleButtons.push(
      Object.assign(
        {
          icon: 'icon-shanchu4',
          type: 'danger',
          onclick: (scope: any) => {
            ctx?.emit('remove', scope)
          }
        },
        tableRowHandle.remove
      )
    )

  /**
   * 组织自定义按钮
   */
  tableRowHandle.custom?.forEach((item) => {
    rowHandleButtons.push({
      ...item,
      onclick: (scope: any) => {
        console.log('IIIII', scope, item);

        item.emit && ctx?.emit(item.emit, scope)
      }
    })
  })

  /**
   * 按钮排序
   */
  rowHandleButtons.sort((a, b) => {
    const orderA = a.order || 0
    const orderB = b.order || 0
    return orderA - orderB
  })

  return rowHandleButtons.filter((item) => item.show !== false)
}

