<!--
/**
 * @fileoverview MfwAlimapPicker 高德地图选点组件演示页
 * @description 测试地图选点、搜索、手动经纬度输入、逆地理编码、disabled 模式等功能
 */
-->

<template>
  <section class="mfw-alimap-test">
    <h2>MfwAlimapPicker 高德地图选点组件测试</h2>
    <p class="desc">
      测试地图选点组件的搜索、拖拽、手动经纬度输入、逆地理编码等功能。
      下方实时展示选点数据。
    </p>

    <div class="layout">
      <!-- 左侧：地图选点 -->
      <div class="map-side">
        <h3>地图选点</h3>

        <div class="config-bar">
          <ElSwitch v-model="disabled" active-text="禁用模式" />
          <ElSwitch v-model="showPointSet" active-text="显示经纬度输入" />
          <ElButton size="small" @click="handleClear">清空选点</ElButton>
        </div>

        <MfwAlimapPicker
          ref="pickerRef"
          v-model="markerData"
          :disabled="disabled"
          :show-point-set="showPointSet"
          :height="'400px'"
          @change="onChange"
        />
      </div>

      <!-- 右侧：数据预览 -->
      <div class="preview-side">
        <div class="preview-header">
          <h3>选点数据（v-model）</h3>
          <ElTag :type="changeCount > 0 ? 'success' : 'info'" size="small">
            变更次数: {{ changeCount }}
          </ElTag>
        </div>
        <pre class="json-preview">{{ formattedData }}</pre>

        <div v-if="lastChange" class="last-change">
          <ElTag type="warning" size="small">最近变更</ElTag>
          <span class="change-text">
            经度: {{ lastChange.lng?.toFixed(6) }}，
            纬度: {{ lastChange.lat?.toFixed(6) }}
          </span>
        </div>

        <!-- 实例方法测试 -->
        <div class="instance-actions">
          <h4>实例方法测试</h4>
          <div class="action-row">
            <ElButton size="small" @click="handleGetData">getMarkerData()</ElButton>
            <ElButton size="small" @click="handleSetData">setMarkerData(示例)</ElButton>
            <ElButton size="small" @click="handleClear">clear()</ElButton>
          </div>
          <div v-if="getResult" class="action-result">
            <strong>getMarkerData 结果:</strong>
            <pre>{{ getResult }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 省市区数据工具测试 -->
    <div class="pcd-section">
      <h3>ProvinceCityDistrict 省市区数据工具</h3>
      <div class="pcd-actions">
        <ElButton type="primary" :loading="pcdLoading" @click="loadPcdData">
          加载行政区划树
        </ElButton>
        <ElSelect
          v-if="pcdData.length > 0"
          v-model="selectedProvince"
          placeholder="选择省份"
          filterable
          style="width: 200px;"
        >
          <ElOption
            v-for="item in pcdData"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-if="selectedProvince && provinceChildren.length > 0"
          v-model="selectedCity"
          placeholder="选择城市"
          filterable
          style="width: 200px;"
        >
          <ElOption
            v-for="item in provinceChildren"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>
      <div v-if="pcdData.length > 0" class="pcd-info">
        共加载 {{ pcdData.length }} 个省级行政区。
        <span v-if="selectedProvince">
          已选: {{ selectedProvinceLabel }}，
          下级 {{ provinceChildren.length }} 个城市。
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElButton, ElSwitch, ElTag, ElSelect, ElOption, ElMessage } from 'element-plus';
import {
  MfwAlimapPicker,
  getProvinceCityDistrict,
} from 'moyan-mfw-base/frontend';
import type {
  AlimapMarkerData,
  MfwAlimapPickerInstance,
  SimplyDataItem,
} from 'moyan-mfw-base/frontend';

/** 组件引用 */
const pickerRef = ref<MfwAlimapPickerInstance>();

/** 选点数据（v-model） */
const markerData = ref<AlimapMarkerData | undefined>(undefined);

/** 是否禁用 */
const disabled = ref(false);
/** 是否显示经纬度输入 */
const showPointSet = ref(true);

/** 变更次数 */
const changeCount = ref(0);
/** 最近变更数据 */
const lastChange = ref<AlimapMarkerData | undefined>(undefined);
/** getMarkerData 结果 */
const getResult = ref('');

/** 格式化展示数据 */
const formattedData = computed(() => {
  return JSON.stringify(markerData.value ?? null, null, 2);
});

/**
 * 选点变化回调
 *
 * @param data - 选点数据
 */
const onChange = (data: AlimapMarkerData | undefined) => {
  changeCount.value++;
  lastChange.value = data;
};

/** 清空选点 */
const handleClear = () => {
  pickerRef.value?.clear();
};

/** 测试 getMarkerData */
const handleGetData = () => {
  const data = pickerRef.value?.getMarkerData();
  getResult.value = JSON.stringify(data ?? null, null, 2);
  ElMessage.success('已获取选点数据，见下方结果');
};

/** 测试 setMarkerData - 设置为北京天安门 */
const handleSetData = () => {
  const sample: AlimapMarkerData = {
    lat: 39.908823,
    lng: 116.397470,
    name: '北京市东城区天安门',
    address: '北京市东城区天安门',
    adcode: '110101',
    citycode: '010',
    city: '北京市',
    district: '东城区',
    province: '北京市',
    street: '天安门',
    streetNumber: '',
    township: '',
  };
  pickerRef.value?.setMarkerData(sample);
  ElMessage.success('已设置选点为北京天安门');
};

// ========== 省市区数据工具测试 ==========

/** 省市区数据 */
const pcdData = ref<SimplyDataItem[]>([]);
/** 加载状态 */
const pcdLoading = ref(false);
/** 选中的省份 */
const selectedProvince = ref('');
/** 选中的城市 */
const selectedCity = ref('');

/** 省份下级（城市列表） */
const provinceChildren = computed(() => {
  const province = pcdData.value.find(
    (item) => item.value === selectedProvince.value,
  );
  return province?.children ?? [];
});

/** 选中省份的标签 */
const selectedProvinceLabel = computed(() => {
  const province = pcdData.value.find(
    (item) => item.value === selectedProvince.value,
  );
  return province?.label ?? '';
});

/** 加载行政区划树 */
const loadPcdData = async () => {
  pcdLoading.value = true;
  try {
    const pcd = getProvinceCityDistrict();
    pcdData.value = await pcd.getSimplyData({ level: 2 });
    ElMessage.success(`成功加载 ${pcdData.value.length} 个省级行政区`);
  } catch (err) {
    ElMessage.error(`加载行政区划失败: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    pcdLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.mfw-alimap-test {
  padding: 16px;

  h2 {
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  h3 {
    margin: 16px 0 8px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  h4 {
    margin: 12px 0 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .desc {
    margin-bottom: 16px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.6;
  }

  .layout {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;

    @media (max-width: 1024px) {
      flex-direction: column;
    }
  }

  .map-side {
    flex: 1;
    min-width: 0;
  }

  .config-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }

  .preview-side {
    flex: 0 0 400px;
    max-width: 400px;

    @media (max-width: 1024px) {
      flex: 1;
      max-width: none;
    }
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    h3 {
      margin: 0;
    }
  }

  .json-preview {
    background: var(--el-fill-color-darker);
    border-radius: 4px;
    padding: 12px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    overflow: auto;
    max-height: 300px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .last-change {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    .change-text {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .instance-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .action-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-result {
      margin-top: 8px;

      pre {
        background: var(--el-fill-color-darker);
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        max-height: 150px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .pcd-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid var(--el-border-color-lighter);

    .pcd-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .pcd-info {
      margin-top: 12px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
