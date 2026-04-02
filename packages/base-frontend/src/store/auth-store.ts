/**
 * @fileoverview 认证状态管理
 * @description 处理用户登录、Token 管理、用户信息、应用实例选择
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  ApiAuthLogin,
  ApiAuthLogout,
  ApiAuthRefreshToken,
  ApiAuthGetCurrentUser,
} from '../apis/sys';
import type { LoginResponseDto, UserInfoDto } from '../apis/sys/schemas';

/** Token 存储键名 */
export const TOKEN_KEY = 'mfw:admin:token';
export const REFRESH_TOKEN_KEY = 'mfw:admin:refresh_token';
export const CURRENT_APP_KEY = 'mfw:admin:current_app';

/** 用户信息接口 */
export interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender: number;
  isDeveloper: boolean;
  userStatus: number;
  roles: string[];
}

/** 应用实例信息 */
export interface AppInstance {
  appId: string;
  appName: string;
  appCode: string;
  appLogo?: string;
  isOwner: boolean;
}

/** 登录请求参数 */
export interface LoginParams {
  username: string;
  password: string;
}

/** 权限树节点（简化版） */
export interface PermissionMenuItem {
  id: string;
  permName: string;
  permCode: string;
  routePath?: string;
  iconName?: string;
  children?: PermissionMenuItem[];
}

/**
 * 认证状态管理 Store
 */
export const useAuthStore = defineStore('auth', () => {
  // ============== 状态 ==============
  const token = ref<string>('');
  const refreshTokenValue = ref<string>('');
  const user = ref<UserInfo | null>(null);
  const apps = ref<AppInstance[]>([]);
  const currentApp = ref<AppInstance | null>(null);
  const permissionMenu = ref<PermissionMenuItem[]>([]);
  const tokenExpiresAt = ref<number>(0);
  const loading = ref<boolean>(false);

  // ============== 计算属性 ==============
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isLoggedIn = computed(() => !!token.value);
  const hasApps = computed(() => apps.value.length > 0);
  const needSelectApp = computed(() => apps.value.length > 1 && !currentApp.value);

  // ============== Token 管理 ==============

  /** 从本地存储恢复 Token */
  function restoreToken(): boolean {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const savedApp = localStorage.getItem(CURRENT_APP_KEY);

    if (savedToken) {
      token.value = savedToken;
      refreshTokenValue.value = savedRefreshToken || '';

      if (savedApp) {
        try {
          currentApp.value = JSON.parse(savedApp);
        } catch {
          // 忽略解析错误
        }
      }
      return true;
    }
    return false;
  }

  /** 保存 Token 到本地存储 */
  function saveToken(newToken: string, newRefreshToken: string, expiresIn: number): void {
    token.value = newToken;
    refreshTokenValue.value = newRefreshToken;
    tokenExpiresAt.value = Date.now() + expiresIn * 1000;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  }

  /** 清除 Token */
  function clearToken(): void {
    token.value = '';
    refreshTokenValue.value = '';
    user.value = null;
    apps.value = [];
    currentApp.value = null;
    permissionMenu.value = [];
    tokenExpiresAt.value = 0;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_APP_KEY);
  }

  /** 检查 Token 是否即将过期（10 分钟内） */
  function isTokenExpiringSoon(): boolean {
    if (!tokenExpiresAt.value) return true;
    const tenMinutes = 10 * 60 * 1000;
    return Date.now() + tenMinutes >= tokenExpiresAt.value;
  }

  // ============== 登录/登出 ==============

  /** 登录 */
  async function login(params: LoginParams): Promise<boolean> {
    loading.value = true;
    try {
      const response = await new ApiAuthLogin({
        params: { username: params.username, password: params.password },
      });

      // API 返回格式: {code, data: {accessToken, refreshToken, user, ...}, message}
      // moyan-api 可能返回 response.data 或 response.data.data
      const result = (response as any).data || response;

      // 保存 Token (API 返回 accessToken)
      saveToken(result.accessToken, result.refreshToken, result.expiresIn);

      // 保存用户基本信息
      user.value = {
        id: '', // API 未返回 id
        username: result.user?.username || '',
        nickname: result.user?.nickname || '',
        avatar: result.user?.avatar || '',
        gender: 0,
        isDeveloper: false,
        userStatus: 1,
        roles: [],
      };

      return true;
    } catch (error) {
      clearToken();
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /** 登出 */
  async function logout(): Promise<void> {
    try {
      await new ApiAuthLogout({});
    } catch {
      // 忽略登出接口错误
    } finally {
      clearToken();
    }
  }

  /** 刷新 Token */
  async function refreshAccessToken(): Promise<string> {
    if (!refreshTokenValue.value) {
      throw new Error('No refresh token available');
    }

    const result = await new ApiAuthRefreshToken({
      params: { refreshToken: refreshTokenValue.value },
    });

    saveToken(result.accessToken, result.refreshToken, result.expiresIn);
    return result.accessToken;
  }

  // ============== 用户信息 ==============

  /** 获取用户详细信息 */
  async function fetchUserInfo(): Promise<UserInfo> {
    const response = await new ApiAuthGetCurrentUser({});

    // 处理可能的响应包装
    const result = (response as any).data || response;

    user.value = {
      id: result.id,
      username: result.username,
      nickname: result.nickname,
      avatar: result.avatar,
      gender: 0,
      isDeveloper: false,
      userStatus: 1,
      roles: result.roles || [],
    };

    // TODO: 获取应用列表需要后端提供新接口
    // 暂时设置空数组
    apps.value = [];

    return user.value;
  }

  // ============== 应用实例选择 ==============

  /** 选择应用实例 */
  async function selectApp(app: AppInstance): Promise<void> {
    currentApp.value = app;
    localStorage.setItem(CURRENT_APP_KEY, JSON.stringify(app));

    // TODO: 加载该应用下的权限菜单
    // await loadPermissions(app.appCode);
  }

  /** 自动选择应用 */
  async function autoSelectApp(): Promise<boolean> {
    if (apps.value.length === 0) {
      return false;
    }

    // 只有一个应用，自动选择
    if (apps.value.length === 1) {
      await selectApp(apps.value[0]);
      return true;
    }

    // 多个应用，检查是否有已保存的选择
    const savedAppCode = currentApp.value?.appCode;
    if (savedAppCode) {
      const saved = apps.value.find(a => a.appCode === savedAppCode);
      if (saved) {
        await selectApp(saved);
        return true;
      }
    }

    // 需要用户选择
    return false;
  }

  // ============== 权限菜单 ==============

  /** 设置权限菜单（由外部调用设置） */
  function setPermissionMenu(menu: PermissionMenuItem[]): void {
    permissionMenu.value = menu;
  }

  /** 初始化认证状态 */
  async function initializeAuth(): Promise<boolean> {
    // 1. 尝试恢复 Token
    if (!restoreToken()) {
      return false;
    }

    try {
      // 2. 获取用户信息
      await fetchUserInfo();

      // 3. 自动选择应用
      if (apps.value.length > 0) {
        await autoSelectApp();
      }

      return true;
    } catch (error) {
      clearToken();
      return false;
    }
  }

  return {
    // 状态
    token,
    refreshToken: refreshTokenValue,
    user,
    apps,
    currentApp,
    permissionMenu,
    tokenExpiresAt,
    loading,

    // 计算属性
    isAuthenticated,
    isLoggedIn,
    hasApps,
    needSelectApp,

    // 方法
    restoreToken,
    saveToken,
    clearToken,
    isTokenExpiringSoon,
    login,
    logout,
    refreshAccessToken,
    fetchUserInfo,
    selectApp,
    autoSelectApp,
    setPermissionMenu,
    initializeAuth,
  };
});