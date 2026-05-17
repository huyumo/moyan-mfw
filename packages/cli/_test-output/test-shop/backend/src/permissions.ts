import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';
import { BUSINESS_PERMISSION_VALUES } from 'test-shop-shared';

export const Permission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);
