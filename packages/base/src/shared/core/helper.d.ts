import 'reflect-metadata';
import type { DictItem, DictMetaOptions } from './types';
export declare function toItems<T extends Object>(dictClass: T): DictItem[];
export declare function getLabel<T extends Object>(dictClass: T, value: string | number): string;
export declare function getMeta<T extends Object>(dictClass: T): DictMetaOptions | undefined;
export declare function toDescription<T extends Object>(dictClass: T): string;
export declare function toDbItems<T extends Object>(dictClass: T): Array<{
    value: string | number;
    label: string;
}>;
//# sourceMappingURL=helper.d.ts.map