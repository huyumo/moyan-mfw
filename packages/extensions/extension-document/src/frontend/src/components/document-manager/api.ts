/**
 * @fileoverview 文档管理 API 请求封装
 * @description 统一 fetch 封装，自动注入认证头与 X-App-Id
 */

import { getAccessToken, getCurrentAppId } from 'moyan-mfw-base/frontend';
import type { DocumentImage } from 'moyan-mfw-extension-document/shared';

const BASE = '/api/ext/document';

/** 构建认证请求头 */
export function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const appId = getCurrentAppId();
  if (appId) headers['X-App-Id'] = appId;
  return headers;
}

/** 统一请求，返回 data 字段 */
export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = getAuthHeaders(
    options.headers && (options.headers as Record<string, string>)['Content-Type']
      ? { 'Content-Type': (options.headers as Record<string, string>)['Content-Type'] }
      : { 'Content-Type': 'application/json' },
  );
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败');
  }
  return json.data as T;
}

/** 文档数据结构（与后端 DocumentResponseDto 对齐） */
export interface DocumentData {
  id: number;
  appId?: number | null;
  docKey?: string;
  onlyKey?: string;
  docGroup?: string;
  title?: string;
  content?: string;
  summary?: string;
  type?: string;
  images?: DocumentImage[];
  video?: string;
  tags?: string;
  status?: number;
  virtualPageviews?: number;
  pageviews?: number;
  viewPageviews?: number;
  counter1?: number;
  counter2?: number;
  counter3?: number;
  announcementStartTime?: string;
  announcementEndTime?: string;
  sortOrder?: number;
  createdAt?: string;
  updateAt?: string;
  extFields?: ExtFieldData[];
}

export interface ExtFieldData {
  id?: number;
  documentId?: number;
  extKey: string;
  extValue: { data: any };
  valueType?: string;
  description?: string;
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 分页查询 */
export function listDocuments(params: Record<string, any>): Promise<PageResult<DocumentData>> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  }
  return request<PageResult<DocumentData>>(`${BASE}/list?${qs.toString()}`);
}

/** 按 id 查询 */
export function getDocumentById(id: number): Promise<DocumentData> {
  return request<DocumentData>(`${BASE}/${id}`);
}

/** 按 onlyKey 查询 */
export function getDocumentByOnlyKey(onlyKey: string): Promise<DocumentData> {
  return request<DocumentData>(`${BASE}/byOnlyKey/${onlyKey}`);
}

/** 获取扩展字段 */
export function getExtFields(id: number): Promise<ExtFieldData[]> {
  return request<ExtFieldData[]>(`${BASE}/${id}/ext`);
}

/** 创建文档 */
export function createDocument(data: Partial<DocumentData>): Promise<DocumentData> {
  return request<DocumentData>(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新文档 */
export function updateDocument(id: number, data: Partial<DocumentData>): Promise<DocumentData> {
  return request<DocumentData>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 删除文档 */
export function deleteDocument(id: number): Promise<void> {
  return request<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/** 分组字典 */
export function getDocGroupDict(docKey?: string): Promise<string[]> {
  const qs = new URLSearchParams();
  if (docKey) qs.append('docKey', docKey);
  return request<string[]>(`${BASE}/docGroupDict?${qs.toString()}`);
}

/** 类型别名（供组件统一引用） */
export type DocumentDetailData = DocumentData;
export type DocumentExtItem = ExtFieldData;

/** 统一 API 对象（供组件以 documentApi.xxx 形式调用） */
export const documentApi = {
  list: listDocuments,
  getById: getDocumentById,
  getByOnlyKey: getDocumentByOnlyKey,
  getExtFields,
  create: createDocument,
  update: updateDocument,
  delete: deleteDocument,
  getDocGroupDict,
};
