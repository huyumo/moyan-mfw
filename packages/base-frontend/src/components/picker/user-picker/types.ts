/**
 * @fileoverview MfwUserPicker 用户选择器类型定义
 * @description 支持用户选择、部门筛选、多选等功能
 */

import type { VNode } from 'vue';

// ========== 数据模型类型 ==========

/** 用户数据 */
export interface UserInfo {
  /** 用户 ID */
  id: string | number;
  /** 用户名称 */
  name: string;
  /** 用户头像 */
  avatar?: string;
  /** 部门 ID */
  departmentId?: string | number;
  /** 部门名称 */
  departmentName?: string;
  /** 职位 */
  position?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态：1-启用，0-禁用 */
  status?: number;
}

/** 部门数据 */
export interface DepartmentInfo {
  /** 部门 ID */
  id: string | number;
  /** 部门名称 */
  name: string;
  /** 父级 ID */
  parentId?: string | number;
  /** 子部门 */
  children?: DepartmentInfo[];
}

// ========== Props 接口 ==========

/** MfwUserPicker Props 接口 */
export interface MfwUserPickerProps {
  /** 绑定值，支持单选和多选 */
  modelValue?: UserInfo | UserInfo[] | string | string[] | number | number[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 最多选择数量（multiple=true 时有效） */
  maxCount?: number;
  /** 占位文本 */
  placeholder?: string;
  /** 是否显示部门树筛选 */
  showDepartmentFilter?: boolean;
  /** 部门树数据 */
  departmentData?: DepartmentInfo[];
  /** 用户列表数据加载函数 */
  loadUserList?: (params: { keyword?: string; departmentId?: string | number; page?: number; pageSize?: number }) => Promise<{ list: UserInfo[]; total: number }>;
  /** 自定义用户标签渲染 */
  renderTag?: (user: UserInfo) => VNode | string;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否可清空 */
  clearable?: boolean;
  /** 远程搜索防抖时间（ms） */
  debounce?: number;
  /** 是否支持搜索 */
  searchable?: boolean;
  /** 空数据提示文本 */
  emptyText?: string;
  /** 加载中提示文本 */
  loadingText?: string;
}

// ========== Emits 接口 ==========

/** MfwUserPicker Emits 接口 */
export interface MfwUserPickerEmits {
  /** 值变化事件 */
  (e: 'update:modelValue', value: UserInfo | UserInfo[] | string | string[] | number | number[]): void;
  /** 选择变化事件 */
  (e: 'change', value: UserInfo | UserInfo[], oldValue: UserInfo | UserInfo[] | null): void;
  /** 清除事件 */
  (e: 'clear'): void;
  /** 搜索事件 */
  (e: 'search', keyword: string): void;
  /** 部门变化事件 */
  (e: 'department-change', departmentId: string | number): void;
}

// ========== Slots 接口 ==========

/** MfwUserPicker Slots 接口 */
export interface MfwUserPickerSlots {
  /** 自定义触发器内容 */
  trigger?: () => VNode[];
  /** 自定义用户标签渲染 */
  tag?: (props: { user: UserInfo }) => VNode[];
  /** 自定义用户列表项 */
  item?: (props: { user: UserInfo; selected: boolean }) => VNode[];
  /** 空数据 */
  empty?: () => VNode[];
  /** 前缀内容 */
  prefix?: () => VNode[];
}

// ========== 暴露实例接口 ==========

/** MfwUserPicker 暴露实例接口 */
export interface MfwUserPickerInstance {
  /** 聚焦 */
  focus: () => void;
  /** 失焦 */
  blur: () => void;
  /** 清空选择 */
  clear: () => void;
  /** 获取已选择的用户 */
  getSelected: () => UserInfo[];
  /** 设置选中用户 */
  setSelected: (users: UserInfo[]) => void;
  /** 刷新用户列表 */
  refresh: () => Promise<void>;
}

// ========== 内部状态类型 ==========

/** 用户选择器状态 */
export interface UserPickerState {
  /** 是否显示下拉面板 */
  visible: boolean;
  /** 搜索关键词 */
  keyword: string;
  /** 用户列表数据 */
  userList: UserInfo[];
  /** 加载中 */
  loading: boolean;
  /** 已选中的用户 ID 列表 */
  selectedIds: (string | number)[];
  /** 当前选中用户（单选模式） */
  currentValue: UserInfo | null;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 选中的部门 ID */
  selectedDepartmentId?: string | number;
}
