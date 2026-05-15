import 'reflect-metadata';
import type { DictItem } from './types';
export declare function registerDict(dictClass: any): void;
export declare function getAllDicts(): Array<{
    key: string;
    label: string;
    module?: string;
    items: DictItem[];
}>;
