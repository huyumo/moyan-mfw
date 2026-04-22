import './style.scss';

import { h, type VNode } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { More } from '@element-plus/icons-vue';
import { usePermission } from '../../../hooks';
import type { ActionButtonConfig, ActionButtonsOptions } from './types';

const DEFAULT_MAX_VISIBLE = 2;
const DEFAULT_MORE_TEXT = '更多';

function resolveVisible(value: boolean | ((row: any) => boolean) | undefined, row: any): boolean {
  if (value === undefined) return true;
  if (typeof value === 'function') return value(row);
  return value;
}

function resolveDisabled(value: boolean | ((row: any) => boolean) | undefined, row: any): boolean {
  if (value === undefined) return false;
  if (typeof value === 'function') return value(row);
  return value;
}

function filterButtonsByPermission(buttons: ActionButtonConfig[]): ActionButtonConfig[] {
  const { hasPermissionValue } = usePermission();
  return buttons.filter((btn) => {
    if (!btn.permission) return true;
    return hasPermissionValue({ value: btn.permission });
  });
}

function filterButtonsByVisibility(buttons: ActionButtonConfig[], row: any): ActionButtonConfig[] {
  return buttons.filter((btn) => resolveVisible(btn.visible, row));
}

function renderButton(btn: ActionButtonConfig, row: any): VNode {
  const disabled = resolveDisabled(btn.disabled, row);
  return h(ElButton, {
    type: btn.type || 'primary',
    link: true,
    icon: btn.icon,
    disabled,
    onClick: () => btn.onClick(row),
  }, () => btn.label);
}

function renderMoreButton(hiddenButtons: ActionButtonConfig[], row: any, moreText: string): VNode {
  const hiddenButtonsNodes = hiddenButtons.map((btn) => renderButton(btn, row));
  return h(ElTooltip, {
    placement: 'bottom',
    effect: 'light',
    trigger: 'hover',
    popperClass: 'action-buttons-more-popper',
  }, {
    default: () => h(ElButton, {
      type: 'primary',
      link: true,
      icon: More,
    }, () => moreText),
    content: () => h('div', { class: 'action-buttons-more-content' }, hiddenButtonsNodes),
  });
}

export function renderActionButtons(
  buttons: ActionButtonConfig[],
  options: ActionButtonsOptions = {},
  row?: any
): VNode {
  const maxVisible = options.maxVisible ?? DEFAULT_MAX_VISIBLE;
  const moreText = options.moreText ?? DEFAULT_MORE_TEXT;

  const filteredByVisibility = filterButtonsByVisibility(buttons, row);
  const filteredByPermission = filterButtonsByPermission(filteredByVisibility);

  if (filteredByPermission.length === 0) {
    return h('div', { class: 'action-buttons' });
  }

  if (filteredByPermission.length <= maxVisible) {
    const buttonNodes = filteredByPermission.map((btn) => renderButton(btn, row));
    return h('div', { class: 'action-buttons' }, buttonNodes);
  }

  const visibleButtons = filteredByPermission.slice(0, maxVisible);
  const hiddenButtons = filteredByPermission.slice(maxVisible);

  const visibleButtonNodes = visibleButtons.map((btn) => renderButton(btn, row));
  const moreButtonNode = renderMoreButton(hiddenButtons, row, moreText);

  return h('div', { class: 'action-buttons' }, [...visibleButtonNodes, moreButtonNode]);
}