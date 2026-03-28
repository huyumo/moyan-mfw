<template>
  <div>
    <div class="wuliu-base-info-panel">
      <div class="wuliu-base-info-panel_top">
        <el-image style="height:40px" :src="wuliuInfo?.logo"></el-image>
        <span>{{ wuliuInfo?.expName }}</span>
        <span>单号：{{ wuliuInfo?.number }}</span>
        <!-- <el-tag v-if="wuliuInfo?.issign == '1'" effect="dark" type="success">已签收</el-tag>
        <el-tag v-else effect="plain" type="info">待签收</el-tag> -->
      </div>
      <div class="wuliu-base-info-panel_row">
        <span>用时：{{ wuliuInfo?.takeTime }}</span>
        <span>最后更新：{{ wuliuInfo?.updateTime }}</span>
      </div>
    </div>
    <el-timeline style="margin-top: 20px">
      <el-timeline-item v-for="(activity, index) in wuliuInfo?.list" :key="index" :type="activity.type"
        :timestamp="activity.time">
        {{ activity.status }}
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script lang="ts">
// import { ApiAliCloudWuliuInfo } from '@/apis/micro-library'
import { defineComponent, ref, toRef, onMounted } from 'vue'

export default defineComponent({
  props: {
    tracking_number: String,
    consignee_phone: String
  },
  setup(props) {
    const tracking_number = toRef(props, 'tracking_number', '')
    const consignee_phone = toRef(props, 'consignee_phone', '')

    const wuliuInfo = ref<{
      list: { status: string; time: string; type?: string }[]
      courier: string
      courierPhone: string
      deliverystatus: string
      expName: string
      number: string
      expPhone: string
      expSite: string
      issign: string
      logo: string
      takeTime: string
      updateTime: string
      type: string
    }>()

    const getWuliuInfo = () => {
      const code =
        tracking_number.value.indexOf('SF') === 0
          ? tracking_number.value + ':' + consignee_phone.value.substring(7)
          : tracking_number.value

      // new ApiAliCloudWuliuInfo({ params: { code } }).then((res) => {
      //   // res.result.list = res.result.list.reverse()
      //   res.result.list[0].type = 'primary'
      //   wuliuInfo.value = res.result
      // })
    }
    onMounted(() => {
      getWuliuInfo()
    })

    return {
      wuliuInfo
    }
  }
})
</script>
<style lang="scss" scoped>
.wuliu-base-info-panel {
  padding: 20px;

  &_top {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    span {
      padding: 0 20px;
      line-height: 24px;
      font-weight: bold;
    }
  }

  &_row {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 10px 0;
    padding-left: 40px;

    span {
      padding: 0 20px;
    }
  }
}
</style>
