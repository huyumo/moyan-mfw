import type { Component } from 'vue';

export type ButtonType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ActionButtonConfig {
  label: string;
  type?: ButtonType;
  icon?: Component;
  onClick: (row: any) => void;
  permission?: string[];
  disabled?: boolean | ((row: any) => boolean);
  visible?: boolean | ((row: any) => boolean);
}

export interface ActionButtonsOptions {
  maxVisible?: number;
  moreText?: string;
}

export interface ActionButtonsProps {
  buttons: ActionButtonConfig[];
  row: any;
  maxVisible?: number;
  moreText?: string;
}