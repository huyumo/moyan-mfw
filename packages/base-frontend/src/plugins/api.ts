/**
 * @fileoverview moyan-api 适配器配置
 * @description 配置 ApiCall 的请求适配器和事件处理
 */

import { ElMessage } from 'element-plus';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiCall, ApiEntity } from 'moyan-api';
import { ApiEvents } from 'moyan-api/dist/lib/base';
import type { App } from 'vue';

const AXIOS = Symbol('mo#Api#axios');

/** API 配置 */
interface ApiConfig {
  baseURL: string;
}

/** 默认配置 */
const defaultConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
};

/**
 * moyan-api Axios 适配器
 */
export class MoAxios {
  static app: App | null = null;
  static [AXIOS]: AxiosInstance;

  options: Partial<ApiConfig> = {};

  constructor(options: Partial<ApiConfig> = {}) {
    this.options = options;
  }

  /** 获取当前路由 */
  static get $route() {
    return MoAxios.app?.config?.globalProperties?.$route;
  }

  /**
   * Vue 插件安装
   */
  static install(app: App) {
    MoAxios.app = app;
    ApiCall.use(new MoAxios());
  }

  /** 获取 Axios 实例 */
  get $axios(): AxiosInstance {
    if (!MoAxios[AXIOS]) {
      MoAxios[AXIOS] = axios.create({
        baseURL: this.options.baseURL || defaultConfig.baseURL,
        timeout: 30000,
      });
      this.initInterceptors();
    }
    return MoAxios[AXIOS];
  }

  /** 初始化拦截器 */
  initInterceptors() {
    // 响应拦截器
    this.$axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error?.response) {
          switch (error.response.status) {
            case 502:
              error.message = '网关错误';
              break;
            case 504:
              error.message = '网关超时';
              break;
            case 505:
              error.message = '版本不受支持';
              break;
            default:
              error.message = error.response.data?.message || '请求错误';
              break;
          }
        }
        throw error;
      }
    );
  }

  /**
   * 执行 API 请求
   */
  request(apiEntity: ApiEntity): Promise<any> {
    const responseType =
      apiEntity.method === 'GET' && apiEntity.option.fileName ? 'blob' : 'json';

    const requestConfig: AxiosRequestConfig = {
      responseType,
      baseURL: this.options.baseURL || defaultConfig.baseURL,
      url: apiEntity.path,
      method: apiEntity.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      headers: this.buildHeaders(apiEntity),
    };

    // GET 请求参数放 params，其他方法放 data
    if (apiEntity.method === 'GET') {
      requestConfig.params = apiEntity.params;
    } else {
      requestConfig.data = apiEntity.params;
    }

    // 文件下载进度
    if (responseType === 'blob') {
      requestConfig.onDownloadProgress = (e: any) => {
        apiEntity.option.ext?.onprogress?.(e);
      };
    }

    return this.$axios(requestConfig);
  }

  /** 构建请求头 */
  buildHeaders(apiEntity: ApiEntity): Record<string, string> {
    const headers: Record<string, string> = {};

    // 认证 Token
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 需要认证的请求
    if ((apiEntity as any).auth) {
      headers['Authorization'] = `Bearer ${token || ''}`;
    }

    return headers;
  }

  /** 获取访问令牌 */
  getAccessToken(): string {
    // 从 localStorage 获取（使用 auth-store 中的键名）
    return (
      localStorage.getItem('mfw:admin:token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      ''
    );
  }
}

// ============== 事件监听配置 ==============

/**
 * 成功事件 - 自动下载文件
 */
ApiCall.emitter.on(ApiEvents.Success, (apiCall: ApiCall<any, any>) => {
  if (apiCall.option.fileName && apiCall.method === 'GET') {
    const blob = new Blob([apiCall.result]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = apiCall.option.fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
});

/**
 * 成功提示事件
 */
ApiCall.emitter.on(ApiEvents.HintSuccess, (apiCall: ApiCall<any, any>) => {
  ApiCall.hasPrompted = true;
  ElMessage.success({
    message: apiCall.successMsg,
    onClose: () => {
      ApiCall.hasPrompted = false;
    },
  });
});

/**
 * 失败提示事件
 */
ApiCall.emitter.on(ApiEvents.HintFail, (apiCall: ApiCall<any, any>) => {
  // 403 跳转到无权限页面
  if (apiCall.response?.status === 403) {
    ElMessage.error('您没有权限执行该操作');
    return;
  }

  // 忽略特定路径的错误提示
  const ignored = ['/', '/login'];
  if (!MoAxios.$route || ignored.includes(MoAxios.$route.path)) {
    return;
  }

  const message =
    apiCall.failMsg === 'Unauthorized'
      ? '登录已过期，请重新登录'
      : apiCall.failMsg;

  if (message) {
    ApiCall.hasPrompted = true;
    ElMessage.error({
      message,
      onClose: () => {
        ApiCall.hasPrompted = false;
      },
    });
  }
});

/**
 * 未授权事件 - 跳转登录页
 */
ApiCall.emitter.on(ApiEvents.Unauthorized, () => {
  // 清除登录状态
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');

  // 跳转登录页
  if (MoAxios.app) {
    const router = MoAxios.app.config.globalProperties.$router;
    router?.push('/login');
  }
});