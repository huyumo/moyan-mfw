import './style.scss';

import { defineComponent, type PropType } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { More } from '@element-plus/icons-vue';
import { usePermission } from '../../../hooks';
import type { ActionButtonConfig, ActionButtonsProps } from './types';

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

export default defineComponent({
  name: 'ActionButtons',

  props: {
    buttons: {
      type: Array as PropType<ActionButtonConfig[]>,
      required: true,
    },
    row: {
      type: Object as PropType<any>,
      default: undefined,
    },
    maxVisible: {
      type: Number,
      default: DEFAULT_MAX_VISIBLE,
    },
    moreText: {
      type: String,
      default: DEFAULT_MORE_TEXT,
    },
  },

  setup(props: ActionButtonsProps) {
    const { hasPermissionValue } = usePermission();

    const filterButtons = () => {
      const filteredByVisibility = props.buttons.filter((btn) => resolveVisible(btn.visible, props.row));

      return filteredByVisibility.filter((btn) => {
        if (!btn.permission) return true;
        return hasPermissionValue({ value: btn.permission });
      });
    };

    const renderButton = (btn: ActionButtonConfig) => {
      const disabled = resolveDisabled(btn.disabled, props.row);
      return (
        <ElButton
          type={btn.type || 'primary'}
          link
          icon={btn.icon}
          disabled={disabled}
          {...(btn.testId ? { 'data-testid': btn.testId } : {})}
          onClick={() => btn.onClick(props.row)}
        >
          {btn.label}
        </ElButton>
      );
    };

    const renderMoreButton = (hiddenButtons: ActionButtonConfig[]) => {
      const hiddenButtonsNodes = hiddenButtons.map(renderButton);
      return (
        <ElTooltip
          placement="top"
          effect="light"
          trigger="hover"
          popperClass="action-buttons-more-popper"
        >
          {{
            default: () => (
              <ElButton type="primary" link icon={More}>
                {props.moreText}
              </ElButton>
            ),
            content: () => (
              <div class="action-buttons-more-content">{hiddenButtonsNodes}</div>
            ),
          }}
        </ElTooltip>
      );
    };

    return () => {
      const filteredButtons = filterButtons();
      const maxVisible = props.maxVisible ?? DEFAULT_MAX_VISIBLE;

      if (filteredButtons.length === 0) {
        return <div class="action-buttons" />;
      }

      if (filteredButtons.length <= maxVisible) {
        const buttonNodes = filteredButtons.map(renderButton);
        return <div class="action-buttons">{buttonNodes}</div>;
      }

      const visibleButtons = filteredButtons.slice(0, maxVisible);
      const hiddenButtons = filteredButtons.slice(maxVisible);

      const visibleButtonNodes = visibleButtons.map(renderButton);
      const moreButtonNode = renderMoreButton(hiddenButtons);

      return (
        <div class="action-buttons">
          {visibleButtonNodes}
          {moreButtonNode}
        </div>
      );
    };
  },
});