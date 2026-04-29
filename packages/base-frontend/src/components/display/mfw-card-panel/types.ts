import type { Component } from 'vue';

export interface CardPanelHeader {
  image?: { src: string; width?: number; height?: number } | string;
  title: string;
  subtitle?: string;
  status?: {
    value: string | number;
    type?: 'success' | 'warning' | 'danger' | 'info';
    text?: string;
  };
  avatarSize?: number;
  gradient?: boolean;
}

export interface CardPanelItem {
  key: string;
  label: string;
  icon?: Component;
  format?: 'text' | 'date' | 'image' | 'dict' | 'tag' | 'custom';
  formatOptions?: Record<string, any>;
  span?: number;
}

export interface CardPanelProps {
  header: CardPanelHeader;
  items: CardPanelItem[];
  data?: Record<string, any>;
  bordered?: boolean;
  loading?: boolean;
  emptyText?: string;
}