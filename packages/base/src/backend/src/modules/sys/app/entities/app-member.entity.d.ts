/**
 * @fileoverview 应用成员关联实体
 * @description 应用与成员的关联关系
 */
import { Base } from '../../../../common/entities/base.entity';
import { App } from './app.entity';
import { User } from '../../user/entities/user.entity';
/**
 * 应用成员关联实体
 * @description 记录应用与成员的关联关系，包含成员在应用中的角色
 */
export declare class AppMember extends Base {
    /**
     * 主键 ID
     */
    id: string;
    /**
     * 应用 ID
     */
    appId: string;
    /**
     * 应用
     */
    app: App;
    /**
     * 用户 ID
     */
    userId: string;
    /**
     * 用户
     */
    user: User;
}
