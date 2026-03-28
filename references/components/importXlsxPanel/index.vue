<template>
  <div class="import-box">
    <form-card v-if="useFormCard && isLoadFromCard" :showValidateMassage="false" ref="importFormCardRef"
      :template="formCardTemplate" :formProps="{ 'label-position': 'left', 'label-width': 'auto' }"
      :form-data="fromCardData">
    </form-card>
    <div class="import-box-progress">
      <el-progress v-if="loadFile" :text-inside="true" :stroke-width="18" :percentage="percentage"></el-progress>
      <div style="text-align: center;" v-if="loadFile1">文件载入中....</div>
      <div class="total-row" v-if="loadFile">文件名：{{ fileName }}</div>
      <div class="total-row" v-if="loadFile">
        <span class="fc-success">成功：{{ successful.length }}</span>
        <span class="fc-error">失败：{{ error.length }}</span>
        <span>进度：{{ log.length }}/{{ data.length }}</span>
      </div>
    </div>
    <div ref="logBoxRef" class="log-box" v-if="loadFile">
      <div class="message-item" v-for="(item, index) in log" :key="index">
        <div :class="{ ['log-row-' + item.$status]: true }">
          {{ item.$message }}
        </div>
      </div>
    </div>
    <div class="row-block" v-if="!loadFile"></div>
    <div class="import-box-footer">
      <template v-if="!loadFile">
        <el-upload style="margin-right: 10px;" ref="importUpload" action="" :multiple="false" :limit="1"
          :http-request="handerFile" :before-upload="beforeAvatarUpload">
          <el-button v-show="false" type="primary" ref="uploadButRef"></el-button>
        </el-upload>
        <el-button type="primary" @click.stop="handleSelectFile">选择要导入的文件</el-button>
        <el-button @click="downloadTemplate">下载模板</el-button>
      </template>

      <el-button type="primary" @click="pausePlay" v-if="loadFile && percentage < 100">{{
        playStatus ? '暂停' : '继续'
      }}</el-button>
      <el-button @click="cancel" v-if="percentage !== 100">取消</el-button>
      <el-button type="warning" v-if="percentage === 100 && error.length > 0" @click="downloadError">
        下载错误
      </el-button>
      <el-button @click="reimport" type="primary" v-if="percentage === 100">继续导入</el-button>
      <el-button type="primary" v-if="percentage === 100" @click="completed">完成</el-button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, toRef, ref, watch, PropType, onMounted, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { $Mo, MoUitls } from '@/lib/uilt.mo'
import { ImportPanelOptions } from './type'
import _ from 'lodash'
import { FormTemplateArray } from '../formCard/type'
import axios from 'axios'
import FileSaver from 'file-saver'
import { config } from '@/config'
import { MoWorkbook, MoWorkbookColumn } from '@/lib/excel/moWorkbook'

export default defineComponent({
  emits: ['completed', 'close', 'confirm', 'reimport'],
  props: {
    title: { type: String, default: '导入' },
    context: {
      type: Object as PropType<ImportPanelOptions>
    },
    useFormCard: { type: Boolean },
    getFormCardTemplate: { type: Function as PropType<(vm?: any) => Ref<FormTemplateArray>> },
    getFromCardData: { type: Function as PropType<(vm?: any) => Ref<Object>> }
  },
  setup(props, { emit }) {
    const importFormCardRef = ref()
    const importUpload = ref()
    const uploadButRef = ref()
    const logBoxRef = ref<HTMLDivElement>()
    const fileName = ref('')
    const formCardTemplate = ref([])
    const fromCardData = ref({})
    const isLoadFromCard = ref(false)

    const options = toRef(props, 'context', {
      pk: 'name',
      // show: false,
      thread: 1,
      template: {
        columns: [],
        data: [],
        title: '模板'
        // merges: []
      },
      resultRender: async (id: string | number) => {
        return {
          $status: 'unsuccessful',
          $message: '缺少配置'
        }
      }
    })
    const option1 = ref(options.value)
    const title = toRef(props, 'title')

    const columns = ref([])
    const data = ref([])
    const taskArr = ref<Array<any>>([])
    const log = ref<Array<any>>([])
    const error = ref<Array<any>>([])
    const successful = ref<Array<any>>([])
    const percentage = ref(0)
    const importing = ref(false)
    const loadFile = ref(false)
    const loadFile1 = ref(false)
    const playStatus = ref(false)
    const reimport = () => {
      columns.value = []
      data.value = []
      log.value = []
      error.value = []
      successful.value = []
      percentage.value = 0
      importing.value = false
      loadFile.value = false
      emit('reimport', vm)
    }

    const handleSelectFile = () => {
      if (props.useFormCard && importFormCardRef.value) {
        importFormCardRef.value.validate().then(() => {
          uploadButRef.value.$el.click()
        })
      }
    }

    const beforeAvatarUpload = (file: any) => {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        ElMessage.error('请上传.xlsx 文件')
        return false
      }
      return true
    }

    const cancel = () => {
      playStatus.value = false
      emit('close')
      // option1.value.show = false
    }

    const play = () => {
      playStatus.value = true
      sendData1()
      sendData1()
      sendData1()
      sendData1()
    }

    const pausePlay = () => {
      if (playStatus.value) {
        playStatus.value = false
      } else {
        play()
      }
    }

    const sendData = (data1: Array<any>) => {
      const task = data1.map((item: any) => {
        return new Promise((resolve) => {
          const obj: any = {}
          const obj1: any = {}
          Object.keys(item).forEach((key) => {
            const item1 = option1.value.template.columns.find((item2) => item2.label === key)
            if (item1) {
              obj[item1.prop] = item[key]
              obj1[item1.prop] = item[key]
            }
          })

          option1.value
            .resultRender(obj, vm)
            .then((result: { $status: 'successful' | 'unsuccessful'; $message: string }) => {
              // this.log.unshift(result)
              log.value = log.value.concat(result)
              if (result.$status === 'successful') {
                successful.value.push(result)
              } else {
                error.value.push(Object.assign({}, obj1, result))
                // console.log('error：', this.error)
              }
            })
            .catch((e) => {
              const result = {
                ...obj1,
                $message: `导入 ${_.get(item, option1.value.pk)} 请求错误~`
              }
              log.value = log.value.concat(result)
              error.value.push(result)
            })
            .finally(() => {
              percentage.value = Math.ceil((log.value.length / data.value.length) * 100)
              if (logBoxRef.value) {
                logBoxRef.value.scrollTop = logBoxRef.value?.scrollHeight
              }
              resolve(true)
            })
        })
      })
      return Promise.all(task)
    }

    const sendData1 = () => {
      const arr = taskArr.value.splice(0, option1.value.thread || 1)
      playStatus.value &&
        sendData(arr).finally(() => {
          if (taskArr.value.length > 0) {
            sendData1()
          }
        })
    }

    watch(
      options,
      (options) => {
        option1.value = options
      },
      { deep: true, immediate: true }
    )

    onMounted(() => {
      if (props.getFormCardTemplate) {
        formCardTemplate.value = props.getFormCardTemplate(vm).value as any
      }

      if (props.getFromCardData) {
        fromCardData.value = props.getFromCardData(vm).value as any
      }

      isLoadFromCard.value = true
      reimport()
    })

    const vm = {
      columns,
      data,
      log,
      error,
      successful,
      percentage,
      importing,
      loadFile,
      loadFile1,
      option1,
      title,
      reimport,
      importFormCardRef,
      uploadButRef,
      importUpload,
      beforeAvatarUpload,
      handleSelectFile,
      logBoxRef,
      cancel,
      fileName,
      pausePlay,
      playStatus,
      play,
      taskArr,
      formCardTemplate,
      fromCardData,
      isLoadFromCard
    }
    return vm
  },
  methods: {
    handerFile(e: any) {
      this.loadFile1 = true
      this.fileName = e.file.name

      const moWorkbook = new MoWorkbook()
      moWorkbook
        .import(e.file)
        .then(({ header, results }: any) => {
          this.loadFile = true
          this.columns = header.map((e: any) => {
            return {
              label: e,
              prop: e
            }
          })
          this.data = results
          this.taskArr = [...results]
          if (this.taskArr.length === 0) {
            this.percentage = 100
          } else {
            this.play()
          }
        })
        .finally(() => {
          this.loadFile1 = false
        })
    },

    completed() {
      // this.option1.show = false
      this.reimport()
      this.$emit('completed')
      this.$emit('confirm')
    },

    downloadError() {
      const props = new Set()
      this.error.forEach((item) => {
        Object.keys(item).forEach((key) => {
          props.add(key)
        })
      })
      const errorColumns: MoWorkbookColumn = this.option1.template.columns.filter((item) => {
        return props.has(item.prop)
      })
      errorColumns.push({
        label: 'Error Message',
        prop: '$message',
        width: 100
      })

      const moWorkbook = new MoWorkbook()
      console.log(this.error, errorColumns)
      moWorkbook.export({
        columns: errorColumns,
        data: this.error,
        title: `ErrorLog-${MoUitls.$mo.dateFormat('YYYY-MM-DD HH:MM', new Date())}`
      })
    },
    downloadTemplate() {
      if (this.option1.template.templateUrl) {
        axios
          .get(`${config.moApi.baseURL}/${this.option1.template.templateUrl}`, { responseType: 'blob' })
          .then((res) => {
            FileSaver.saveAs(res.data, this.option1.template.title)
          })
      } else {
        new MoWorkbook().export(this.option1.template)
      }
    }
  }
})
</script>
<style lang="scss">
.import-dialog {
  .el-dialog {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .el-dialog__body {
      height: 430px;
      flex: 1;
      box-sizing: border-box;
      padding-top: 0;
    }
  }
}

.import-box {
  width: 100%;
  height: 380px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .import-box-progress {
    padding: 10px 0;

    .total-row {
      padding-top: 10px;
      width: 100%;

      >span {
        min-width: 140px;
        padding-right: 20px;
      }
    }
  }

  .row-block {
    flex: 1;
  }

  .message-item {
    width: 100%;
  }

  .log-box {
    flex: 1;
    background: #eeeeee;
    overflow-y: scroll;
    box-sizing: border-box;
    padding: 20px 10px;
    line-height: 20px;
    font-size: 12px;

    .log-row-unsuccessful {
      color: rgb(151, 8, 8);
    }

    .log-row-successful {
      color: rgb(53, 151, 8);
    }
  }

  .import-box-footer {
    padding: 20px 0;
    padding-bottom: 0;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
