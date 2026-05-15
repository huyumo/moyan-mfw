/**
 * @fileoverview 权限实体
 * @description 系统权限实体，定义系统中的所有权限点
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Base } from '../../../../../common/entities/base.entity';
import { toDescription, StatusDict, PermissionTypeDict, NodeTypeDict, IsAutoSyncDict, IsVisibleDict, IsCacheDict, ShowModeDict } from '../../../../../../shared/src';

/**
 * 权限类型枚举
 */
export enum PermissionType {
  /** 平台权限 - 跨应用的全局权限 */
  PC = 'PC',
  /** 普通权限 - 单个应用的权限 */
  NORMAL = 'NORMAL',
}

/**
 * 节点类型枚举
 */
export enum NodeType {
  /** 菜单节点 */
  MENU = 'MENU',
  /** 页面节点 */
  PAGE = 'PAGE',
  /** 标签/按钮节点 */
  TAG = 'TAG',
}

/**
 * 显示模式枚举
 */
export enum ShowMode {
  /** 正常显示 */
  NORMAL = 'NORMAL',
  /** 开发者模式显示 */
  DEV = 'DEV',
}

/**
 * 权限实体类
 * @description 系统权限表，定义系统中的所有权限点
 */
@Entity('sys_permissions')
@Unique(['permCode'])
export class Permission extends Base {
  /**
   * 权限 ID
   * @description 主键，UUID 格式
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 权限名称
   * @description 权限的中文名称
   */
  @Column({ type: 'varchar', length: 64, comment: '权限名称 - 权限的中文名称' })
  permName: string;

  /**
   * 权限编码
   * @description 权限的唯一标识，根据tree 树结构自动组装，例如：normal_root:xxx:xxx:xxx，pc_root:sys:permission
   */
  @Column({ type: 'varchar', length: 128, comment: '权限编码 - 唯一标识，根据树结构自动组装' })
  permCode: string;

  /**
   * 权限描述
   * @description 权限的详细描述
   */
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '权限描述 - 详细说明' })
  permDesc: string;

  /**
   * 权限类型
   * @description PC-平台权限 / NORMAL-普通权限
   */
  @Column({ type: 'enum', enum: PermissionType, comment: toDescription(PermissionTypeDict) })
  @Index()
  permissionType: PermissionType;

  /**
   * 节点类型
   * @description MENU-菜单/PAGE-页面/TAG-标签
   */
  @Column({ type: 'enum', enum: NodeType, nullable: true, comment: toDescription(NodeTypeDict) })
  nodeType: NodeType;

  /**
   * 父权限 ID
   * @description 父级权限 ID，用于构建树形结构
   */
  @Column({ type: 'char', length: 36, nullable: true, comment: '父权限 ID - 构建树形结构' })
  @Index()
  parentId: string | null;

  /**
   * 父权限
   * @description 父级权限对象
   */
  @ManyToOne(() => Permission, (permission) => permission.children)
  @JoinColumn({ name: 'parentId' })
  parent: Permission;

  /**
   * 子权限列表
   * @description 子权限列表
   */
  @OneToMany(() => Permission, (permission) => permission.parent)
  children: Permission[];

  /**
   * 路由路径
   * @description 前端路由路径，用于菜单导航
   */
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '路由路径 - 前端路由路径' })
  @Index()
  routePath: string;

  /**
   * 是否自动同步
   * @description 是否由系统自动同步生成
   */
  @Column({ type: 'tinyint', default: IsAutoSyncDict.NO, comment: toDescription(IsAutoSyncDict) })
  @Index()
  isAutoSync: number;

  /**
   * 外部链接
   * @description 外部跳转 URL，用于外链菜单
   */
  @Column({ type: 'varchar', length: 500, nullable: true, comment: '外部链接 URL - 用于外链菜单' })
  externalUrl: string;

  /**
   * 图标名称
   * @description 前端展示的图标名称
   */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '图标名称 - 前端展示的图标' })
  iconName: string;

  /**
   * 排序
   * @description 权限排序号，数值越小越靠前
   */
  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number;

  /**
   * 是否可见
   * @description 是否在前端菜单中显示
   */
  @Column({ type: 'tinyint', default: IsVisibleDict.YES, comment: toDescription(IsVisibleDict) })
  isVisible: number;

  /**
   * 是否缓存
   * @description 是否缓存页面
   */
  @Column({ type: 'tinyint', default: IsCacheDict.YES, comment: toDescription(IsCacheDict) })
  isCache: number;

  /**
   * 显示模式
   * @description NORMAL-正常显示 / DEV-开发者模式显示
   */
  @Column({ type: 'enum', enum: ShowMode, default: ShowMode.NORMAL, comment: toDescription(ShowModeDict) })
  showMode: ShowMode;

  /**
   * 权限状态
   * @description 状态 - 1:启用 0:禁用 - 控制权限是否可用
   */
  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  permStatus: number;

  /**
   * 权限值
   * @description 位运算权限值，用于细粒度权限控制
   */
  @Column({ type: 'bigint', unsigned: true, default: 0, comment: '权限值 - 位运算权限值，用于细粒度权限控制' })
  permissionValue: bigint;

  /**
   * 关联角色
   * @description 关联此权限的所有角色（通过 sys_role_permissions 关联表）
   */
  // 注：实际关系通过 RolePermission 实体管理，避免循环依赖
  roles: any[];
}
