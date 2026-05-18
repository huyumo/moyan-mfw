import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';
import { TESTSHOP_PERMISSION_VALUES } from 'test-shop-shared'

export const Permission = createBusinessPermissionDecorator(TESTSHOP_PERMISSION_VALUES);
