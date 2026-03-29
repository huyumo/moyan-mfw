<template>
  <div class="popup-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 基础 Dialog 弹窗</span>
      </template>
      <el-button type="primary" @click="openBasicDialog">打开 Dialog</el-button>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 带表单的弹窗</span>
      </template>
      <el-button type="primary" @click="openFormDialog">打开表单弹窗</el-button>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: Drawer 侧边抽屉</span>
      </template>
      <el-button type="primary" @click="openDrawer">打开 Drawer</el-button>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 自定义页脚</span>
      </template>
      <el-button type="primary" @click="openCustomFooterDialog">打开自定义页脚弹窗</el-button>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 5: 弹窗联动（多层弹窗）</span>
      </template>
      <el-button type="primary" @click="openNestedDialog">打开多层弹窗</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { ElMessage, ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadioButton, ElButton } from 'element-plus'
import { MfwPopup } from 'moyan-mfw-base-frontend'

// ==================== 示例组件：简单内容 ====================
const SimpleContent = {
  props: ['data'],
  setup(props: any) {
    return () =>
      h('div', { style: 'padding: 20px 0;' }, [
        h('p', {}, `弹窗传递的数据：${JSON.stringify(props.data || {})}`),
        h('p', { style: 'color: #909399; font-size: 14px;' }, '这是一个简单的弹窗内容')
      ])
  }
}

// ==================== 示例组件：表单 ====================
const FormContent = {
  props: ['data', 'popupRef'],
  setup(props: any) {
    const formData = ref({
      username: props.data?.username || '',
      email: props.data?.email || '',
      phone: props.data?.phone || ''
    })

    const onConfirm = () => {
      if (!formData.value.username) {
        ElMessage.error('请输入用户名')
        return Promise.reject(new Error('validation-failed'))
      }
      ElMessage.success('提交成功！用户名：' + formData.value.username)
      // 不在这里关闭弹窗，由 MfwPopup 的 handleConfirm 处理成功后关闭
      // props.popupRef?.close()
    }

    return () =>
      h(ElForm, { labelWidth: '80px', style: 'padding: 20px 0;' }, [
        h(ElFormItem, { label: '用户名' }, [
          h(ElInput, {
            modelValue: formData.value.username,
            'onUpdate:modelValue': (val: string | number | boolean | undefined) => { formData.value.username = val as string },
            placeholder: '请输入用户名'
          })
        ]),
        h(ElFormItem, { label: '邮箱' }, [
          h(ElInput, {
            modelValue: formData.value.email,
            'onUpdate:modelValue': (val: string | number | boolean | undefined) => { formData.value.email = val as string },
            placeholder: '请输入邮箱'
          })
        ]),
        h(ElFormItem, { label: '电话' }, [
          h(ElInput, {
            modelValue: formData.value.phone,
            'onUpdate:modelValue': (val: string | number | boolean | undefined) => { formData.value.phone = val as string },
            placeholder: '请输入电话'
          })
        ])
      ])
  }
}

// ==================== 示例组件：Drawer 内容 ====================
const DrawerContent = {
  props: ['data', 'popupRef'],
  setup(props: any) {
    const activeTab = ref('detail')

    const renderContent = () => {
      if (activeTab.value === 'settings') {
        return h('div', {}, [
          h('h4', {}, '设置'),
          h('p', {}, '这里是设置内容...')
        ])
      } else if (activeTab.value === 'logs') {
        return h('div', {}, [
          h('h4', {}, '操作日志'),
          h('p', {}, '这里是日志内容...')
        ])
      }
      // default: detail
      return h('div', {}, [
        h('h4', {}, '详细信息'),
        h('p', {}, `数据 ID: ${props.data?.id || 'N/A'}`),
        h('p', {}, `数据名称：${props.data?.name || 'N/A'}`)
      ])
    }

    return () =>
      h('div', { style: 'padding: 20px 0;' }, [
        h('div', { style: 'margin-bottom: 20px;' }, [
          h(ElRadioGroup, {
            modelValue: activeTab.value,
            'onUpdate:modelValue': (val: string | number | boolean | undefined) => { activeTab.value = val as string }
          }, [
            h(ElRadioButton, { label: 'detail' }, { default: () => '详情' }),
            h(ElRadioButton, { label: 'settings' }, { default: () => '设置' }),
            h(ElRadioButton, { label: 'logs' }, { default: () => '日志' })
          ])
        ]),
        h('div', { style: 'minHeight: 200px;' }, [
          renderContent()
        ])
      ])
  }
}

// ==================== 示例组件：嵌套弹窗的子弹窗 ====================
const NestedChildContent = {
  props: ['data', 'popupRef'],
  setup(props: any) {
    const selectedValue = ref('')

    const handleConfirm = () => {
      if (!selectedValue.value) {
        ElMessage.warning('请选择一项')
        return
      }
      props.data?.onSelect?.(selectedValue.value)
      props.popupRef?.close()
    }

    return () =>
      h('div', { style: 'padding: 20px 0;' }, [
        h('p', { style: 'margin-bottom: 16px;' }, '请选择一个选项：'),
        h(ElRadioGroup, {
          modelValue: selectedValue.value,
          'onUpdate:modelValue': (val: string | number | boolean | undefined) => { selectedValue.value = val as string }
        }, [
          h('div', { style: 'margin: 8px 0;' }, [
            h(ElRadioButton, { label: 'option1' }, { default: () => '选项一' }),
            h(ElRadioButton, { label: 'option2' }, { default: () => '选项二' }),
            h(ElRadioButton, { label: 'option3' }, { default: () => '选项三' })
          ])
        ]),
        h('div', { style: 'margin-top: 20px;' }, [
          h(ElButton, {
            type: 'primary',
            onClick: handleConfirm,
            style: 'width: 100%;'
          }, { default: () => '确认选择' })
        ])
      ])
  }
}

// ==================== 示例 1: 基础 Dialog ====================
const openBasicDialog = () => {
  MfwPopup.open({
    title: '基础 Dialog',
    component: SimpleContent,
    data: { message: 'Hello Popup!' },
    on: {
      confirm: () => {
        ElMessage.success('点击了确认')
      },
      close: () => {
        ElMessage.info('弹窗已关闭')
      }
    }
  })
}

// ==================== 示例 2: 表单弹窗 ====================
const openFormDialog = () => {
  MfwPopup.open({
    title: '用户信息',
    component: FormContent,
    data: { username: '张三', email: 'zhangsan@example.com' },
    popupProps: {
      width: '500px'
    },
    footer: {
      showCancel: true,
      showConfirm: true,
      cancelText: '取消',
      confirmText: '提交'
    }
  })
}

// ==================== 示例 3: Drawer ====================
const openDrawer = () => {
  MfwPopup.open({
    title: '侧边抽屉',
    type: 'drawer',
    component: DrawerContent,
    data: { id: 1, name: '测试数据' },
    position: 'rtl',
    popupProps: {
      size: 400
    },
    footer: false
  })
}

// ==================== 示例 4: 自定义页脚 ====================
const openCustomFooterDialog = () => {
  MfwPopup.open({
    title: '自定义页脚',
    component: SimpleContent,
    data: { message: '自定义页脚示例' },
    footer: {
      showCancel: true,
      showConfirm: true,
      cancelText: '再想想',
      confirmText: '确定要执行'
    },
    on: {
      confirm: async () => {
        ElMessage.success('确认操作')
      }
    }
  })
}

// ==================== 示例 5: 嵌套弹窗 ====================
const openNestedDialog = () => {
  MfwPopup.open({
    title: '父弹窗',
    component: {
      props: [],
      setup() {
        const selectedResult = ref('未选择')

        const openChildPopup = () => {
          MfwPopup.open({
            title: '选择选项',
            component: NestedChildContent,
            data: {
              onSelect: (value: string) => {
                selectedResult.value = value
                ElMessage.success(`已选择：${value}`)
              }
            },
            popupProps: {
              width: '400px'
            }
          })
        }

        return () =>
          h('div', { style: 'padding: 20px 0;' }, [
            h('p', {}, `当前选择：${selectedResult.value}`),
            h(ElButton, {
              type: 'primary',
              onClick: openChildPopup,
              style: 'margin-top: 16px;'
            }, { default: () => '打开子弹窗选择' })
          ])
      }
    },
    popupProps: {
      width: '500px'
    }
  })
}
</script>

<style scoped lang="scss">
.popup-demo {
  padding: 24px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
