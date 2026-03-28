<template>
  <template v-if="load">
    <template v-if="formGroup && formGroup.type">
      <el-form class="crud-form-box" v-bind="formProps" :model="formData" ref="curdForm" :rules="rules">
        <template v-if="formGroup.type === 'el-collapse'">
          <el-collapse v-model="formGroup.activeNames">
            <template v-for="groupItem in formGroup.groups">
              <el-collapse-item :key="groupItem.key" v-if="showGroupItem(groupItem)" :name="groupItem.key">
                <template #title>
                  <i v-if="groupItem.icon" :class="`mo-icon ${groupItem.icon}`"></i>
                  {{ groupItem.title }}
                </template>
                <el-row>
                  <template v-for="(item, index) in groupItem.template" :key="index">
                    <el-col :span="item.span || 24">
                      <el-form-item v-if="showItem(item, item.computed, formData)" :v-bind="item.itemProps"
                        :prop="item.key" :rules="item.itemProps?.rules" :label="item.label"
                        :label-width="item.itemProps?.labelWidth">
                        <component :is="item.component || item.type" :ref="item.ref"
                          :disabled="disabledItem(item, item.computed, formData, mode)" v-bind="item.elProps"
                          v-model="item.computed"
                          @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
                        </component>
                        <span class="form-item-after-text" v-if="item.afterText">{{ item.afterText }}</span>
                        <el-alert :type="item.helperType" style="margin: 10px 0; width: 100%;" show-icon
                          :closable="false" v-if="item.helper">
                          <HelperVue :item="item" :formData="formData"></HelperVue>
                        </el-alert>
                      </el-form-item>
                    </el-col>
                  </template>
                </el-row>
              </el-collapse-item>
            </template>
          </el-collapse>
        </template>
        <template v-if="formGroup.type === 'el-tabs'">
          <el-tabs v-model="formGroup.activeName" v-bind="formGroup.elProps" class="demo-tabs">
            <template v-for="groupItem in formGroup.groups">
              <el-tab-pane :label="groupItem.title" :name="groupItem.key" v-if="showGroupItem(groupItem)"
                :key="groupItem.key">
                <el-row>
                  <template v-for="(item, index) in groupItem.template" :key="index">
                    <el-col :span="item.span || 24">
                      <el-form-item v-if="showItem(item, item.computed, formData)" :v-bind="item.itemProps"
                        :prop="item.key" :rules="item.itemProps?.rules" :label="item.label"
                        :label-width="item.itemProps?.labelWidth">
                        <component :is="item.component || item.type"
                          :disabled="disabledItem(item, item.computed, formData, mode)" v-bind="item.elProps"
                          :ref="item.ref" v-model="item.computed"
                          @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
                        </component>
                        <span class="form-item-after-text" v-if="item.afterText">{{ item.afterText }}</span>
                        <el-alert :type="item.helperType" style="margin: 10px 0; width: 100%;" show-icon
                          :closable="false" v-if="item.helper">
                          <HelperVue :item="item" :formData="formData"></HelperVue>
                        </el-alert>
                      </el-form-item>
                    </el-col>
                  </template>
                </el-row>
              </el-tab-pane>
            </template>
          </el-tabs>
        </template>
      </el-form>
    </template>
    <el-form v-else class="crud-form-box" v-bind="formProps" :model="formData" ref="curdForm" :rules="rules">
      <el-row>
        <template v-for="(item, index) in formTemplate" :key="index">
          <el-col :span="item.span || 24">
            <el-form-item v-if="showItem(item, item.computed, formData)" :v-bind="item.itemProps" :prop="item.key"
              :rules="item.itemProps?.rules" :label="item.label" :label-width="item.itemProps?.labelWidth">
              <component :is="item.component || item.type" :disabled="disabledItem(item, item.computed, formData, mode)"
                v-bind="item.elProps" v-model="item.computed" :ref="item.ref"
                @change="change({ value: $event, key: item.key, row: item, formData, type: 'form' })">
              </component>
              <span class="form-item-after-text" v-if="item.afterText">{{ item.afterText }}</span>
              <el-alert :type="item.helperType" style="margin: 10px 0; width: 100%;" show-icon :closable="false"
                v-if="item.helper">
                <HelperVue :item="item" :formData="formData"></HelperVue>
              </el-alert>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
  </template>
</template>
<script lang="ts" setup>
import { MoRules } from '@/lib/async-validator'
import { ElMessage, ElMessageBox } from 'element-plus'
import _ from 'lodash'
import { defineComponent, toRef, PropType, ref, computed, watch, nextTick, onMounted } from 'vue'
import { FormTemplateArray, showItem, FormGroupOption, FormTemplateItem, handleDisabled } from './type'
import HelperVue from './helper.vue'
import { useDraftDox } from './draftDox'

const emit = defineEmits(['change', 'loads', 'loadRefs', 'draftDoxLoad'])
const props = defineProps({
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
        labelWidth: '220px'
      }
    }
  },
  pChange: Boolean,
  formGroup: {
    type: Object as PropType<FormGroupOption>
  },
  template: {
    type: Array as PropType<any>,
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
  },
  draftDox: {
    type: Boolean,
    default: false
  }
})



const formTemplate = ref(props.template || [])
const formProps = toRef(props, 'formProps', { labelWidth: '200px' })
const rules = toRef(props, 'rules')
const formData = toRef(props, 'formData')
const formGroup = ref(props.formGroup ? { ...props.formGroup } : undefined)
const load = ref(true)

const mode = toRef(props, 'mode', formData.value.id ? 'edit' : 'add')
const curdForm = ref<any>()
const pChange = toRef(props, 'pChange') // 用于监听外部传入的的变化，刷新组件
const disabled = toRef(props, 'disabled', false)


const initTemplateItem = (item: any) => {
  if (!item.elProps) {
    item.elProps = item.elProps || {}
  }
  item.itemProps = Object.assign({ rules: item.rules }, item.itemProps)
  item.elProps.clearable = typeof item.elProps.clearable === 'undefined' ? true : item.elProps.clearable
  item.elProps.placeholder =
    item.placeholder || (item.elProps && item.elProps.placeholder ? item.elProps.placeholder : item.label)

  if (typeof formData.value[item.key] === 'undefined') {
    _.set(formData.value, item.key, _.get(formData.value, item.key) || item.value)
  }

  if (!item.hasOwnProperty('computed')) {
    item.computed = computed({
      get: () => _.get(formData.value, item.key),
      set: (value) => _.set(formData.value, item.key, value)
    })
  }
}

if (formGroup.value) {
  if (Array.isArray(formGroup.value.groups)) {
    formGroup.value.groups.forEach((item1) => {
      if (!Array.isArray(item1.template) && Array.isArray(item1.columns)) {
        item1.template = formTemplate.value.filter((item2: any) => {
          item2.groupKey = item1.key
          return item1.columns?.includes(item2.key)
        })
      } else {
        item1.template?.forEach((item2) => {
          formTemplate.value.push(item2)
        })
      }
    })
  }
}

// const getHelper = (item: any) => {
//   if (typeof item.helper === 'function') {
//     return item.helper({ value: item.computed, row: item, key: item.key, formData: formData.value, type: 'form' })
//   } else {
//     return item.helper
//   }
// }

const change = (scope: { value: any; key: string | undefined; row: any; formData: any; type: string }) => {
  scope.row.setViewText && scope.row.setViewText(scope)
  scope.row.change && scope.row.change(scope)
  emit('change', scope)
}

const validate = async () => {
  return await curdForm.value.validate().catch((err: any) => {
    if (formGroup.value && Array.isArray(formGroup.value.groups) && formGroup.value.groups.length > 0) {
      const groups: {
        key: string
        template?: any[]
      }[] = formGroup.value.groups

      const newActiveNames = groups
        .filter((item) => {
          if (item.template && Array.isArray(item.template) && item.template.length > 0) {
            return item.template.some((item1) => {
              return !!err[item1.key]
            })
          } else {
            return false
          }
        })
        .map((item) => item.key)

      if (formGroup.value.type === 'el-collapse') {
        formGroup.value.activeNames = newActiveNames
      } else if (formGroup.value.type === 'el-tabs' && newActiveNames[0]) {
        formGroup.value.activeName = newActiveNames[0]
      }
    }

    let message = `表单验证错误，请检查所有表单内容是否正确`

    // if (formGroup.value && formGroup.value.type === 'el-tabs') {
    //   message = `表单验证错误，请检查所有Tabs下的表单内容是否正确`
    // } else if (formGroup.value && formGroup.value.type === 'el-collapse') {
    //   message = `表单验证错误，请检查所有折叠面板下的表单内容是否正确`
    // }

    ElMessage.error(message)
    throw new Error(err)
  })
}

/**
 * 刷新组件
 */
const refreshComponent = () => {
  load.value = false
  nextTick(() => {
    nextTick(() => {
      load.value = true
    })
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

const showGroupItem = (groupItem: any) => {
  if (typeof groupItem.show === 'undefined') {
    return true
  } else if (typeof groupItem.show === 'function') {
    return groupItem.show(groupItem)
  } else {
    return groupItem.show
  }
}

const disabledItem = (item: FormTemplateItem<any>, value: any, formData: any, mode?: 'add' | 'edit' | 'view') => {
  return handleDisabled(item, value, formData, mode) || disabled.value
}


watch(formData, refreshComponent)
watch(formTemplate, refreshComponent)
watch(formProps, refreshComponent)
watch(formGroup, refreshComponent)
watch(pChange, refreshComponent)


formTemplate.value.forEach(initTemplateItem)

const { initHash, loadCache, clearDraftBox } =  // 使用草稿箱
  useDraftDox({
    props,
    mode,
    formTemplate,
    formGroup,
    formData,
    initTemplateItem,
    emit
  })

onMounted(() => {
  initHash()
  loadCache()
  emit('loads')
  emit('loadRefs')
})

defineExpose({
  validate,
  resetForm,
  clearDraftBox,
  curdForm,
})


</script>

<style lang="scss" scoped>
.crud-form-box {
  .form-item-after-text {
    padding-left: 10px;
    color: var(--el-text-color-regular);
    font-size: var(--el-form-label-font-size);
  }
}
</style>
