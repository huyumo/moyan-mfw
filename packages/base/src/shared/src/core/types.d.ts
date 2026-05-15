export declare const META_KEY: unique symbol;
export declare const ITEMS_KEY: unique symbol;
export interface DictItem {
    value: string | number;
    label: string;
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
export interface DictMetaOptions {
    key: string;
    label: string;
    module?: string;
}
