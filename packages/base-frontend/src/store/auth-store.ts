/**
 * @fileoverview 认证状态管理
 * @description 处理用户登录、Token 管理、用户信息、应用实例选择
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  ApiAuthLogin,
  ApiAuthRefreshToken,
  ApiAuthGetCurrentUser,
  ApiAuthGetUserApps,
  ApiAuthGetUserPermissions,
} from '../apis/sys';
import type { LoginResponseDto, UserInfoDto, AppInstanceItemDto, PermissionTreeNodeDto } from '../apis/sys/schemas';

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
  /** 应用类型 ID */
  appTypeId?: string;
  /** 应用类型编码 */
  appTypeCode?: string;
  /** 应用类型名称 */
  appTypeName?: string;
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
    // 直接调用后端 API，不使用 ApiCall（避免触发 401 事件处理）
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
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

    return user.value;
  }

  // ============== 应用实例列表 ==============

  /** 获取用户可访问的应用列表 */
  async function fetchUserApps(): Promise<AppInstance[]> {
    try {
      const response = await new ApiAuthGetUserApps({});
      const appsData = Array.isArray(response) ? response : (response as any)?.list || [];

      // 转换为 AppInstance 格式
      apps.value = appsData.map((app: AppInstanceItemDto) => ({
        appId: app.appId,
        appName: app.appName,
        appCode: app.appCode,
        appLogo: app.icon,
        isOwner: app.role === 'owner',
        appTypeId: app.appTypeId,
        appTypeCode: app.appTypeCode,
        appTypeName: app.appTypeName,
      }));

      return apps.value;
    } catch (error) {
      console.error('获取应用列表失败:', error);
      apps.value = [];
      return [];
    }
  }

  // ============== 应用实例选择 ==============

  /** 选择应用实例 */
  async function selectApp(app: AppInstance): Promise<void> {
    currentApp.value = app;
    localStorage.setItem(CURRENT_APP_KEY, JSON.stringify(app));

    // 加载该应用下的权限菜单
    await loadPermissions(app.appId);
  }

  /** 加载用户在指定应用下的权限菜单 */
  async function loadPermissions(appId: string): Promise<PermissionMenuItem[]> {
    try {
      const response = await new ApiAuthGetUserPermissions({
        params: { appId },
      });

      const menuNodes = response.menuTree || [];
      permissionMenu.value = transformPermissionMenu(menuNodes);

      return permissionMenu.value;
    } catch (error) {
      console.error('加载权限菜单失败:', error);
      permissionMenu.value = [];
      return [];
    }
  }

  /** 将后端权限菜单节点转换为前端格式 */
  function transformPermissionMenu(nodes: PermissionTreeNodeDto[]): PermissionMenuItem[] {
    return nodes
      .filter(node => node.isVisible !== 0) // 过滤不可见节点
      .map(node => ({
        id: node.id,
        permName: node.permName,
        permCode: node.permCode,
        routePath: node.routePath,
        iconName: node.iconName,
        children: node.children ? transformPermissionMenu(node.children) : undefined,
      }));
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

      // 3. 获取用户应用列表
      await fetchUserApps();

      // 4. 自动选择应用（如果只有一个应用或已保存选择）
      if (apps.value.length > 0) {
        const autoSelected = await autoSelectApp();
        // 如果有多个应用需要选择，返回 true 但 needSelectApp 为 true
        // 前端可以根据 needSelectApp 显示应用选择器弹窗
        return true;
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
    fetchUserApps,
    selectApp,
    autoSelectApp,
    loadPermissions,
    setPermissionMenu,
    initializeAuth,
  };
});