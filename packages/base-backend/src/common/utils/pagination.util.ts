/**
 * @fileoverview 分页查询工具类
 * @description 提供通用的分页查询参数、返回结果和查询条件构建方法
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOptionsOrder,
  SelectQueryBuilder,
  ObjectLiteral,
} from 'typeorm';

/**
 * 分页参数 DTO
 * @description 通用的分页请求参数，可被其他 DTO 继承
 * @example
 * ```typescript
 * class QueryUserDto extends PaginationQueryDto {
 *   @ApiProperty({ description: '用户名', required: false })
 *   @IsOptional()
 *   @IsString()
 *   username?: string;
 * }
 * ```
 */
export class PaginationQueryDto {
  /**
   * 当前页码
   * @default 1
   */
  @ApiProperty({ description: '当前页码', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数量
   * @default 10
   */
  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  /**
   * 排序字段
   * @default 'created_at'
   */
  @ApiProperty({ description: '排序字段', default: 'created_at', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'created_at';

  /**
   * 排序方向
   * @default 'DESC'
   */
  @ApiProperty({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  /**
   * 获取跳过数量
   * @description 用于 TypeORM 的 skip 参数
   */
  getSkip(): number {
    return (this.page! - 1) * this.pageSize!;
  }

  /**
   * 获取限制数量
   * @description 用于 TypeORM 的 take 参数
   */
  getTake(): number {
    return this.pageSize!;
  }

  /**
   * 构建分页查询选项
   * @param where 查询条件
   * @returns FindManyOptions 对象
   */
  buildQueryOptions<T = any>(where?: FindOptionsWhere<T>): FindManyOptions<T> {
    return {
      where,
      skip: this.getSkip(),
      take: this.getTake(),
      order: {
        [this.sortField!]: this.sortOrder,
      } as FindOptionsOrder<T>,
    };
  }
}

/**
 * 分页结果类
 * @description 通用的分页响应结果，包含数据列表和分页信息
 * @typeParam T 数据项类型
 */
export class PaginationResult<T> {
  /** 数据列表 */
  @ApiProperty({ description: '数据列表', isArray: true })
  list: T[];

  /** 总数 */
  @ApiProperty({ description: '总数量' })
  total: number;

  /** 当前页码 */
  @ApiProperty({ description: '当前页码' })
  page: number;

  /** 每页数量 */
  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  /** 总页数 */
  @ApiProperty({ description: '总页数' })
  totalPages: number;

  /** 是否有下一页 */
  @ApiProperty({ description: '是否有下一页', default: false })
  hasNext: boolean;

  /** 是否有上一页 */
  @ApiProperty({ description: '是否有上一页', default: false })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.list = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }

  /**
   * 从 TypeORM 查询结果创建分页结果
   * @param items 数据列表
   * @param total 总数
   * @param pageQuery 分页查询参数
   * @returns PaginationResult 实例
   */
  static fromQuery<T>(
    items: T[],
    total: number,
    pageQuery: PaginationQueryDto,
  ): PaginationResult<T> {
    return new PaginationResult(items, total, pageQuery.page!, pageQuery.pageSize!);
  }
}

/**
 * 分页查询辅助函数
 * @description 提供静态方法，用于构建分页查询
 */
export class PaginationHelper {
  /**
   * 应用分页到 QueryBuilder
   * @param qb TypeORM QueryBuilder 实例
   * @param pageQuery 分页查询参数
   * @returns QueryBuilder 实例（支持链式调用）
   */
  static applyPagination<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    pageQuery: PaginationQueryDto,
  ): SelectQueryBuilder<T> {
    return qb.skip(pageQuery.getSkip()).take(pageQuery.getTake());
  }

  /**
   * 应用排序到 QueryBuilder
   * @param qb TypeORM QueryBuilder 实例
   * @param pageQuery 分页查询参数
   * @param alias 表别名（可选，默认为第一个别名）
   * @returns QueryBuilder 实例（支持链式调用）
   */
  static applyOrder<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    pageQuery: PaginationQueryDto,
    alias?: string,
  ): SelectQueryBuilder<T> {
    const qbAlias = alias || qb.alias;
    return qb.orderBy(`${qbAlias}.${pageQuery.sortField}`, pageQuery.sortOrder);
  }

  /**
   * 执行分页查询
   * @param qb TypeORM QueryBuilder 实例（不包含 skip/take）
   * @param pageQuery 分页查询参数
   * @returns 分页结果
   */
  static async executeQuery<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    pageQuery: PaginationQueryDto,
  ): Promise<PaginationResult<T>> {
    const [items, total] = await qb
      .skip(pageQuery.getSkip())
      .take(pageQuery.getTake())
      .getManyAndCount();

    return PaginationResult.fromQuery(items, total, pageQuery);
  }
}

