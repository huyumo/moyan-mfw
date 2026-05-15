/**
 * @fileoverview API 响应工具包装
 * @description base-backend 的 ApiResponseUtil 被声明为 export type，通过 require 获取运行时值
 */
const bb = require('moyan-mfw-base/backend')
export const ApiResponseUtil = bb.ApiResponseUtil as {
  success: (data: unknown, message: string) => { code: number; data: unknown; message: string }
  error: (message: string, code?: number) => { code: number; message: string }
}
