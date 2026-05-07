import 'reflect-metadata'
import { META_KEY, ITEMS_KEY } from './decorator'
import type { DictItem, DictMetaOptions } from './types'

export function toItems<T>(dictClass: T): DictItem[] {
  const entries: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
    Reflect.getOwnMetadata(ITEMS_KEY, (dictClass as any).prototype ?? dictClass) || []

  return entries.map(({ key, item }) => ({
    ...item,
    value: (dictClass as any)[key],
  }))
}

export function getLabel<T>(dictClass: T, value: string | number): string {
  return toItems(dictClass).find(i => i.value === value)?.label ?? '--'
}

export function getMeta<T extends Object>(dictClass: T): DictMetaOptions | undefined {
  return Reflect.getOwnMetadata(META_KEY, dictClass)
}

export function toDescription<T extends Object>(dictClass: T): string {
  const meta = getMeta(dictClass)
  const name = meta?.label ?? ''
  const mapping = toItems(dictClass).map(i => `${i.value}=${i.label}`).join(', ')
  return `${name}: ${mapping}`
}

export function toDbItems<T>(dictClass: T): Array<{ value: string | number; label: string }> {
  return toItems(dictClass).map(({ value, label }) => ({ value, label }))
}
