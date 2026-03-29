/**
 * @fileoverview - 业务主题配置
 * 定义业务模块使用的主题样式，包括落日橙和薄荷青两套主题
 */

import type { ThemeRegistry } from './types/layout-theme-types';

export const businessThemes: ThemeRegistry = {
  sunset: {
    label: '落日橙',
    tokens: {
      light: {
        appBackground: '#fff8f4',
        surfaceBackground: '#ffffff',
        borderColor: '#f3dacb',
        textColor: '#3f2c24',
        mutedTextColor: '#86685a',
        primaryColor: '#d26a33',
        headerGradient: 'linear-gradient(120deg, #8a3f1f 0%, #d26a33 55%, #f6a04d 100%)',
        headerTextColor: '#fffaf6',
        cardShadow: '0 10px 28px rgba(210, 106, 51, 0.15)',
      },
      dark: {
        appBackground: '#201711',
        surfaceBackground: '#2e2018',
        borderColor: '#5c3a27',
        textColor: '#faede5',
        mutedTextColor: '#d5b5a1',
        primaryColor: '#f09154',
        headerGradient: 'linear-gradient(120deg, #5e2912 0%, #8a3f1f 55%, #d26a33 100%)',
        headerTextColor: '#fff4ee',
        cardShadow: '0 12px 30px rgba(10, 5, 3, 0.45)',
      },
    },
  },
  mint: {
    label: '薄荷青',
    tokens: {
      light: {
        appBackground: '#effcf6',
        surfaceBackground: '#ffffff',
        borderColor: '#cdeee0',
        textColor: '#15382d',
        mutedTextColor: '#4a6f64',
        primaryColor: '#1f9f7a',
        headerGradient: 'linear-gradient(120deg, #0f5341 0%, #1f9f7a 55%, #5fd0a8 100%)',
        headerTextColor: '#f4fff9',
        cardShadow: '0 10px 26px rgba(31, 159, 122, 0.13)',
      },
      dark: {
        appBackground: '#0f211b',
        surfaceBackground: '#163129',
        borderColor: '#2e5c4f',
        textColor: '#e3fff5',
        mutedTextColor: '#9bcabb',
        primaryColor: '#53cca6',
        headerGradient: 'linear-gradient(120deg, #0b4133 0%, #0f6a54 55%, #1f9f7a 100%)',
        headerTextColor: '#ecfffa',
        cardShadow: '0 12px 30px rgba(4, 16, 12, 0.45)',
      },
    },
  },
};
