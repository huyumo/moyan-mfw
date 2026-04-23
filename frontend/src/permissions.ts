/**
 * @fileoverview 业务层权限配置
 */

import { createBusinessPageConfigFn } from 'moyan-mfw-base-frontend';

export const BUSINESS_PERMISSION_VALUES = [
  '发货',
  '充值',
  '接待',
  '指派',
] as const;

export const defineBusinessPageConfig = createBusinessPageConfigFn(BUSINESS_PERMISSION_VALUES);