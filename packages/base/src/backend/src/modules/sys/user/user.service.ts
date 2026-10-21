/**
 * @fileoverview 用户服务
 * @description 处理用户相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { CreateUserDto, AdminCreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { hashPassword } from '../../../common/utils/encrypt';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PaginationResult, PaginationX, WhereBuilder } from '../../../common';
import { Cacheable, CacheEvict } from '../../../cache/decorators/cache.decorator';
// 注意：直接导入具体文件而非 '../spi' 聚合导出，避免与 spi/impl 产生循环 require
import { SpiEventBus } from '../spi/events/event-bus';

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
    private eventBus: SpiEventBus,
  ) {}

  /**
   * 创建用户
   * @param createUserDto - 创建用户请求参数
   * @returns 创建的用户
   */
  @CacheEvict({ keys: ['sys:user:*'] })
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, password, ...rest } = createUserDto;

    // 检查用户名是否存在（唯一索引横跨软删除行，需 withDeleted 一并排查）
    const existingUser = await this.userRepository.findOne({
      where: { username },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException(this.usernameConflictMessage(existingUser));
    }

    // 检查手机号是否已被占用（同上，软删除用户仍占唯一索引）
    if (createUserDto.phone) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phone: createUserDto.phone },
        withDeleted: true,
      });

      if (existingByPhone) {
        throw new ConflictException(this.phoneConflictMessage(existingByPhone));
      }
    }

    // 使用事务创建用户
    const user = await this.dataSource.transaction(async (manager) => {
      const hashedPassword = await hashPassword(password);

      const created = manager.create(User, {
        username,
        password: hashedPassword,
        ...rest,
      });

      try {
        await manager.save(created);
      } catch (error) {
        // 并发下预检与插入之间存在窗口，唯一键冲突兜底翻译为 409
        if (this.isDuplicateKeyError(error)) {
          throw new ConflictException('用户名或手机号已被占用');
        }
        throw error;
      }

      return created;
    });

    // SPI 事件：用户创建（框架层入口，业务方监听）
    await this.eventBus.emitUserCreated({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      userStatus: user.userStatus,
    });

    return user;
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

  private usernameConflictMessage(existing: User): string {
    return existing.deleteAt ? '该用户名已被已注销账号占用' : '用户名已存在';
  }

  private phoneConflictMessage(existing: User): string {
    if (existing.deleteAt) {
      return '该手机号已被已注销账号占用';
    }
    return `该手机号已被用户【${existing.nickname || existing.username}】使用`;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    const code = (error as { driverError?: { code?: string } })?.driverError?.code;
    return code === 'ER_DUP_ENTRY';
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
  @Cacheable({ key: 'sys:user:{#id}' })
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
  @Cacheable({ key: 'sys:user:username:{#username}' })
  async findByUsername(username: string): Promise<User | null> {
    // 注意：User.roles 为普通属性（经 UserRole 查询填充），非 ORM 关联，不能用 relations 加载
    return this.userRepository.findOne({
      where: { username },
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
  @CacheEvict({ keys: ['sys:user:{#id}', 'sys:user:username:*'] })
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const before = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'nickname', 'phone', 'email', 'userStatus'],
    });

    const user = await this.dataSource.transaction(async (manager) => {
      const found = await manager.findOne(User, { where: { id } });

      if (!found) {
        throw new NotFoundError('用户');
      }

      // 手机号变更时预检（软删除用户仍占唯一索引，需 withDeleted 一并排查）
      if (updateUserDto.phone && updateUserDto.phone !== found.phone) {
        const existingByPhone = await manager.findOne(User, {
          where: { phone: updateUserDto.phone },
          withDeleted: true,
        });

        if (existingByPhone && existingByPhone.id !== id) {
          throw new ConflictException(this.phoneConflictMessage(existingByPhone));
        }
      }

      Object.assign(found, updateUserDto);

      try {
        await manager.save(found);
      } catch (error) {
        // 并发下预检与保存之间存在窗口，唯一键冲突兜底翻译为 409
        if (this.isDuplicateKeyError(error)) {
          throw new ConflictException('用户名或手机号已被占用');
        }
        throw error;
      }

      return found;
    });

    // SPI 事件：用户更新（框架层入口，业务方监听）
    await this.eventBus.emitUserUpdated({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      userStatus: user.userStatus,
      before: before
        ? {
            nickname: before.nickname,
            phone: before.phone,
            email: before.email,
            userStatus: before.userStatus,
          }
        : undefined,
    });

    return user;
  }

  /**
   * 删除用户
   * @param id - 用户 ID
   */
  @CacheEvict({ keys: ['sys:user:{#id}', 'sys:user:username:*'] })
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

    // SPI 事件：用户删除（框架层入口，业务方监听）
    await this.eventBus.emitUserDeleted({ id, username: user.username });
  }

  /**
   * 更新用户状态
   * @param id - 用户 ID
   * @param status - 新状态
   * @returns 更新后的用户
   */
  @CacheEvict({ keys: 'sys:user:{#id}' })
  async updateStatus(id: string, status: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('用户');
    }

    const beforeStatus = user.userStatus;
    user.userStatus = status;
    const saved = await this.userRepository.save(user);

    // SPI 事件：用户状态变更（框架层入口，业务方监听）
    await this.eventBus.emitUserUpdated({
      id: saved.id,
      username: saved.username,
      nickname: saved.nickname,
      phone: saved.phone,
      email: saved.email,
      userStatus: saved.userStatus,
      before: { userStatus: beforeStatus },
    });

    return saved;
  }

  /**
   * 重置用户密码
   * @param id - 用户 ID
   * @param newPassword - 新密码
   */
  @CacheEvict({ keys: 'sys:user:{#id}' })
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
