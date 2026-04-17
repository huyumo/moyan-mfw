/**
 * @fileoverview 用户服务
 * @description 处理用户相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { hashPassword } from '../../../common/utils/encrypt';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PaginationResult, PaginationHelper, QueryBuilderHelper } from '../../../common';

/**
 * 用户服务
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建用户
   * @param createUserDto - 创建用户请求参数
   * @returns 创建的用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, password, roleIds, ...rest } = createUserDto;

    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 使用事务创建用户
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 加密密码
      const hashedPassword = await hashPassword(password);

      // 创建用户
      const user = queryRunner.manager.create(User, {
        username,
        password: hashedPassword,
        ...rest,
      });

      await queryRunner.manager.save(user);

      // 绑定角色
      if (roleIds && roleIds.length > 0) {
        const userRoles = roleIds.map((roleId) =>
          queryRunner.manager.create(UserRole, {
            userId: user.id,
            roleId,
          }),
        );
        await queryRunner.manager.save(userRoles);
      }

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 根据 ID 查询用户
   * @param id - 用户 ID
   * @returns 用户信息
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    // 查询用户角色（通过 UserRole 实体）
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    // 将角色信息附加到用户对象
    user.roles = userRoles.map((ur) => ur.role);

    return user;
  }

  /**
   * 根据用户名查询用户
   * @param username - 用户名
   * @returns 用户信息
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  /**
   * 查询用户列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryUserDto): Promise<PaginationResult<User>> {
    const qb = this.userRepository.createQueryBuilder('user');

    // 使用 QueryBuilderHelper 构建查询条件
    QueryBuilderHelper.applyConditions(qb, [
      { field: 'user.username', value: query.username, operator: 'like' },
      { field: 'user.phone', value: query.phone, operator: 'like' },
      { field: 'user.userStatus', value: query.userStatus, operator: '=' },
    ]);

    // 使用 PaginationHelper 执行分页查询
    return PaginationHelper.executeQuery(
      qb.orderBy('user.createdAt', 'DESC'),
      query,
    );
  }

  /**
   * 更新用户
   * @param id - 用户 ID
   * @param updateUserDto - 更新用户请求参数
   * @returns 更新后的用户
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleIds, ...rest } = updateUserDto;

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    // 使用事务更新用户
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 更新用户信息
      Object.assign(user, rest);
      await queryRunner.manager.save(user);

      // 更新角色关联
      if (roleIds) {
        // 删除旧的角色关联
        await queryRunner.manager.delete(UserRole, { userId: user.id });

        // 添加新的角色关联
        if (roleIds.length > 0) {
          const userRoles = roleIds.map((roleId) =>
            queryRunner.manager.create(UserRole, {
              userId: user.id,
              roleId,
            }),
          );
          await queryRunner.manager.save(userRoles);
        }
      }

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 删除用户
   * @param id - 用户 ID
   */
  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    // 使用软删除
    await this.userRepository.softDelete(id);
  }

  /**
   * 更新用户状态
   * @param id - 用户 ID
   * @param status - 新状态
   * @returns 更新后的用户
   */
  async updateStatus(id: string, status: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    user.userStatus = status;
    return this.userRepository.save(user);
  }

  /**
   * 重置用户密码
   * @param id - 用户 ID
   * @param newPassword - 新密码
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }
}
