/**
 * @fileoverview MfwConfigFormCard 配置表单卡片组件
 * @description 基于 MfwFormCard 二次封装，支持按 configType 分 Tab 显示，支持分组
 */

import './style.scss';

import {
  defineComponent, ref, computed, onMounted, h, type PropType, type Ref,
} from 'vue';
import { ElMessage, ElSkeleton } from 'element-plus';
import { MfwFormCard, getAccessToken, getCurrentAppId } from 'moyan-mfw-base/frontend';
import type { MfwFormCardInstance } from 'moyan-mfw-base/frontend';
import type {
  MfwConfigFormCardProps,
  MfwConfigFormCardExpose,
  ConfigFormItemConfig,
} from './types';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

/** 从 base frontend 获取认证头 */
function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const appId = getCurrentAppId();
  if (appId) {
    headers['X-App-Id'] = appId;
  }
  return headers;
}

/** configType 对应的 CSS 类名 */
const CONFIG_TYPE_CLASS: Record<ConfigType, string> = {
  [ConfigType.PUBLIC]: 'is-config-public',
  [ConfigType.PRIVATE]: 'is-config-private',
};

/**
 * 为 item 注入 configType 样式
 */
function applyConfigTypeStyle(item: ConfigFormItemConfig): ConfigFormItemConfig {
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
}

/**
 * 从 formGroup 中提取所有 item
 */
function extractItemsFromFormGroup(formGroup: MfwConfigFormCardProps['formGroup']): ConfigFormItemConfig[] {
  if (!formGroup?.groups) {
    return [];
  }
  return formGroup.groups.flatMap(group => group.template || []);
}

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
    formProps: {
      type: Object as PropType<MfwConfigFormCardProps['formProps']>,
    },
    disabled: {
      type: Boolean as PropType<MfwConfigFormCardProps['disabled']>,
      default: false,
    },
  },

  setup(props, { expose }) {
    const loading = ref(true);
    const formRef = ref<MfwFormCardInstance>();
    const formData: Ref<Record<string, any>> = ref({});

    /**
     * 获取所有 item（优先使用 formGroup 中的，否则使用 items）
     */
    const allItems = computed<ConfigFormItemConfig[]>(() => {
      if (props.formGroup?.groups?.length) {
        return extractItemsFromFormGroup(props.formGroup);
      }
      return props.items || [];
    });

    /**
     * 为所有 item 根据 configType 注入颜色标识
     */
    const allItemsWithStyle = computed(() =>
      allItems.value.map(applyConfigTypeStyle)
    );

    /**
     * 为 formGroup 中的 template 注入 configType 样式
     */
    const formGroupWithStyle = computed(() => {
      if (!props.formGroup) {
        return undefined;
      }
      return {
        ...props.formGroup,
        groups: props.formGroup.groups?.map(group => ({
          ...group,
          template: group.template?.map(applyConfigTypeStyle),
        })),
      };
    });

    /**
     * 加载配置数据
     */
    const loadConfig = async () => {
      loading.value = true;
      try {
        const appIdParam = props.appId !== null ? String(props.appId) : '';
        const response = await fetch(
          `/api/ext/config/group/${props.groupKey}${appIdParam ? `?appId=${appIdParam}` : ''}`,
          { headers: getAuthHeaders() }
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

      // 构建提交数据（使用 allItems 包含所有配置项）
      const items = allItems.value.map((item) => ({
        configKey: item.key,
        configValue: { data: { value: formData.value[item.key] ?? '' } },
        description: item.description,
        configType: item.configType,
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

      // 使用 formGroup 时，template 为空（由 formGroup.groups[].template 渲染）
      const useFormGroup = props.formGroup?.groups?.length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return h(MfwFormCard, {
        ref: formRef,
        formData: formData.value,
        template: useFormGroup ? [] : allItemsWithStyle.value,
        formGroup: useFormGroup ? formGroupWithStyle.value : undefined,
        formProps: props.formProps,
        disabled: props.disabled,
      } as any);
    };
  },
});
