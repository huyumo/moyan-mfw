
export interface ElRadioGroupV2 {
  modelValue?: string | number |boolean
  options: Array<{ value: string | number; label: string; type?: 'success' | 'info' | 'warning' | 'danger' }>
  disabled: boolean
  size: 'large' | 'default' | 'small'
}
