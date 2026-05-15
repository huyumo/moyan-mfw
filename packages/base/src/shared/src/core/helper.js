"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toItems = toItems;
exports.getLabel = getLabel;
exports.getMeta = getMeta;
exports.toDescription = toDescription;
exports.toDbItems = toDbItems;
require("reflect-metadata");
const types_1 = require("./types");
function toItems(dictClass) {
    const entries = Reflect.getOwnMetadata(types_1.ITEMS_KEY, dictClass) || [];
    return entries.map(({ key, item }) => ({
        ...item,
        value: dictClass[key],
    }));
}
function getLabel(dictClass, value) {
    return toItems(dictClass).find(i => i.value === value)?.label ?? '--';
}
function getMeta(dictClass) {
    return Reflect.getOwnMetadata(types_1.META_KEY, dictClass);
}
function toDescription(dictClass) {
    const meta = getMeta(dictClass);
    const name = meta?.label ?? '';
    const mapping = toItems(dictClass).map(i => `${i.value}=${i.label}`).join(', ');
    return `${name}: ${mapping}`;
}
function toDbItems(dictClass) {
    return toItems(dictClass).map(({ value, label }) => ({ value, label }));
}
//# sourceMappingURL=helper.js.map