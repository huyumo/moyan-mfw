export const META_KEY = Symbol.for('dict:meta')
export const ITEMS_KEY = Symbol.for('dict:items')

export interface DictItem {
  value: string | number
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface DictMetaOptions {
  key: string
  label: string
  module?: string
}
