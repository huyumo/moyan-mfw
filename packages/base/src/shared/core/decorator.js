"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITEMS_KEY = exports.META_KEY = void 0;
exports.DictMeta = DictMeta;
exports.DictEntry = DictEntry;
require("reflect-metadata");
const registry_1 = require("./registry");
exports.META_KEY = Symbol('dict:meta');
exports.ITEMS_KEY = Symbol('dict:items');
function DictMeta(options) {
    return (target) => {
        Reflect.defineMetadata(exports.META_KEY, options, target);
        (0, registry_1.registerDict)(target);
    };
}
function DictEntry(item) {
    return (target, propertyKey) => {
        const items = Reflect.getOwnMetadata(exports.ITEMS_KEY, target) || [];
        items.push({ key: String(propertyKey), item });
        Reflect.defineMetadata(exports.ITEMS_KEY, items, target);
    };
}
//# sourceMappingURL=decorator.js.map