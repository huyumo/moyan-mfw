"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictMeta = DictMeta;
exports.DictEntry = DictEntry;
require("reflect-metadata");
const types_1 = require("./types");
const registry_1 = require("./registry");
function DictMeta(options) {
    return (target) => {
        Reflect.defineMetadata(types_1.META_KEY, options, target);
        (0, registry_1.registerDict)(target);
    };
}
function DictEntry(item) {
    return (target, propertyKey) => {
        const items = Reflect.getOwnMetadata(types_1.ITEMS_KEY, target) || [];
        items.push({ key: String(propertyKey), item });
        Reflect.defineMetadata(types_1.ITEMS_KEY, items, target);
    };
}
//# sourceMappingURL=decorator.js.map