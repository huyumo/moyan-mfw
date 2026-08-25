/**
 * @fileoverview MfwPageWrapper 页面包装组件
 * @description 统一的页面布局容器，提供面包屑、标题、刷新、返回顶部等功能
 */

import './style.scss';

import { defineComponent, computed, ref, shallowRef, provide, inject, type PropType, type Ref, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElBreadcrumb, ElBreadcrumbItem, ElButton, ElIcon, ElTooltip, ElBacktop } from 'element-plus';
import { Refresh, Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { useAuthStore } from '../../../store/auth-store';
import type {
  MfwPageWrapperProps,
  MfwPageWrapperEmits,
  MfwPageWrapperInstance,
  BreadcrumbItem,
  PageWrapperBacktopConfig
} from './types';

import type { PermissionMenuItem } from '../../../store/auth-store';

interface SearchPanelContext {
  doSearch: () => void;
  reset: () => void;
  toggleExpand: () => void;
  expanded: Ref<boolean>;
  showExpandButton: ComputedRef<boolean>;
  loading: ComputedRef<boolean>;
}

function findMenuPath(
  menuList: PermissionMenuItem[],
  targetPath: string,
  path: PermissionMenuItem[] = []
): PermissionMenuItem[] {
  for (const item of menuList) {
    const currentPath = [...path, item];
    if (item.routePath === targetPath) {
      return currentPath;
    }
    if (item.children && item.children.length > 0) {
      const result = findMenuPath(item.children, targetPath, currentPath);
      if (result.length > 0) {
        return result;
      }
    }
  }
  return [];
}

/** 返回顶部按钮实例序号（用于生成唯一滚动容器 id，避免多实例/keep-alive 时选择器误匹配） */
let backtopSeq = 0;

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
    backtop: {
      type: [Boolean, Object] as PropType<MfwPageWrapperProps['backtop']>,
      default: true
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
    
    const searchPanelContextRef = shallowRef<SearchPanelContext | null>(null);
    provide('mfw-search-panel-context-ref', searchPanelContextRef);
    
    const refreshCallbacks = ref<(() => void | Promise<void>)[]>([]);
    const registerRefresh = (callback: () => void | Promise<void>) => {
      refreshCallbacks.value.push(callback);
    };
    provide('mfw-page-refresh-context', { registerRefresh });

    // ============================================
    // 返回顶部
    // ============================================
    const contentId = `mfw-page-wrapper-content-${++backtopSeq}`;
    const contentRef = ref<HTMLDivElement | null>(null);
    const backtopEnabled = computed(() => props.backtop !== false);
    const backtopConfig = computed<PageWrapperBacktopConfig>(() =>
      props.backtop && typeof props.backtop === 'object' ? props.backtop : {}
    );
    const scrollToTop = () => {
      contentRef.value?.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

      const authStore = useAuthStore();
      const items: BreadcrumbItem[] = [];

      // 动态计算首页路径（根据当前应用的 appTypeCode）
      const appTypeCode = authStore.currentApp?.appTypeCode;
      const homePath = appTypeCode ? `/${appTypeCode}/dashboard` : '/dashboard';

      // 添加首页（可点击）
      items.push({
        path: homePath,
        title: '首页',
        clickable: true
      });

      // 从权限菜单树中查找当前路由的完整路径链
      const menuPath = findMenuPath(authStore.permissionMenu, route.path);
      if (menuPath.length > 0) {
        menuPath.forEach((menuItem, index) => {
          items.push({
            path: index < menuPath.length - 1 ? menuItem.routePath : undefined,
            title: menuItem.permName,
            clickable: index < menuPath.length - 1
          });
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
      getBreadcrumb: () => breadcrumbItems.value,
      scrollToTop
    });

    // 渲染刷新按钮
    const renderRefreshButton = () => (
      props.showRefresh && !hasSearchPanel.value && (
        <ElButton
          loading={isRefreshing.value}
          onClick={handleRefresh}
          icon={Refresh}
          circle
        />
      )
    );

    // 渲染筛选面板操作按钮
    const renderSearchPanelActions = () => {
      const ctx = searchPanelContextRef.value;
      if (!hasSearchPanel.value || !ctx) return null;

      return (
        <>
          <ElTooltip content="查询" placement="top">
            <ElButton
              type="primary"
              icon={Search}
              loading={ctx.loading.value}
              data-testid="search-btn"
              onClick={ctx.doSearch}
              circle
            />
          </ElTooltip>
          <ElTooltip content="重置" placement="top">
            <ElButton
              icon={Refresh}
              loading={ctx.loading.value}
              data-testid="search-reset-btn"
              onClick={ctx.reset}
              circle
            />
          </ElTooltip>
          {ctx.showExpandButton.value && (
            <ElTooltip content={ctx.expanded.value ? '收起' : '展开'} placement="top">
              <ElButton
                icon={ctx.expanded.value ? ArrowUp : ArrowDown}
                data-testid="search-expand-btn"
                onClick={ctx.toggleExpand}
                circle
              />
            </ElTooltip>
          )}
        </>
      );
    };

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
            // breadcrumb 模式：面包屑 + 操作按钮
            props.showBreadcrumb && breadcrumbItems.value.length > 0 && (
              <div class="mfw-page-wrapper__header-row">
                <div class="mfw-page-wrapper__header-left">
                  {slots.breadcrumb ? slots.breadcrumb() : renderBreadcrumb()}
                </div>
                <div class="mfw-page-wrapper__header-right">
                  {slots['header-extra']?.()}
                  {renderSearchPanelActions()}
                  {renderRefreshButton()}
                </div>
              </div>
            )
          ) : (
            // title 模式：标题 + 操作按钮
            props.showTitle && pageTitle.value && (
              <div class="mfw-page-wrapper__header-row">
                <div class="mfw-page-wrapper__header-left">
                  <h1 class="mfw-page-wrapper__title">{pageTitle.value}</h1>
                </div>
                <div class="mfw-page-wrapper__header-right">
                  {renderSearchPanelActions()}
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

        <div id={contentId} ref={contentRef} class="mfw-page-wrapper__content" style={contentStyle.value}>
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

        {backtopEnabled.value && (
          <ElBacktop
            target={`#${contentId}`}
            visibilityHeight={backtopConfig.value.visibilityHeight ?? 200}
            right={backtopConfig.value.right ?? 24}
            bottom={backtopConfig.value.bottom ?? 40}
          />
        )}
      </div>
    );
  }
});