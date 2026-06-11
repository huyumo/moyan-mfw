/**
 * @fileoverview MfwConfigFormCard 配置表单卡片组件
 * @description 基于 MfwFormCard 二次封装，每个字段通过 configType 用颜色区分公开/私有
 */

import './style.scss';

import {
  defineComponent, ref, computed, onMounted, h, type PropType, type Ref,
} from 'vue';
import { ElMessage, ElSkeleton } from 'element-plus';
import { MfwFormCard } from 'moyan-mfw-base/frontend';
import type { MfwFormCardInstance } from 'moyan-mfw-base/frontend';
import type {
  MfwConfigFormCardProps,
  MfwConfigFormCardExpose,
  ConfigFormItemConfig,
} from './types';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

/** 从 localStorage 读取 JWT Token */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mfw:admin:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** configType 对应的 CSS 类名 */
const CONFIG_TYPE_CLASS: Record<ConfigType, string> = {
  [ConfigType.PUBLIC]: 'is-config-public',
  [ConfigType.PRIVATE]: 'is-config-private',
};

export default defineComponent({
  name: 'MfwConfigFormCard',

  props: {
    appId: {
      type: [Number, null] as PropType<MfwConfigFormCardProps['appId']>,
      default: null,
    },
    groupKey: {
      type: String as PropType<MfwConfigFormCardProps['groupKey']>,
      required: true,
    },
    items: {
      type: Array as PropType<MfwConfigFormCardProps['items']>,
      default: () => [],
    },
    formGroup: {
      type: Object as PropType<MfwConfigFormCardProps['formGroup']>,
    },
  },

  setup(props, { expose }) {
    const loading = ref(true);
    const formRef = ref<MfwFormCardInstance>();
    const formData: Ref<Record<string, any>> = ref({});

    /**
     * 为每个 item 根据 configType 注入颜色标识（通过 itemProps.class）
     */
    const itemsWithStyle = computed(() =>
      props.items.map((item) => {
        const styled = { ...item };
        // 未配置 component 时默认用 el-input
        if (!styled.component) {
          styled.component = 'el-input';
        }
        if (item.configType !== undefined) {
          const typeClass = CONFIG_TYPE_CLASS[item.configType];
          styled.itemProps = {
            ...styled.itemProps,
            class: [styled.itemProps?.class, typeClass].filter(Boolean).join(' '),
          };
        }
        return styled;
      })
    );

    /**
     * 加载配置数据
     */
    const loadConfig = async () => {
      loading.value = true;
      try {
        const appIdParam = props.appId !== null ? String(props.appId) : 'null';
        const response = await fetch(
          `/api/ext/config/group/${props.groupKey}?appId=${appIdParam}`
        );
        if (!response.ok) {
          throw new Error('Failed to load config');
        }
        const result = await response.json();
        const configs = result.data || [];

        // 填充表单数据
        formData.value = {};
        for (const config of configs) {
          // configValue.data 可能是 {value: xxx} 对象或原始值
          const raw = config.configValue?.data;
          formData.value[config.configKey] =
            raw && typeof raw === 'object' ? raw.value ?? '' : (raw ?? '');
        }
      } catch (error) {
        ElMessage.error('加载配置失败');
      } finally {
        loading.value = false;
      }
    };

    /**
     * 确认提交
     */
    const onConfirm = async () => {
      // 验证表单
      if (formRef.value) {
        await (formRef.value as any).validate();
      }

      // 构建提交数据（data 必须是对象以匹配 @IsObject() 校验）
      const items = props.items.map((item) => ({
        configKey: item.key,
        configValue: { data: { value: formData.value[item.key] ?? '' } },
        description: (item as ConfigFormItemConfig).description,
        configType: (item as ConfigFormItemConfig).configType,
      }));

      // 调用批量更新 API
      const response = await fetch('/api/ext/config/batch', {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupKey: props.groupKey,
          appId: props.appId,
          items,
        }),
      });

      if (!response.ok) {
        ElMessage.error('保存配置失败');
        throw new Error('Failed to save config');
      }

      ElMessage.success('配置保存成功');
    };

    /**
     * 重置表单
     */
    const reset = async () => {
      await loadConfig();
    };

    onMounted(() => {
      loadConfig();
    });

    expose<MfwConfigFormCardExpose>({ onConfirm, reset });

    return () => {
      if (loading.value) {
        return h(ElSkeleton, { animated: true });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return h(MfwFormCard, {
        ref: formRef,
        formData: formData.value,
        template: itemsWithStyle.value,
        formGroup: props.formGroup,
      } as any);
    };
  },
});