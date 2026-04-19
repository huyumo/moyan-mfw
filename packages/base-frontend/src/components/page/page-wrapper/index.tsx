/**
 * @fileoverview MfwPageWrapper 页面包装组件
 * @description 统一的页面布局容器，提供面包屑、标题、刷新等功能
 */

import './style.scss';

import { defineComponent, computed, ref, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElBreadcrumb, ElBreadcrumbItem, ElButton, ElIcon, ElSpace } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type {
  MfwPageWrapperProps,
  MfwPageWrapperEmits,
  MfwPageWrapperInstance,
  BreadcrumbItem
} from './types';

export default defineComponent({
  name: 'MfwPageWrapper',

  props: {
    showBreadcrumb: {
      type: Boolean as PropType<MfwPageWrapperProps['showBreadcrumb']>,
      default: true
    },
    showTitle: {
      type: Boolean as PropType<MfwPageWrapperProps['showTitle']>,
      default: true
    },
    showRefresh: {
      type: Boolean as PropType<MfwPageWrapperProps['showRefresh']>,
      default: true
    },
    title: {
      type: String as PropType<MfwPageWrapperProps['title']>
    },
    breadcrumb: {
      type: Array as PropType<MfwPageWrapperProps['breadcrumb']>
    },
    padding: {
      type: [String, Number] as PropType<MfwPageWrapperProps['padding']>,
      default: '16px'
    },
    bordered: {
      type: Boolean as PropType<MfwPageWrapperProps['bordered']>,
      default: false
    },
    background: {
      type: String as PropType<MfwPageWrapperProps['background']>
    }
  },

  emits: {
    refresh: () => true
  },

  setup(props, { emit, expose, slots }) {
    const route = useRoute();
    const router = useRouter();
    const isRefreshing = ref(false);

    const pageTitle = computed(() => {
      if (props.title) return props.title;
      const metaTitle = route.meta?.title;
      if (typeof metaTitle === 'string') return metaTitle;
      return '';
    });

    const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
      // 优先级：props.breadcrumb > route.meta.breadcrumb > 自动生成
      if (props.breadcrumb) return props.breadcrumb;

      const metaBreadcrumb = route.meta?.breadcrumb as BreadcrumbItem[] | undefined;
      if (metaBreadcrumb) return metaBreadcrumb;

      const items: BreadcrumbItem[] = [];

      // 添加首页
      items.push({
        path: '/dashboard',
        title: '首页',
        clickable: true
      });

      const matched = route.matched.filter(r => r.meta?.title);

      if (matched.length > 0) {
        matched.forEach((r, index) => {
          const title = typeof r.meta?.title === 'string' ? r.meta.title : '';
          if (title && title !== '首页') {
            items.push({
              path: index < matched.length - 1 ? r.path : undefined,
              title,
              clickable: index < matched.length - 1
            });
          }
        });
      }

      return items;
    });

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
      if (item.path && item.clickable) {
        router.push(item.path);
      }
    };

    const handleRefresh = async () => {
      if (isRefreshing.value) return;
      isRefreshing.value = true;
      emit('refresh');
      setTimeout(() => {
        isRefreshing.value = false;
      }, 500);
    };

    const contentStyle = computed(() => ({
      padding: typeof props.padding === 'number' ? `${props.padding}px` : props.padding,
      background: props.background
    }));

    expose<MfwPageWrapperInstance>({
      refresh: handleRefresh,
      getTitle: () => pageTitle.value,
      getBreadcrumb: () => breadcrumbItems.value
    });

    return () => (
      <div
        class={[
          'mfw-page-wrapper',
          props.bordered && 'mfw-page-wrapper--bordered',
          props.padding === 0 && 'mfw-page-wrapper--no-padding'
        ]}
      >
        {slots.header ? (
          <div class="mfw-page-wrapper__header">
            {slots.header()}
          </div>
        ) : (
          props.showTitle && pageTitle.value && (
            <div class="mfw-page-wrapper__header">
              <div class="mfw-page-wrapper__title-wrap">
                <h1 class="mfw-page-wrapper__title">{pageTitle.value}</h1>
                {props.showRefresh && (
                  <ElButton
                    link
                    type="primary"
                    loading={isRefreshing.value}
                    onClick={handleRefresh}
                  >
                    <ElIcon><Refresh /></ElIcon>
                    刷新
                  </ElButton>
                )}
              </div>
              {slots['header-extra']?.()}
            </div>
          )
        )}

        {slots.breadcrumb ? (
          <div class="mfw-page-wrapper__breadcrumb-wrap">
            {slots.breadcrumb()}
          </div>
        ) : (
          props.showBreadcrumb && breadcrumbItems.value.length > 0 && (
            <div class="mfw-page-wrapper__breadcrumb-wrap">
              <ElBreadcrumb class="mfw-page-wrapper__breadcrumb" separator="/">
                {breadcrumbItems.value.map((item, index) => (
                  <ElBreadcrumbItem
                    key={index}
                    to={item.path && item.clickable ? { path: item.path } : undefined}
                  >
                    {item.title}
                  </ElBreadcrumbItem>
                ))}
              </ElBreadcrumb>
              {slots['breadcrumb-extra']?.()}
            </div>
          )
        )}

        {slots.toolbar?.() && (
          <div class="mfw-page-wrapper__toolbar">
            {slots.toolbar()}
          </div>
        )}

        <div class="mfw-page-wrapper__content" style={contentStyle.value}>
          {slots.default?.()}
        </div>

        {slots.footer?.() && (
          <div class="mfw-page-wrapper__footer">
            {slots.footer()}
          </div>
        )}
      </div>
    );
  }
});