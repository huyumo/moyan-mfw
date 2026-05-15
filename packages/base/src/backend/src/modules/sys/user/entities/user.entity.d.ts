/**
 * @fileoverview 用户实体
 * @description 系统用户基础实体，存储用户登录和基本信息
 */
import { Base } from '../../../../common/entities/base.entity';
import { ImageResourceDto } from '@/common';
/**
 * 用户实体类
 * @description 系统用户基础表，存储用户登录和基本信息
 */
export declare class User extends Base {
    /**
     * 用户 ID
     * @description 主键，UUID 格式
     */
    id: string;
    /**
     * 用户名
     * @description 登录账号 - 用户登录系统的唯一标识，全局唯一，支持邮箱/手机号/自定义用户名
     */
    username: string;
    /**
     * 密码哈希
     * @description 使用 bcrypt 加密存储，盐值 rounds=10
     */
    password: string;
    /**
     * 昵称
     * @description 用户昵称 - 用于前台展示的用户名称，支持中文、字母、数字，长度 2-50 字符
     */
    nickname: string;
    /**
     * 手机号
     * @description 用户手机号 - 用于接收通知和找回密码，全球唯一
     */
    phone: string;
    /**
     * 邮箱
     * @description 用户邮箱 - 用于接收通知和找回密码
     */
    email: string;
    /**
     * 头像
     * @description 用户头像 - ImageResource 对象
     */
    avatar: ImageResourceDto;
    /**
     * 性别
     * @description 性别 - 0:未知 1:男 2:女
     */
    gender: number;
    /**
     * 用户状态
     * @description 状态 - 1:启用 0:禁用 - 控制用户是否可登录系统
     */
    userStatus: number;
    /**
     * 是否开发者
     * @description 是否开发者标记 - 开发者拥有系统全部权限
     */
    isDeveloper: number;
    /**
     * 关联角色
     * @description 用户关联的所有角色，通过 sys_user_role 关联表管理
     */
    roles: any[];
}
