"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDict = registerDict;
exports.getAllDicts = getAllDicts;
require("reflect-metadata");
const types_1 = require("./types");
const registry = new Map();
function registerDict(dictClass) {
    registry.set(dictClass.name, dictClass);
}
function getAllDicts() {
    return Array.from(registry.values()).map(cls => {
        const meta = Reflect.getOwnMetadata(types_1.META_KEY, cls);
        const entries = Reflect.getOwnMetadata(types_1.ITEMS_KEY, cls) || [];
        return {
            key: meta?.key ?? '',
            label: meta?.label ?? '',
            module: meta?.module,
            items: entries.map(({ key, item }) => ({
                ...item,
                value: cls[key],
            })),
        };
    });
}
//# sourceMappingURL=registry.js.map