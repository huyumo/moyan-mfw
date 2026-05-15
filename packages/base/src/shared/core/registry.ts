import 'reflect-metadata'
import { META_KEY, ITEMS_KEY } from './types'
import type { DictItem, DictMetaOptions } from './types'

const registry = new Map<string, any>()

export function registerDict(dictClass: any): void {
  registry.set(dictClass.name, dictClass)
}

export function getAllDicts(): Array<{
  key: string
  label: string
  module?: string
  items: DictItem[]
}> {
  return Array.from(registry.values()).map(cls => {
    const meta: DictMetaOptions | undefined = Reflect.getOwnMetadata(META_KEY, cls)
    const entries: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
      Reflect.getOwnMetadata(ITEMS_KEY, cls) || []

    return {
      key: meta?.key ?? '',
      label: meta?.label ?? '',
      module: meta?.module,
      items: entries.map(({ key, item }) => ({
        ...item,
        value: cls[key],
      })),
    }
  })
}
