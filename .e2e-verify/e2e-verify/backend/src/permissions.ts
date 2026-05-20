import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';
import { E2EVERIFY_PERMISSION_VALUES } from 'e2e-verify-shared';

export const Permission = createBusinessPermissionDecorator(E2EVERIFY_PERMISSION_VALUES);
