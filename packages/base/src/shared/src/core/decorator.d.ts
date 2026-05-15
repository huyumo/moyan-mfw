import 'reflect-metadata';
import type { DictMetaOptions, DictItem } from './types';
export declare function DictMeta(options: DictMetaOptions): ClassDecorator;
export declare function DictEntry(item: Omit<DictItem, 'value'>): PropertyDecorator;
