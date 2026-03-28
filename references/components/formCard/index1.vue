<template>
  <template v-if="formGroup && formGroup.type">
    <el-form class="crud-form-box" v-bind="formProps" :model="formData" ref="curdForm" :rules="rules">
      <template v-if="formGroup.type === 'el-collapse'">
        <el-collapse v-model="formGroup.activeNames">
          <el-collapse-item :key="groupItem.key" :name="groupItem.key" v-for="groupItem in formGroup.groups">
            <template #title>
              <i v-if="groupItem.icon" :class="`mo-icon ${groupItem.icon}`"></i>
              {{ groupItem.title }}
            </template>
            <template v-for="(item, index) in groupItem.template" :key="index">
              <el-form-item v-if="showItem(item, formData[item.key], formData)" :v-bind="item.itemProps"
                :prop="item.key" :rules="item.itemProps?.rules" :label="item.label">
                <component :is="item.component || item.type"
                  :disabled="disabledItem(item, formData[item.key], formData, mode)" v-bind="item.elProps"
                  v-model="formData[item.key]"
                  @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
                </component>
                <div style="width: 100%;" v-if="item.helper">
                  <el-tag>{{ item.helper }}</el-tag>
                </div>
              </el-form-item>
            </template>
          </el-collapse-item>
        </el-collapse>
      </template>
      <template v-if="formGroup.type === 'el-tabs'">
        <el-tabs v-model="formGroup.activeName" class="demo-tabs">
          <el-tab-pane :label="groupItem.title" :name="groupItem.key" :key="groupItem.key"
            v-for="groupItem in formGroup.groups">
            <template v-for="(item, index) in groupItem.template" :key="index">
              <el-form-item v-if="showItem(item, formData[item.key], formData)" :v-bind="item.itemProps"
                :prop="item.key" :rules="item.itemProps?.rules" :label="item.label">
                <component :is="item.component || item.type"
                  :disabled="disabledItem(item, formData[item.key], formData, mode)" v-bind="item.elProps"
                  v-model="formData[item.key]"
                  @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
                </component>
                <div style="width: 100%;" v-if="item.helper">
                  <el-tag>{{ item.helper }}</el-tag>
                </div>
              </el-form-item>
            </template>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-form>
  </template>
  <el-form v-else class="crud-form-box" v-bind="formProps" :model="formData" ref="curdForm" :rules="rules">
    <template v-for="(item, index) in formTemplate" :key="index">
      <el-form-item v-if="showItem(item, formData[item.key], formData)" :v-bind="item.itemProps" :prop="item.key"
        :rules="item.itemProps?.rules" :label="item.label">
        <component :is="item.component || item.type" :disabled="disabledItem(item, formData[item.key], formData, mode)"
          v-bind="item.elProps" v-model="formData[item.key]"
          @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
        </component>
        <div style="width: 100%;" v-if="item.helper">
          <el-tag>{{ item.helper }}</el-tag>
        </div>
      </el-form-item>
    </template>
  </el-form>
</template>
<script lang="ts">
import { MoRules } from '@/lib/async-validator'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus/es/components/form/index'
import { defineComponent, toRef, PropType, ref } from 'vue'
import { FormTemplateArray, showItem, FormGroupOption, FormTemplateItem, handleDisabled } from './type'
//ElFormContext
export interface FormCardInstance {
  validate: () => Promise<any> // 验证表单
  resetForm: () => void // 重置表单
  curdForm: FormInstance
}

export default defineComponent({
  emits: ['change'],
  expose: ['validate', 'resetForm', 'curdForm'],
  props: {
    formData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    formProps: {
      type: Object,
      default: () => {
        return {
          labelWidth: '200px'
        }
      }
    },
    formGroup: {
      type: Object as PropType<FormGroupOption>
    },
    template: {
      type: Array as PropType<FormTemplateArray>,
      default: () => {
        return []
      }
    },
    rules: {
      type: Object as PropType<MoRules>,
      default: () => {
        return {}
      }
    },
    mode: {
      type: String as PropType<'add' | 'edit' | 'view'>
    },
      disabled: {
    type: Boolean,
    default: false
  }
  },
  setup(props, { emit }) {
    const formTemplate = toRef(props, 'template', [])
    const formProps = toRef(props, 'formProps', { labelWidth: '200px' })
    const rules = toRef(props, 'rules')
    const formData = toRef(props, 'formData')
    const formGroup = toRef(props, 'formGroup')
const disabled = toRef(props, 'disabled', false)
    const mode = toRef(props, 'mode', formData.value.id ? 'edit' : 'add')
    const curdForm = ref<any>()

    formTemplate.value.forEach((item) => {
      if (!item.elProps) {
        item.elProps = item.elProps || {}
        item.elProps.clearable = typeof item.elProps.clearable === 'undefined' ? true : item.elProps.clearable
      }
      item.itemProps = Object.assign({ rules: item.rules }, item.itemProps)
      // if (typeof item.helper === 'string' && item.helper) {
      //   item.helper = { content: item.helper }
      // }

      if (item.computed) {
        formData.value[item.key] = item.computed
      } else if (!formData.value[item.key]) {
        formData.value[item.key] = item.value
      }
    })

    if (formGroup.value) {
      if (Array.isArray(formGroup.value.groups)) {
        formGroup.value.groups.forEach((item1) => {
          item1.template = formTemplate.value.filter((item2) => {
            item2.groupKey = item1.key
            return item1.columns?.includes(item2.key)
          })
        })
      }
    }

    const change = (scope: { value: any; key: string | undefined; row: any; formData: any; type: string }) => {
      scope.row.setViewText && scope.row.setViewText(scope)
      scope.row.change && scope.row.change(scope)
      emit('change', scope)
    }

    const validate = async () => {
      return await curdForm.value.validate().catch((err: any) => {
        ElMessage.error('验证错误')
        throw new Error(err)
      })
    }

    const resetForm = () => {
      ElMessageBox.confirm('确定要重置表单吗？', '提示', {
        cancelButtonText: '取消',
        confirmButtonText: '确认重置'
      }).then(() => {
        curdForm.value.resetFields()
      })
    }

    const disabledItem = (item: FormTemplateItem<any>, value: any, formData: any, mode?: 'add' | 'edit' | 'view') => {
  return handleDisabled(item, value, formData, mode)  ||disabled.value
}

    return {
      formData,
      formTemplate,
      formProps,
      rules,
      change,
      showItem,
      disabledItem,
      mode,
      validate,
      curdForm,
      resetForm,
      formGroup
    }
  }
})
</script>
