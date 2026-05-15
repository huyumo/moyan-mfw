import 'reflect-metadata';
import type { DictMetaOptions, DictItem } from './types';
export declare const META_KEY: unique symbol;
export declare const ITEMS_KEY: unique symbol;
export declare function DictMeta(options: DictMetaOptions): ClassDecorator;
export declare function DictEntry(item: Omit<DictItem, 'value'>): PropertyDecorator;
