/**
 * @fileoverview 用户服务
 * @description 处理用户相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserRole } from '../../role/entities/user-role.entity';
import { CreateUserDto, AdminCreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { hashPassword } from '../../../../common/utils/encrypt';
import { NotFoundError } from '../../../../common/exceptions/not-found.exception';
import { PaginationResult, PaginationX, WhereBuilder } from '../../../../common';

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
    private configService: ConfigService,
  ) {}

  /**
   * 创建用户
   * @param createUserDto - 创建用户请求参数
   * @returns 创建的用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, password, ...rest } = createUserDto;

    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 使用事务创建用户
    return this.dataSource.transaction(async (manager) => {
      const hashedPassword = await hashPassword(password);

      const user = manager.create(User, {
        username,
        password: hashedPassword,
        ...rest,
      });

      await manager.save(user);

      return user;
    });
  }

  async adminCreate(dto: AdminCreateUserDto): Promise<User> {
    const password = this.resolveDefaultPassword(dto.phone);
    return this.create({ ...dto, password } as CreateUserDto);
  }

  private resolveDefaultPassword(phone: string): string {
    const userConfig = this.configService.get<any>('userConfig');
    const type = userConfig?.defaultPassword?.type || 'fixed';
    const value = userConfig?.defaultPassword?.value || 'Admin@123';

    if (type === 'phone') {
      if (!phone || phone.length < 8) {
        return phone || value;
      }
      return phone.slice(-8);
    }

    return value;
  }

  async findOneByKeyword(keyword: string, searchBy: 'username' | 'phone' | 'both'): Promise<User | null> {
    const conditions: Array<Record<string, string>> = [];

    if (searchBy === 'username' || searchBy === 'both') {
      conditions.push({ username: keyword });
    }
    if (searchBy === 'phone' || searchBy === 'both') {
      conditions.push({ phone: keyword });
    }

    if (conditions.length === 0) return null;

    return this.userRepository.findOne({
      where: conditions,
    });
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
  async findAll(query: QueryUserDto): Promise<PaginationResult<any>> {
    const { username, phone, userStatus } = query;
    const whereBuilder = new WhereBuilder();
    whereBuilder
      .like('user.username', username)
      .like('user.phone', phone)
      .eq('user.userStatus', userStatus);

    const pager = new PaginationX(this.dataSource, query);
    return await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || '';
        return `SELECT ${select} FROM sys_users user ${whereClause} ${orderBy} ${limit}`;
      })
      .select('user.*')
      .defaultOrderBy('user.createdAt DESC')
      .getData();
  }

  /**
   * 更新用户
   * @param id - 用户 ID
   * @param updateUserDto - 更新用户请求参数
   * @returns 更新后的用户
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id } });

      if (!user) {
        throw new NotFoundError('用户');
      }

      Object.assign(user, updateUserDto);
      await manager.save(user);

      return user;
    });
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

    if (user.username === 'admin') {
      throw new BadRequestException('admin 用户不可删除');
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
