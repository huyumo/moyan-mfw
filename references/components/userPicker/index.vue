<template>
  <div class="user-picker">
    <el-input v-model="user_id" type="hidden" />
    <div class="user-info-title" v-if="!active">
      <el-input v-model="keyword" placeholder="请输入手机号查询" @keyup.enter.native="search">
        <template #append>
          <el-button :icon="Search" @click="search" />
        </template>
      </el-input>
      <el-button :icon="Plus" style="margin-left: 10px;" type="primary" @click="save()"></el-button>
    </div>
    <div class="user-info-box">
      <div class="empty-box" v-if="!active">
        <div class="no-data-tag">{{ noDataTag }}</div>
        <div class="empty-box-helper" v-if="helperStr">{{ helperStr }}</div>
      </div>
      <div class="user-info" v-else>
        <el-avatar :size="40" :src="active.avatar" />
        <div class="user-info-detail">
          <div class="user-info-name">
            <span>{{ active.nickname || active.account }}</span>
            <span class="label">{{ active.name }}</span>
          </div>
          <div class="user-info-phone">{{ active.mobile }}</div>
        </div>
        <div>
          <el-button type="primary" v-if="editable" text circle :icon="Edit" @click.stop="save(active)"></el-button>
          <el-button type="danger" text circle :icon="Close" @click.stop="del"></el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { DtoDict } from '@/apis/micro-glcx/schemas'
import {
  ApiUserInfoFindOne,
  ApiUserInfoInfoByAccount,
  ApiUserInfoInfoByMobile,
  ApiUserInfoList,
  ApiUserInfoListV2
} from '@/apis/micro-system'
import { DtoUserInfo, User } from '@/apis/micro-system/schemas'
import { Search, Plus, Close, Edit } from '@element-plus/icons-vue'

import { onMounted, ref, watch, computed } from 'vue'
import MoPopup from '../popup'
import CreaterPanel from './createrPanel.vue'
import { ElMessage } from 'element-plus'
import { UserPickerManager } from './userPickerManager'

const active = ref<DtoUserInfo>()
const noDataTag = ref('请使用手机号搜索或添加新用户')
const keyword = ref('')
const { modelValue, theme, helper } = defineProps({
  modelValue: {
    type: Number
  },
  theme: {
    type: String,
    default: 'default'
  },
  helper: {
    type: String,
    default: ''
  }
})

const user_id = ref(modelValue)
watch(
  () => modelValue,
  (val) => {
    user_id.value = val
  }
)

const themeOptions = new UserPickerManager().getTheme(theme,active)
const helperStr = computed(() => {
  return helper || themeOptions.helper
})

const editable = computed(() => {
  return themeOptions.editable
})

const emits = defineEmits(['update:modelValue'])

const save = (user?: DtoUserInfo) => {
  MoPopup.open({
    title: themeOptions.title || '添加编辑账号',
    component: CreaterPanel,
    type: 'dialog',
    popupProps: { width: '500px' },
    elProps: { context: user, theme },
    on: {
      confirm: (user) => {
        active.value = user
        emits('update:modelValue', user.id)
      }
    }
  })
}

const del = () => {
  active.value = undefined
  emits('update:modelValue', undefined)
}

const getUserInfo = () => {
  modelValue &&
    new ApiUserInfoFindOne({ params: { id: modelValue } }).then((user) => {
      active.value = user
      emits('update:modelValue', user.id)
    })
}

const search = () => {
  if (!keyword.value) {
    ElMessage.warning('请输入手机号')
    return
  }
  new ApiUserInfoInfoByMobile({ params: { mobile: keyword.value } }).then((user) => {
    if (user) {
      active.value = user
      emits('update:modelValue', user.id)
    } else {
      noDataTag.value = `未搜索到手机号为${keyword.value}的用户`
    }
    keyword.value = ''
  })
}

onMounted(() => {
  getUserInfo()
})
</script>
<style lang="scss" scoped>
.user-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  box-sizing: border-box;
}

.user-info-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.user-info-box {
  // height: 120px;
  position: relative;
  width: 100%;
  overflow: hidden;

  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: #999;
    > div {
      line-height: 20px;
      font-size: 12px;
      padding: 5px 0;
    }
    .no-data-tag {
      font-size: 14px;
    }
    .empty-box-helper {
      color: #666;
    }
  }

  .user-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    position: relative;
    width: 100%;

    .user-info-detail {
      flex: 1;
      margin-left: 10px;

      .user-info-name {
        font-size: 14px;
        font-weight: 600;
        .label {
          font-size: 12px;
          font-weight: normal;
          color: #999;
          margin-left: 5px;
        }
      }

      .user-info-phone {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.user-picker-input {
  margin-bottom: 10px;
}
</style>
