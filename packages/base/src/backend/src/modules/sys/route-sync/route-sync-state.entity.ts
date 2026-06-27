/**
 * @fileoverview 路由同步状态实体
 * @description 记录每个 AppType 最后一次菜单树同步的哈希值，用于增量同步判断
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
} from "typeorm";
import { Base } from "@/common/entities/base.entity";

/**
 * 路由同步状态表
 *
 * 存储每个 AppType 的菜单树配置哈希值，启动时对比决定是否需要重新同步。
 * 如果配置未变更则跳过同步，减少数据库写入。
 */
@Entity("sys_route_sync_state")
@Index(["appTypeCode"], { unique: true })
export class RouteSyncState extends Base {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** 应用类型编码（如 'system', 'supplier'），唯一索引 */
  @Column({ type: "varchar", length: 64 })
  appTypeCode: string;

  /** 菜单树配置的 SHA256 哈希值 */
  @Column({ type: "varchar", length: 64 })
  configHash: string;

  /** 上次同步时间 */
  @Column({ type: "datetime", nullable: true })
  syncedAt: Date;
}
