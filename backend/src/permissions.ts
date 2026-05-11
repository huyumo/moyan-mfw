/**
 * @fileoverview 业务层权限配置
 * @description 定义业务层扩展权限值，并提供带有类型推断的装饰器
 */

import { createBusinessPermissionDecorator } from 'moyan-base/backend';
import { BUSINESS_PERMISSION_VALUES } from 'business-dict';

export const Permission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);