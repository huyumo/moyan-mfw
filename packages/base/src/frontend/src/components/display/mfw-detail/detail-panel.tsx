/**
 * @fileoverview 详情面板组件
 * @description 通用详情信息展示容器，支持多种格式化子组件
 * @example
 * ```vue
 * <MfwDetailPanel
 *   :data="record"
 *   :items="[
 *     { label: '创建时间', key: 'createdAt', format: 'date', dateFormat: 'YYYY-MM-DD HH:mm:ss' },
 *     { label: '状态', key: 'status', format: 'dict', dict: statusDict },
 *     { label: '创建人', key: 'creatorId', format: 'user' },
 *     { label: '附件', key: 'attachments', format: 'image', formatOptions: { preview: true } }
 *   ]"
 *   :columns="2"
 *   bordered
 * />
 * ```
 */

import { defineComponent, toRef, computed, h, type PropType } from 'vue';
import { ElDescriptions, ElDescriptionsItem, ElSkeleton, ElEmpty } from 'element-plus';
import MfwDateFormat from '../../mfw-format/date-format';
import MfwImageFormat from '../../mfw-format/image-format';
import MfwDictFormat from '../../mfw-format/dict-format';
import MfwTagFormat from '../../mfw-format/tag-format';
import MfwUserFormat from './user-format';
import type { DetailPanelProps, DetailItem } from './types';

export default defineComponent({
  name: 'MfwDetailPanel',

  props: {
    /** 详情数据 */
    data: {
      type: Object as PropType<DetailPanelProps['data']>,
      default: () => ({})
    },
    /** 详情项配置列表 */
    items: {
      type: Array as PropType<DetailPanelProps['items']>,
      default: () => []
    },
    /** 标题 */
    title: {
      type: String as PropType<DetailPanelProps['title']>,
      default: ''
    },
    /** 是否显示边框 */
    bordered: {
      type: Boolean as PropType<DetailPanelProps['bordered']>,
      default: true
    },
    /** 列数 (1-4) */
    columns: {
      type: Number as PropType<DetailPanelProps['columns']>,
      default: 2
    },
    /** 标签宽度 */
    labelWidth: {
      type: [String, Number] as PropType<DetailPanelProps['labelWidth']>,
      default: '120px'
    },
    /** 是否显示加载状态 */
    loading: {
      type: Boolean as PropType<DetailPanelProps['loading']>,
      default: false
    },
    /** 空值显示文本 */
    emptyText: {
      type: String as PropType<DetailPanelProps['emptyText']>,
      default: '--'
    },
    /** 尺寸 */
    size: {
      type: String as PropType<DetailPanelProps['size']>,
      default: 'default'
    }
  },

  emits: {
    'item-click': (item: DetailItem, value: unknown) => true
  },

  setup(props, { emit, slots }) {
    const data = toRef(props, 'data');
    const items = toRef(props, 'items');
    const loading = toRef(props, 'loading');

    /** 过滤隐藏项 */
    const visibleItems = computed(() => {
      return items.value.filter(item => !item.hidden);
    });

    /** 获取字段值 */
    const getValue = (key: string): unknown => {
      return data.value?.[key];
    };

    /** 渲染格式化内容 */
    const renderContent = (item: DetailItem) => {
      const value = getValue(item.key);
      const format = item.format || 'text';
      const options = item.formatOptions || {};

      if (value === null || value === undefined || value === '') {
        return props.emptyText;
      }

      switch (format) {
        case 'date':
          return (
            <MfwDateFormat
              value={value as string | number | Date}
              fmt={item.dateFormat || 'YYYY-MM-DD HH:mm:ss'}
              emptyText={props.emptyText}
            />
          );

        case 'image':
          return (
            <MfwImageFormat
              value={value as string | string[]}
              width={options.width as number || 60}
              height={options.height as number || 60}
              preview={options.preview as boolean || false}
              emptyText={props.emptyText}
            />
          );

        case 'dict':
          return (
            <MfwDictFormat
              value={value as string | number}
              dict={item.dict || []}
              asTag={options.asTag as boolean || false}
              emptyText={props.emptyText}
            />
          );

        case 'tag':
          return (
            <MfwTagFormat
              value={value as string}
              type={options.type as 'primary' | 'success' | 'warning' | 'danger' | 'info' || 'primary'}
              emptyText={props.emptyText}
            />
          );

        case 'user':
          return (
            <MfwUserFormat
              userId={value as string | number}
              mode={options.mode as 'avatar' | 'name' | 'card' || 'name'}
              emptyText={props.emptyText}
            />
          );

        case 'custom':
          if (item.customRender) {
            return h(item.customRender, { value, item, data: data.value });
          }
          if (slots[item.key]) {
            return slots[item.key]?.({ value, item, data: data.value });
          }
          return String(value);

        default:
          return String(value ?? props.emptyText);
      }
    };

    /** 处理项点击 */
    const handleItemClick = (item: DetailItem) => {
      emit('item-click', item, getValue(item.key));
    };

    return () => {
      if (loading.value) {
        return (
          <div class="mfw-detail-panel-loading">
            <ElSkeleton rows={props.columns * 2} animated />
          </div>
        );
      }

      if (!data.value || Object.keys(data.value).length === 0) {
        return (
          <div class="mfw-detail-panel-empty">
            <ElEmpty description="暂无数据" />
          </div>
        );
      }

      return (
        <div class="mfw-detail-panel">
          {props.title && (
            <div class="mfw-detail-panel-header">
              <span class="mfw-detail-panel-title">{props.title}</span>
            </div>
          )}
          <ElDescriptions
            column={props.columns}
            border={props.bordered}
            labelWidth={props.labelWidth}
            size={props.size}
          >
            {visibleItems.value.map(item => (
              <ElDescriptionsItem
                key={item.key}
                label={item.label}
                span={item.span || 1}
                class="mfw-detail-item"
              >
                <div
                  class="mfw-detail-item-content"
                  onClick={() => handleItemClick(item)}
                >
                  {slots[item.key]?.({ value: getValue(item.key), item, data: data.value })
                    || renderContent(item)}
                </div>
              </ElDescriptionsItem>
            ))}
          </ElDescriptions>
        </div>
      );
    };
  }
});