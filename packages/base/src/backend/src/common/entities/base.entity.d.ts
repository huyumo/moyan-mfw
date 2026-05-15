/**
 * @fileoverview 基础实体基类
 * @description 所有业务实体类的基类，提供通用的审计字段
 */
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
export declare abstract class Base {
    /**
     * 创建时间
     * @description 记录创建时的时间戳，首次插入时自动设置
     * @type {Date}
     */
    createdAt: Date;
    /**
     * 更新时间
     * @description 记录最后修改时的时间戳，每次更新自动刷新
     * @type {Date}
     */
    updateAt: Date;
    /**
     * 删除时间
     * @description 逻辑删除时使用，记录删除时的时间戳，未删除时为 null
     * @type {Date}
     */
    deleteAt: Date;
}
