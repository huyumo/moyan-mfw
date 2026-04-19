/**
 * @fileoverview MfwPageWrapper 页面包装组件
 * @description 统一的页面布局容器，提供面包屑、标题、刷新等功能
 */

import './style.scss';

import { defineComponent, computed, ref, provide, type PropType } from 'vue';
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
    },
    headerMode: {
      type: String as PropType<'breadcrumb' | 'title'>,
      default: 'breadcrumb'
    }
  },

  emits: {
    refresh: () => true
  },

  setup(props, { emit, expose, slots }) {
    const route = useRoute();
    const router = useRouter();
    const isRefreshing = ref(false);
    
    const hasSearchPanel = ref(false);
    provide('mfw-page-has-search-panel', hasSearchPanel);
    
    const refreshCallbacks = ref<(() => void | Promise<void>)[]>([]);
    const registerRefresh = (callback: () => void | Promise<void>) => {
      refreshCallbacks.value.push(callback);
    };
    provide('mfw-page-refresh-context', { registerRefresh });

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

    const handleRefresh = async () => {
      if (isRefreshing.value) return;
      isRefreshing.value = true;
      emit('refresh');
      for (const callback of refreshCallbacks.value) {
        await callback();
      }
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

    // 渲染刷新按钮
    const renderRefreshButton = () => (
      props.showRefresh && !hasSearchPanel.value && (
        <ElButton
          loading={isRefreshing.value}
          onClick={handleRefresh}
        >
          <ElIcon><Refresh /></ElIcon>
          刷新
        </ElButton>
      )
    );

    // 渲染面包屑
    const renderBreadcrumb = () => (
      <ElBreadcrumb class="mfw-page-wrapper__breadcrumb" separator="/">
        {breadcrumbItems.value.map((item) => (
          <ElBreadcrumbItem
            key={item.path || item.title}
            to={item.path && item.clickable ? { path: item.path } : undefined}
          >
            {item.title}
          </ElBreadcrumbItem>
        ))}
      </ElBreadcrumb>
    );

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
          // 根据 headerMode 渲染不同的头部布局
          props.headerMode === 'breadcrumb' ? (
            // breadcrumb 模式：面包屑 + 刷新按钮
            props.showBreadcrumb && breadcrumbItems.value.length > 0 && (
              <div class="mfw-page-wrapper__header-row">
                <div class="mfw-page-wrapper__header-left">
                  {slots.breadcrumb ? slots.breadcrumb() : renderBreadcrumb()}
                </div>
                <div class="mfw-page-wrapper__header-right">
                  {renderRefreshButton()}
                  {slots['header-extra']?.()}
                </div>
              </div>
            )
          ) : (
            // title 模式：标题 + 刷新按钮
            props.showTitle && pageTitle.value && (
              <div class="mfw-page-wrapper__header-row">
                <div class="mfw-page-wrapper__header-left">
                  <h1 class="mfw-page-wrapper__title">{pageTitle.value}</h1>
                </div>
                <div class="mfw-page-wrapper__header-right">
                  {renderRefreshButton()}
                  {slots['header-extra']?.()}
                </div>
              </div>
            )
          )
        )}

        {(() => {
          const toolbarContent = slots.toolbar?.();
          return toolbarContent && (
            <div class="mfw-page-wrapper__toolbar">
              {toolbarContent}
            </div>
          );
        })()}

        <div class="mfw-page-wrapper__content" style={contentStyle.value}>
          {slots.default?.()}
        </div>

        {(() => {
          const footerContent = slots.footer?.();
          return footerContent && (
            <div class="mfw-page-wrapper__footer">
              {footerContent}
            </div>
          );
        })()}
      </div>
    );
  }
});