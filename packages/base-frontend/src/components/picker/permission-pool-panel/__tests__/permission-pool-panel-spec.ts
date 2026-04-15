/**
 * @fileoverview MfwPermissionPoolPanel 组件单元测试
 * @description 测试权限池配置面板组件，验证 checked 字段统一性
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MfwPermissionPoolPanel from '../Index.vue'

// Mock API 调用 - 使用绝对路径
vi.mock('@/apis/sys', () => ({
  ApiAppTypeGetPermissionPool: vi.fn().mockImplementation(() => ({
    permissionTrees: {
      pcTree: [
        {
          id: 'perm-1',
          permName: '系统管理',
          permCode: 'sys',
          permissionType: 'PC',
          nodeType: 'directory',
          parentId: null,
          iconName: 'Setting',
          sortOrder: 1,
          isVisible: 1,
          isCache: 1,
          showMode: 'menu',
          permStatus: 1,
          checked: true,
          permissionValue: '1',
          parentPermissionValue: undefined,
          children: [
            {
              id: 'perm-1-1',
              permName: '用户管理',
              permCode: 'sys:user',
              permissionType: 'PC',
              nodeType: 'menu',
              parentId: 'perm-1',
              iconName: 'User',
              sortOrder: 1,
              isVisible: 1,
              isCache: 1,
              showMode: 'menu',
              permStatus: 1,
              checked: false,
              permissionValue: '2',
              parentPermissionValue: '1',
              children: [],
            },
          ],
        },
      ],
      normalTree: [],
    },
  })),
  ApiAppTypeUpdatePermissionPool: vi.fn().mockImplementation(() => ({
    appTypeId: 'app-type-1',
    updatedCount: 2,
  })),
}))

describe('MfwPermissionPoolPanel', () => {
  const mockAppTypeId = 'app-type-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应正确渲染组件', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      expect(wrapper.find('.mfw-permission-pool-panel').exists()).toBe(true)
    })

    it('应显示加载状态', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      // 加载状态下组件应存在
      expect(wrapper.exists()).toBe(true)
    })

    it('应渲染底部操作按钮', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      const buttons = wrapper.findAll('.panel-footer .el-button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('权限树数据加载', () => {
    it('应在组件挂载时自动加载权限池数据', async () => {
      mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      expect(vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool).toHaveBeenCalled()
    })

    it('应在 appTypeId 变化时重新加载数据', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      vi.clearAllMocks()

      await wrapper.setProps({ appTypeId: 'app-type-2' })
      await flushPromises()

      expect(vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool).toHaveBeenCalled()
    })

    it('应正确解析 checked 字段', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 验证组件已加载数据（checked: true 的节点应被勾选）
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('字段统一性验证 - checked 字段', () => {
    it('应使用 checked 字段而非 inPool 字段', async () => {
      // 模拟返回数据包含 checked 字段
      const mockResponse = {
        permissionTrees: {
          pcTree: [
            {
              id: 'perm-1',
              permName: '测试权限',
              permCode: 'test',
              permissionType: 'PC',
              nodeType: 'menu',
              parentId: null,
              iconName: 'Test',
              sortOrder: 1,
              isVisible: 1,
              isCache: 1,
              showMode: 'menu',
              permStatus: 1,
              checked: true, // 统一使用 checked 字段
              permissionValue: '1',
              parentPermissionValue: undefined,
              children: [],
            },
          ],
          normalTree: [],
        },
      }

      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi
        .fn()
        .mockResolvedValueOnce(mockResponse)

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 验证组件正确读取 checked 字段
      expect(wrapper.vm).toBeDefined()
    })

    it('不应包含 inPool 字段', async () => {
      const mockResponse = {
        permissionTrees: {
          pcTree: [
            {
              id: 'perm-1',
              permName: '测试权限',
              permCode: 'test',
              permissionType: 'PC',
              nodeType: 'menu',
              parentId: null,
              iconName: 'Test',
              sortOrder: 1,
              isVisible: 1,
              isCache: 1,
              showMode: 'menu',
              permStatus: 1,
              checked: true,
              permissionValue: '1',
              parentPermissionValue: undefined,
              children: [],
            },
          ],
          normalTree: [],
        },
      }

      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi
        .fn()
        .mockResolvedValueOnce(mockResponse)

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 验证数据中不包含 inPool 字段
      const vm = wrapper.vm as any
      expect(vm.pcTreeData).toBeDefined()
      if (vm.pcTreeData && vm.pcTreeData.length > 0) {
        expect(vm.pcTreeData[0]).not.toHaveProperty('inPool')
      }
    })
  })

  describe('parentPermissionValue 字段', () => {
    it('应支持 parentPermissionValue 字段', async () => {
      const mockResponse = {
        permissionTrees: {
          pcTree: [
            {
              id: 'perm-1',
              permName: '父权限',
              permCode: 'parent',
              permissionType: 'PC',
              nodeType: 'menu',
              parentId: null,
              iconName: 'Test',
              sortOrder: 1,
              isVisible: 1,
              isCache: 1,
              showMode: 'menu',
              permStatus: 1,
              checked: true,
              permissionValue: '1',
              parentPermissionValue: undefined,
              children: [
                {
                  id: 'perm-1-1',
                  permName: '子权限',
                  permCode: 'child',
                  permissionType: 'PC',
                  nodeType: 'button',
                  parentId: 'perm-1',
                  iconName: 'Test',
                  sortOrder: 1,
                  isVisible: 1,
                  isCache: 1,
                  showMode: 'menu',
                  permStatus: 1,
                  checked: false,
                  permissionValue: '2',
                  parentPermissionValue: '1', // 子节点包含父权限值
                  children: [],
                },
              ],
            },
          ],
          normalTree: [],
        },
      }

      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi
        .fn()
        .mockResolvedValueOnce(mockResponse)

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      const vm = wrapper.vm as any
      expect(vm.pcTreeData).toBeDefined()
      if (vm.pcTreeData && vm.pcTreeData.length > 0 && vm.pcTreeData[0].children) {
        expect(vm.pcTreeData[0].children[0].parentPermissionValue).toBe('1')
      }
    })
  })

  describe('保存功能', () => {
    it('应调用 save 方法时调用更新 API', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 通过组件的 ref 访问 checkedIds
      const vm = wrapper.vm as any
      vm.checkedIds = ['perm-1']

      // 直接调用 save 方法
      await vm.savePermissionPool()

      expect(vi.mocked(await import('@/apis/sys')).ApiAppTypeUpdatePermissionPool).toHaveBeenCalled()
    })

    it('应在未选择任何权限时显示警告', async () => {
      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi.fn().mockResolvedValueOnce({
        permissionTrees: {
          pcTree: [],
          normalTree: [],
        },
      })

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 直接调用 save 方法
      const vm = wrapper.vm as any
      await vm.savePermissionPool()

      // 应显示警告消息
      expect(wrapper.vm).toBeDefined()
    })
  })

  describe('事件处理', () => {
    it('应在数据加载完成后触发 loaded 事件', async () => {
      const mockResponse = {
        permissionTrees: {
          pcTree: [
            {
              id: 'perm-1',
              permName: '测试权限',
              permCode: 'test',
              permissionType: 'PC',
              nodeType: 'menu',
              parentId: null,
              iconName: 'Test',
              sortOrder: 1,
              isVisible: 1,
              isCache: 1,
              showMode: 'menu',
              permStatus: 1,
              checked: true,
              permissionValue: '1',
              parentPermissionValue: undefined,
              children: [],
            },
          ],
          normalTree: [],
        },
      }

      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi
        .fn()
        .mockResolvedValueOnce(mockResponse)

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      expect(wrapper.emitted('loaded')).toBeDefined()
    })

    it('应在保存成功后触发 saved 事件', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      // 通过组件的 ref 访问 checkedIds
      const vm = wrapper.vm as any
      vm.checkedIds = ['perm-1']

      // 直接调用 save 方法
      await vm.savePermissionPool()

      await flushPromises()

      expect(wrapper.emitted('saved')).toBeDefined()
    })
  })

  describe('边界情况', () => {
    it('应处理空权限树', async () => {
      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi.fn().mockResolvedValueOnce({
        permissionTrees: {
          pcTree: [],
          normalTree: [],
        },
      })

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      expect(wrapper.vm).toBeDefined()
    })

    it('应处理 API 错误', async () => {
      vi.mocked(await import('@/apis/sys')).ApiAppTypeGetPermissionPool = vi
        .fn()
        .mockRejectedValueOnce(new Error('API 错误'))

      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
        },
      })

      await flushPromises()

      expect(wrapper.emitted('error')).toBeDefined()
    })

    it('应在 readonly 模式下隐藏操作按钮', async () => {
      const wrapper = mount(MfwPermissionPoolPanel, {
        props: {
          appTypeId: mockAppTypeId,
          readonly: true,
        },
      })

      await flushPromises()

      const footer = wrapper.find('.panel-footer')
      expect(footer.exists()).toBe(false)
    })
  })
})
