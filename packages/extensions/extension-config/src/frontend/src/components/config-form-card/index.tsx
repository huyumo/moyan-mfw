/**
 * @fileoverview MfwConfigFormCard 配置表单卡片组件
 * @description 基于 MfwFormCard 二次封装，支持按 configType 分 Tab 显示
 */

import {
  defineComponent, ref, computed, onMounted, h, type PropType, type Ref,
} from 'vue';
import type { TabPaneName } from 'element-plus';
import { ElTabs, ElTabPane, ElMessage, ElSkeleton } from 'element-plus';
import { MfwFormCard } from 'moyan-mfw-base/frontend';
import type { MfwFormCardInstance } from 'moyan-mfw-base/frontend';
import type {
  MfwConfigFormCardProps,
  MfwConfigFormCardExpose,
  ConfigFormItemConfig,
} from './types';
import { ConfigType } from '@shared';

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
    privateTabTitle: {
      type: String as PropType<MfwConfigFormCardProps['privateTabTitle']>,
      default: '敏感配置',
    },
    publicTabTitle: {
      type: String as PropType<MfwConfigFormCardProps['publicTabTitle']>,
      default: '公开配置',
    },
  },

  setup(props, { expose }) {
    const loading = ref(true);
    const activeTab = ref('public');
    const publicFormRef = ref<MfwFormCardInstance>();
    const privateFormRef = ref<MfwFormCardInstance>();
    const publicFormData: Ref<Record<string, any>> = ref({});
    const privateFormData: Ref<Record<string, any>> = ref({});

    // 按 configType 分类
    const publicItems = computed(() =>
      props.items.filter((i) => i.configType === ConfigType.PUBLIC)
    );
    const privateItems = computed(() =>
      props.items.filter((i) => i.configType === ConfigType.PRIVATE)
    );
    const hasBothTypes = computed(
      () => publicItems.value.length > 0 && privateItems.value.length > 0
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
        publicFormData.value = {};
        privateFormData.value = {};
        for (const config of configs) {
          const value = config.configValue?.data ?? '';
          if (config.configType === ConfigType.PUBLIC) {
            publicFormData.value[config.configKey] = value;
          } else {
            privateFormData.value[config.configKey] = value;
          }
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
      // 先验证所有可见的表单
      const formsToValidate: unknown[] = [];
      if (publicItems.value.length > 0) {
        if (publicFormRef.value) formsToValidate.push(publicFormRef.value);
      }
      if (privateItems.value.length > 0) {
        if (privateFormRef.value) formsToValidate.push(privateFormRef.value);
      }

      for (const form of formsToValidate) {
        await (form as any).validate();
      }

      // 构建提交数据
      const items: Array<{ configKey: string; configValue: { data: any }; description?: string }> = [];
      for (const item of props.items) {
        const formData = item.configType === ConfigType.PUBLIC
          ? publicFormData.value
          : privateFormData.value;
        items.push({
          configKey: item.key,
          configValue: { data: formData[item.key] ?? '' },
          description: (item as ConfigFormItemConfig).description,
        });
      }

      // 调用批量更新 API
      const response = await fetch('/api/ext/config/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

      const renderForm = (
        formRefKey: 'publicFormRef' | 'privateFormRef',
        template: ConfigFormItemConfig[],
        formData: Record<string, any>
      ) => {
        return h(MfwFormCard, {
          ref: formRefKey === 'publicFormRef' ? publicFormRef : privateFormRef,
          formData,
          template,
          formGroup: props.formGroup,
        });
      };

      // 同时包含公共和私有配置时，分 Tab 显示
      if (hasBothTypes.value) {
        return h(ElTabs, { modelValue: activeTab.value, 'onUpdate:modelValue': (v: TabPaneName) => { activeTab.value = String(v); } }, () => [
          h(ElTabPane, { label: props.publicTabTitle, name: 'public' }, () =>
            renderForm('publicFormRef', publicItems.value, publicFormData.value)
          ),
          h(ElTabPane, { label: props.privateTabTitle, name: 'private' }, () =>
            renderForm('privateFormRef', privateItems.value, privateFormData.value)
          ),
        ]);
      }

      // 仅一种类型时，直接渲染
      if (publicItems.value.length > 0) {
        return renderForm('publicFormRef', publicItems.value, publicFormData.value);
      }
      if (privateItems.value.length > 0) {
        return renderForm('privateFormRef', privateItems.value, privateFormData.value);
      }
      return null;
    };
  },
});
