"use strict";
/**
 * @fileoverview 基础实体基类
 * @description 所有业务实体类的基类，提供通用的审计字段
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const typeorm_1 = require("typeorm");
/**
 * 基础实体类
 * @description 提供创建时间、更新时间、删除时间三个通用审计字段
 *
 * @example
 * ```typescript
 * @Entity('sys_users')
 * export class User extends Base {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *
 *   @Column({ type: 'varchar', length: 50 })
 *   username: string;
 * }
 * ```
 */
class Base {
    /**
     * 创建时间
     * @description 记录创建时的时间戳，首次插入时自动设置
     * @type {Date}
     */
    createdAt;
    /**
     * 更新时间
     * @description 记录最后修改时的时间戳，每次更新自动刷新
     * @type {Date}
     */
    updateAt;
    /**
     * 删除时间
     * @description 逻辑删除时使用，记录删除时的时间戳，未删除时为 null
     * @type {Date}
     */
    deleteAt;
}
exports.Base = Base;
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', nullable: false }),
    __metadata("design:type", Date)
], Base.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Base.prototype, "updateAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Base.prototype, "deleteAt", void 0);
//# sourceMappingURL=base.entity.js.map