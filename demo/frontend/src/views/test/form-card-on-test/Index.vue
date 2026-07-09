/**
 * @fileoverview MfwFormCard 点分路径 key 数据映射演示页
 * @description 验证表单项 key 支持 `a.b.c` 形式，组件内部自动处理
 * `key: 'a.b.c'` <-> `formData = { a: { b: { c: any } } }` 的数据映射，
 * 调用方无需对 formData 做任何展平/收拢处理。
 */

<template>
  <section class="mfw-form-card-dotted-test">
    <h2>MfwFormCard 点分路径 Key 数据映射测试</h2>
    <p class="desc">
      表单项 key 使用 <code>a.b.c</code> 形式，组件自动映射到嵌套的 <code>formData.a.b.c</code>。
      修改下方表单，右侧实时展示 formData 的真实结构。
    </p>

    <div class="layout">
      <div class="form-side">
        <h3>表单（MfwFormCard）</h3>
        <MfwFormCard
          ref="formCardRef"
          :form-data="formData"
          :template="template"
          :form-group="formGroup"
          :form-props="{ labelWidth: '140px' }"
          @change="onFormChange"
        />
        <div class="actions">
          <ElButton type="primary" @click="handleValidate">校验表单</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton @click="handleFillSample">填充示例数据</ElButton>
        </div>
      </div>

      <div class="preview-side">
        <div class="preview-header">
          <h3>formData 实时结构</h3>
          <ElTag :type="changeCount > 0 ? 'success' : 'info'" size="small">
            变更次数: {{ changeCount }}
          </ElTag>
        </div>
        <pre class="json-preview">{{ formattedFormData }}</pre>
        <p v-if="lastChange" class="last-change">
          最近变更: key=<strong>{{ lastChange.key }}</strong>，
          value=<strong>{{ formatValue(lastChange.value) }}</strong>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElButton, ElMessage, ElTag } from 'element-plus';
import { MfwFormCard } from 'moyan-mfw-base/frontend';
import type { FormItemConfig, FormGroupConfig, MfwFormCardInstance } from 'moyan-mfw-base/frontend';

const formCardRef = ref<MfwFormCardInstance>();

/**
 * formData 使用嵌套对象结构。
 * 注意：调用方无需展平，直接按业务结构组织即可。
 */
const formData = reactive<Record<string, any>>({
  user: {
    name: '',
    profile: {
      age: 0,
      address: ''
    }
  },
  order: {
    id: '',
    items: ['商品A', '商品B', '商品C'] as string[]
  }
});

/**
 * 表单模板：全部使用点分 key。
 * 组件会自动把这些 key 映射到 formData 的嵌套结构上。
 */
const template: FormItemConfig[] = [
  {
    key: 'user.name',
    label: '用户姓名',
    component: 'el-input',
    span: 24,
    rules: [{ required: true, message: '请输入用户姓名' }],
    elProps: { placeholder: '如：张三' }
  },
  {
    key: 'user.profile.age',
    label: '用户年龄',
    component: 'el-input-number',
    span: 12,
    elProps: { min: 0, max: 150, controlsPosition: 'right' }
  },
  {
    key: 'user.profile.address',
    label: '用户地址',
    component: 'el-input',
    span: 24,
    elProps: { type: 'textarea', rows: 2, placeholder: '详细地址' }
  },
  {
    key: 'order.id',
    label: '订单编号',
    component: 'el-input',
    span: 24,
    rules: [{ required: true, message: '请输入订单编号' }],
    elProps: { placeholder: '如：ORD-2026-0001' }
  }
];

/**
 * 分组配置：分组内的表单项同样使用点分 key。
 * 验证 formGroup 场景下点分映射同样生效。
 */
const formGroup: FormGroupConfig = {
  type: 'el-collapse',
  activeNames: ['user'],
  groups: [
    {
      key: 'user',
      title: '用户信息（嵌套结构）',
      template: [
        {
          key: 'user.name',
          label: '用户姓名',
          component: 'el-input',
          span: 24,
          rules: [{ required: true, message: '请输入用户姓名' }],
          elProps: { placeholder: '如：张三' }
        },
        {
          key: 'user.profile.age',
          label: '用户年龄',
          component: 'el-input-number',
          span: 12,
          elProps: { min: 0, max: 150, controlsPosition: 'right' }
        },
        {
          key: 'user.profile.address',
          label: '用户地址',
          component: 'el-input',
          span: 24,
          elProps: { type: 'textarea', rows: 2, placeholder: '详细地址' }
        }
      ]
    },
    {
      key: 'order',
      title: '订单信息（嵌套结构）',
      template: [
        {
          key: 'order.id',
          label: '订单编号',
          component: 'el-input',
          span: 24,
          rules: [{ required: true, message: '请输入订单编号' }],
          elProps: { placeholder: '如：ORD-2026-0001' }
        },
        {
          key: 'order.items',
          label: '订单商品',
          component: 'el-select',
          span: 24,
          elProps: {
            multiple: true,
            filterable: true,
            allowCreate: true,
            defaultFirstOption: true,
            placeholder: '选择或输入商品名称',
            options: [
              { label: '商品A', value: '商品A' },
              { label: '商品B', value: '商品B' },
              { label: '商品C', value: '商品C' },
              { label: '商品D', value: '商品D' }
            ]
          }
        }
      ]
    }
    
  ]
};

const changeCount = ref(0);
const lastChange = ref<{ key: string; value: any } | null>(null);

const onFormChange = (scope: { value: any; key: string; formData: any }) => {
  changeCount.value++;
  lastChange.value = { key: scope.key, value: scope.value };
};

const formattedFormData = computed(() =>
  JSON.stringify(formData, null, 2)
);

const formatValue = (val: any) => {
  if (val === '' || val == null) return '(空)';
  return JSON.stringify(val);
};

const handleValidate = async () => {
  try {
    await formCardRef.value?.validate();
    ElMessage.success('表单校验通过');
  } catch {
    // 校验失败由组件内部提示
  }
};

const handleReset = () => {
  formCardRef.value?.resetForm();
};

const handleFillSample = () => {
  // 直接写入嵌套结构，组件通过点分 key 自动同步到表单控件
  formData.user.name = '张三';
  formData.user.profile.age = 28;
  formData.user.profile.address = '北京市海淀区中关村大街 1 号';
  formData.order.id = 'ORD-2026-0001';
  formData.order.items = ['商品A', '商品B', '商品C'];
  ElMessage.success('已填充示例数据');
};
</script>

<style scoped lang="scss">
.mfw-form-card-dotted-test {
  padding: 24px;

  h2 {
    margin-bottom: 8px;
    font-size: 20px;
  }

  .desc {
    margin-bottom: 20px;
    color: var(--el-text-color-regular);
    font-size: 14px;

    code {
      padding: 2px 6px;
      background: var(--el-fill-color-light);
      border-radius: 3px;
      font-family: Consolas, Monaco, monospace;
    }
  }

  .layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .form-side {
    flex: 1;
    min-width: 0;

    h3 {
      margin-bottom: 12px;
      font-size: 16px;
    }
  }

  .preview-side {
    width: 360px;
    flex-shrink: 0;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 16px;
      }
    }
  }

  .json-preview {
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    font-family: Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.6;
    max-height: 480px;
    overflow: auto;
    margin: 0;
  }

  .actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }

  .last-change {
    margin-top: 12px;
    padding: 8px 12px;
    background: var(--el-color-success-light-9);
    border-radius: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}
</style>
