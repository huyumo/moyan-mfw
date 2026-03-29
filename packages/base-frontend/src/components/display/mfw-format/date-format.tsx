/**
 * @fileoverview 日期格式化组件
 * @description 将日期值格式化为指定格式的字符串
 * @example
 * ```vue
 * <mfw-date-format value="2026-03-29" fmt="YYYY-MM-DD" />
 * <mfw-date-format :value="new Date()" fmt="YYYY-MM-DD HH:mm:ss" />
 * ```
 */

import { defineComponent, toRef, computed, type PropType } from 'vue';
import type { DateFormatProps } from './types';

/**
 * 格式化日期
 */
function formatDate(date: Date, fmt: string): string {
  const o: Record<string, number> = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  };

  const week: Record<string, string> = {
    '0': '\u65e5',
    '1': '\u4e00',
    '2': '\u4e8c',
    '3': '\u4e09',
    '4': '\u56db',
    '5': '\u4e94',
    '6': '\u516d'
  };

  // 处理年份
  const yearMatch = fmt.match(/(Y+)/);
  if (yearMatch) {
    const fullMatch = yearMatch[1];
    const year = date.getFullYear().toString();
    fmt = fmt.replace(fullMatch, year.substring(4 - fullMatch.length));
  }

  // 处理星期
  const eraMatch = fmt.match(/(E+)/);
  if (eraMatch) {
    const fullMatch = eraMatch[1];
    const day = date.getDay().toString();
    let eraText: string;
    if (fullMatch.length > 2) {
      eraText = `\u661f${week[day]}`;
    } else if (fullMatch.length > 1) {
      eraText = `\u5468${week[day]}`;
    } else {
      eraText = week[day];
    }
    fmt = fmt.replace(fullMatch, eraText);
  }

  // 处理其他格式
  for (const k in o) {
    const regex = new RegExp('(' + k + ')');
    const match = fmt.match(regex);
    if (match) {
      const fullMatch = match[1];
      const value = o[k];
      const replacement = fullMatch.length === 1
        ? value.toString()
        : ('00' + value).substring(('' + value).length);
      fmt = fmt.replace(fullMatch, replacement);
    }
  }

  return fmt;
}

/**
 * 解析日期字符串
 */
function parseDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
  }

  return null;
}

export default defineComponent({
  name: 'MfwDateFormat',

  props: {
    /** 日期值 */
    value: [Date, String, Number] as PropType<DateFormatProps['value']>,
    /** 格式化模板 */
    fmt: {
      type: String as PropType<DateFormatProps['fmt']>,
      default: 'YYYY-MM-DD HH:mm:ss'
    },
    /** 空值显示文本 */
    emptyText: {
      type: String,
      default: '--'
    }
  },

  emits: ['click'],

  setup(props, { emit, slots }) {
    const value = toRef(props, 'value');
    const fmt = toRef(props, 'fmt');
    const emptyText = toRef(props, 'emptyText');

    /** 格式化后的文本 */
    const formattedText = computed(() => {
      if (value.value === null || value.value === undefined || value.value === '') {
        return emptyText.value;
      }

      const date = parseDate(value.value as string | number | Date);
      if (!date || isNaN(date.getTime())) {
        return String(value.value ?? '');
      }

      return formatDate(date, fmt.value);
    });

    const handleClick = () => {
      emit('click');
    };

    return () => (
      <span class="mfw-date-format" onClick={handleClick}>
        {slots.default?.() ?? formattedText.value}
      </span>
    );
  }
});
