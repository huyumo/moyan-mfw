<template>
  <el-drawer v-model="show" v-bind="popupProps" @closed="onClosed" append-to-body :show-close="false">
    <template #title>
      <div class="title">{{ popupProps.title }}</div>
    </template>
    <template #default>
      <component
        ref="componentRef"
        :is="com"
        v-model="modelValue"
        :setConfirm="setConfirm"
        v-bind="elProps"
        v-on="listener2"
      ></component>
    </template>

    <template #footer v-if="footer">
      <div class="drawer-footer" v-if="footer">
        <el-button @click="onCancel" v-if="footer['showCancel']">{{ footer['cancelText'] || '关闭' }}</el-button>
        <el-button type="primary" :loading="loading" v-if="footer['showConfirm']" @click="onConfirm(modelValue)">
          {{ footer['confirmText'] || '确认' }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { popupComponentOptions } from './providers'
export default defineComponent(popupComponentOptions())
</script>
