/**
 * @fileoverview moyan-api 适配器配置
 * @description 配置 ApiCall 的请求适配器和事件处理
 */

import { ElMessage } from 'element-plus';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiCall, ApiEntity } from 'moyan-api';
import { ApiEvents } from 'moyan-api/dist/lib/base';
import type { App } from 'vue';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, CURRENT_APP_KEY } from '../store/auth-store';

const AXIOS = Symbol('mo#Api#axios');

/** Token 刷新状态 */
let isRefreshing = false;
/** 等待 Token 刷新的请求队列 */
let pendingRequests: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

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
    this.$axios.interceptors.response.use(
      (res) => {
        return res.data;
      },
      async (error) => {
        const originalRequest = error.config;

        // 401 自动刷新重试
        if (error?.response?.status === 401 && !originalRequest._retry) {
          // 避免刷新接口自身进入无限循环
          if (originalRequest.url?.includes('/api/auth/refresh')) {
            error.message = '登录已过期，请重新登录';
            throw error;
          }

          // 并发控制：刷新进行中则排队等待
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              pendingRequests.push({ resolve, reject, config: originalRequest });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            isRefreshing = false;
            error.message = '登录已过期，请重新登录';
            throw error;
          }

          try {
            const baseURL = this.$axios.defaults.baseURL || '';
            const response = await fetch(`${baseURL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
              throw new Error('Refresh token invalid');
            }

            const result = await response.json();
            const data = result.data || result;

            // 保存新 Token
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            if (data.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }

            // 重试所有排队请求
            this.retryPendingRequests(data.accessToken);

            // 重试原始请求
            if (!originalRequest.headers) {
              originalRequest.headers = {} as Record<string, string>;
            }
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return this.$axios(originalRequest);
          } catch {
            // 刷新失败，拒绝所有排队请求
            this.rejectPendingRequests(new Error('Token 刷新失败'));
            error.message = '登录已过期，请重新登录';
            throw error;
          } finally {
            isRefreshing = false;
          }
        }

        // 非 401 或其他状态码的错误提示
        if (error?.response) {
          switch (error.response.status) {
            case 401:
              error.message = '登录已过期，请重新登录';
              break;
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

  /** 用新 Token 重试所有排队请求 */
  retryPendingRequests(newToken: string) {
    const requests = pendingRequests;
    pendingRequests = [];
    for (const { resolve, reject, config } of requests) {
      if (!config.headers) {
        config.headers = {} as Record<string, string>;
      }
      config.headers['Authorization'] = `Bearer ${newToken}`;
      this.$axios(config).then(resolve).catch(reject);
    }
  }

  /** 拒绝所有排队请求 */
  rejectPendingRequests(error: Error) {
    const requests = pendingRequests;
    pendingRequests = [];
    for (const { reject } of requests) {
      reject(error);
    }
  }

  /**
   * 执行 API 请求
   */
  request(apiEntity: ApiEntity): Promise<any> {
    const responseType =
      apiEntity.method === 'GET' && apiEntity.options.fileName ? 'blob' : 'json';

    const requestConfig: AxiosRequestConfig = {
      responseType,
      baseURL: this.options.baseURL || defaultConfig.baseURL,
      url: apiEntity.path,
      method: apiEntity.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      headers: this.buildHeaders(apiEntity),
    };

    // GET 请求参数放 params，其他方法放 data
    if (apiEntity.method === 'GET') {
      requestConfig.params = apiEntity.query;
    } else {
      requestConfig.data = apiEntity.body;
    }

    // 文件下载进度
    if (responseType === 'blob') {
      requestConfig.onDownloadProgress = (e: any) => {
        apiEntity.options.ext?.onprogress?.(e);
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

    // 当前选中应用 ID（请求头优先级最低，业务参数可覆盖）
    const appId = this.getCurrentAppId();
    if (appId) {
      headers['X-App-Id'] = appId;
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

  /** 获取当前选中的应用 ID */
  getCurrentAppId(): string {
    try {
      const saved = localStorage.getItem(CURRENT_APP_KEY);
      if (saved) {
        const app = JSON.parse(saved);
        return app?.appId || '';
      }
    } catch {}
    return '';
  }
}

// ============== 事件监听配置 ==============

/**
 * 成功事件 - 自动下载文件
 */
ApiCall.emitter.on(ApiEvents.Success, (apiCall: ApiCall<any, any>) => {
  if (apiCall.options.fileName && apiCall.method === 'GET') {
    const blob = new Blob([apiCall.result]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = apiCall.options.fileName;
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
    message: apiCall?.successMsg || '操作成功',
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_APP_KEY);
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');

  if (MoAxios.app) {
    const router = MoAxios.app.config.globalProperties.$router;
    router?.push('/login');
  } else {
    window.location.href = '/login';
  }
});