<template>
  <el-dialog class="mo-dialog" v-model="show" v-bind="popupProps" @closed="onClosed" append-to-body draggable
    :show-close="false">
    <component ref="componentRef" :is="com" v-model="modelValue" :setConfirm="setConfirm" v-bind="elProps"
      v-on="listener2"></component>
    <template #footer>
      <div class="dialog-footer" v-if="footer">
        <el-button @click="onCancel" v-if="footer['showCancel']">{{ footer['cancelText'] || '关闭' }}</el-button>
        <el-button type="primary" :loading="loading" v-if="footer['showConfirm']" @click="onConfirm(modelValue)">{{
          footer['confirmText'] || '确认'
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { popupComponentOptions } from './providers'
export default defineComponent(popupComponentOptions())
</script>
