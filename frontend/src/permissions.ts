/**
 * @fileoverview 业务层权限配置
 */

import { createBusinessPageConfigFn } from 'moyan-mfw-base/frontend';
import { BUSINESS_PERMISSION_VALUES } from 'moyan-mfw-business-dict';

export const defineBusinessPageConfig = createBusinessPageConfigFn(BUSINESS_PERMISSION_VALUES);