<template>
  <div class="form-card-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 基础表单</span>
      </template>
      <MfwFormCard
        :form-data="formData1"
        :template="formTemplate1"
        @change="handleChange1"
      />
      <div class="demo-data">
        <strong>表单数据:</strong>
        <pre>{{ JSON.stringify(formData1, null, 2) }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 分组表单 (Collapse)</span>
      </template>
      <MfwFormCard
        :form-data="formData2"
        :template="formTemplate2"
        :form-group="formGroup2"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: 分组表单 (Tabs)</span>
      </template>
      <MfwFormCard
        :form-data="formData3"
        :template="formTemplate3"
        :form-group="formGroup3"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 动态显示/禁用</span>
      </template>
      <MfwFormCard
        :form-data="formData4"
        :template="formTemplate4"
        @change="handleChange4"
      />
      <div class="demo-data">
        <strong>表单数据:</strong>
        <pre>{{ JSON.stringify(formData4, null, 2) }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 5: 表单验证</span>
      </template>
      <MfwFormCard
        ref="formCardRef5"
        :form-data="formData5"
        :template="formTemplate5"
        :rules="formRules5"
      />
      <div class="demo-actions">
        <el-button type="primary" @click="validateForm">提交验证</el-button>
        <el-button @click="resetForm">重置表单</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { MfwFormCard } from 'moyan-mfw-base-frontend'
import type { FormItemConfig, FormGroupConfig } from 'moyan-mfw-base-frontend'
import type { FormRules } from 'element-plus'

// ==================== 示例 1: 基础表单 ====================
const formData1 = reactive<Record<string, any>>({
  "username": "反光板",
  "email": "",
  "gender": 1,
  "hobbies": [],
  "birthday": ""
})

const formTemplate1: FormItemConfig[] = [
  {
    key: 'username',
    label: '用户名',
    component: 'el-input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'el-input',
    rules: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }]
  },
  {
    key: 'gender',
    label: '性别',
    component: 'el-radio-group',
    elProps: {
      options: [
        { label: '男', value: 1 },
        { label: '女', value: 0 }
      ]
    }
  },
  {
    key: 'hobbies',
    label: '爱好',
    component: 'el-checkbox-group',
    elProps: {
      options: [
        { label: '阅读', value: 'reading' },
        { label: '运动', value: 'sports' },
        { label: '音乐', value: 'music' },
        { label: '旅行', value: 'travel' }
      ]
    }
  },
  {
    key: 'birthday',
    label: '生日',
    component: 'el-date-picker',
    elProps: {
      type: 'date',
      placeholder: '选择生日',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD'
    }
  }
]

const handleChange1 = (scope: { value: any; key: string; formData: any }) => {
  console.log('示例 1 表单变化:', scope)
}

// ==================== 示例 2: 分组表单 (Collapse) ====================
const formData2 = reactive<Record<string, any>>({
  companyName: '',
  companyAddress: '',
  contactName: '',
  contactPhone: '',
  contactEmail: ''
})

const formTemplate2: FormItemConfig[] = [
  { key: 'companyName', label: '公司名称', component: 'el-input' },
  { key: 'companyAddress', label: '公司地址', component: 'el-input' },
  { key: 'contactName', label: '联系人', component: 'el-input' },
  { key: 'contactPhone', label: '联系电话', component: 'el-input' },
  { key: 'contactEmail', label: '联系邮箱', component: 'el-input' }
]

const formGroup2: FormGroupConfig = {
  type: 'el-collapse',
  activeNames: ['basic', 'contact'],
  groups: [
    {
      key: 'basic',
      title: '基本信息',
      template: formTemplate2.slice(0, 2)
    },
    {
      key: 'contact',
      title: '联系信息',
      template: formTemplate2.slice(2)
    }
  ]
}

// ==================== 示例 3: 分组表单 (Tabs) ====================
const formData3 = reactive<Record<string, any>>({
  productName: '',
  productPrice: '',
  productStock: '',
  productDescription: ''
})

const formTemplate3: FormItemConfig[] = [
  { key: 'productName', label: '产品名称', component: 'el-input' },
  { key: 'productPrice', label: '产品价格', component: 'el-input' },
  { key: 'productStock', label: '库存数量', component: 'el-input' },
  { key: 'productDescription', label: '产品描述', component: 'el-input', elProps: { type: 'textarea', rows: 4 } }
]

const formGroup3: FormGroupConfig = {
  type: 'el-tabs',
  activeName: 'basic',
  groups: [
    {
      key: 'basic',
      title: '基本信息',
      template: formTemplate3.slice(0, 3)
    },
    {
      key: 'detail',
      title: '详细信息',
      template: formTemplate3.slice(3)
    }
  ]
}

// ==================== 示例 4: 动态显示/禁用 ====================
const formData4 = reactive<Record<string, any>>({
  userType: 1,
  username: '',
  companyName: '',
  licenseNo: '',
  email: '',
  phone: ''
})

const formTemplate4: FormItemConfig[] = [
  {
    key: 'userType',
    label: '用户类型',
    component: 'el-radio-group',
    elProps: {
      options: [
        { label: '个人', value: 1 },
        { label: '企业', value: 2 }
      ]
    }
  },
  {
    key: 'username',
    label: '姓名',
    component: 'el-input',
    show: (form: any) => form.userType === 1
  },
  {
    key: 'companyName',
    label: '公司名称',
    component: 'el-input',
    show: (form: any) => form.userType === 2
  },
  {
    key: 'licenseNo',
    label: '营业执照号',
    component: 'el-input',
    show: (form: any) => form.userType === 2
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'el-input'
  },
  {
    key: 'phone',
    label: '手机号',
    component: 'el-input',
    disabled: (form: any) => !form.email
  }
]

const handleChange4 = (scope: { value: any; key: string; formData: any }) => {
  console.log('示例 4 表单变化:', scope)
}

// ==================== 示例 5: 表单验证 ====================
const formCardRef5 = ref<any>()

const formData5 = reactive<Record<string, any>>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: ''
})

const formTemplate5: FormItemConfig[] = [
  {
    key: 'username',
    label: '用户名',
    component: 'el-input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
  },
  {
    key: 'password',
    label: '密码',
    component: 'el-input',
    elProps: { type: 'password', showPassword: true },
    rules: [{ required: true, message: '请输入密码', trigger: 'blur' }]
  },
  {
    key: 'confirmPassword',
    label: '确认密码',
    component: 'el-input',
    elProps: { type: 'password', showPassword: true },
    rules: [{ required: true, message: '请确认密码', trigger: 'blur' }]
  },
  {
    key: 'email',
    label: '邮箱',
    component: 'el-input',
    span: 12,
    rules: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }]
  },
  {
    key: 'phone',
    label: '手机号',
    component: 'el-input',
    span: 12,
    rules: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
  }
]

const formRules5: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}

const validateForm = async () => {
  try {
    await formCardRef5.value?.validate()
    ElMessage.success('验证通过')
  } catch (error) {
    ElMessage.error('验证失败，请检查所有必填项')
  }
}

const resetForm = () => {
  formCardRef5.value?.resetForm()
}
</script>

<style scoped lang="scss">
.form-card-demo {
  padding: 24px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-data {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.demo-data pre {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
}

.demo-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
