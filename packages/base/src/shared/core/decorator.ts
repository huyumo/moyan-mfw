import 'reflect-metadata'
import type { DictMetaOptions, DictItem } from './types'
import { META_KEY, ITEMS_KEY } from './types'
import { registerDict } from './registry'

export function DictMeta(options: DictMetaOptions): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(META_KEY, options, target)
    registerDict(target)
  }
}

export function DictEntry(item: Omit<DictItem, 'value'>): PropertyDecorator {
  return (target: any, propertyKey) => {
    const items: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
      Reflect.getOwnMetadata(ITEMS_KEY, target) || []
    items.push({ key: String(propertyKey), item })
    Reflect.defineMetadata(ITEMS_KEY, items, target)
  }
}
