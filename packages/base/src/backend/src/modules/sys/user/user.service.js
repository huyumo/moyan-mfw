"use strict";
/**
 * @fileoverview 用户服务
 * @description 处理用户相关业务逻辑
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./entities/user.entity");
const user_role_entity_1 = require("../role/entities/user-role.entity");
const encrypt_1 = require("../../../common/utils/encrypt");
const not_found_exception_1 = require("../../../common/exceptions/not-found.exception");
const common_2 = require("../../../common");
/**
 * 用户服务
 */
let UserService = class UserService {
    userRepository;
    userRoleRepository;
    dataSource;
    configService;
    constructor(userRepository, userRoleRepository, dataSource, configService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.dataSource = dataSource;
        this.configService = configService;
    }
    /**
     * 创建用户
     * @param createUserDto - 创建用户请求参数
     * @returns 创建的用户
     */
    async create(createUserDto) {
        const { username, password, ...rest } = createUserDto;
        // 检查用户名是否存在
        const existingUser = await this.userRepository.findOne({
            where: { username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('用户名已存在');
        }
        // 使用事务创建用户
        return this.dataSource.transaction(async (manager) => {
            const hashedPassword = await (0, encrypt_1.hashPassword)(password);
            const user = manager.create(user_entity_1.User, {
                username,
                password: hashedPassword,
                ...rest,
            });
            await manager.save(user);
            return user;
        });
    }
    async adminCreate(dto) {
        const password = this.resolveDefaultPassword(dto.phone);
        return this.create({ ...dto, password });
    }
    resolveDefaultPassword(phone) {
        const userConfig = this.configService.get('userConfig');
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
    async findOneByKeyword(keyword, searchBy) {
        const conditions = [];
        if (searchBy === 'username' || searchBy === 'both') {
            conditions.push({ username: keyword });
        }
        if (searchBy === 'phone' || searchBy === 'both') {
            conditions.push({ phone: keyword });
        }
        if (conditions.length === 0)
            return null;
        return this.userRepository.findOne({
            where: conditions,
        });
    }
    /**
     * 根据 ID 查询用户
     * @param id - 用户 ID
     * @returns 用户信息
     */
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new not_found_exception_1.NotFoundError('用户');
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
    async findByUsername(username) {
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
    async findAll(query) {
        const { username, phone, userStatus } = query;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .like('user.username', username)
            .like('user.phone', phone)
            .eq('user.userStatus', userStatus);
        const pager = new common_2.PaginationX(this.dataSource, query);
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
    async update(id, updateUserDto) {
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, { where: { id } });
            if (!user) {
                throw new not_found_exception_1.NotFoundError('用户');
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
    async delete(id) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new not_found_exception_1.NotFoundError('用户');
        }
        if (user.username === 'admin') {
            throw new common_1.BadRequestException('admin 用户不可删除');
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
    async updateStatus(id, status) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new not_found_exception_1.NotFoundError('用户');
        }
        user.userStatus = status;
        return this.userRepository.save(user);
    }
    /**
     * 重置用户密码
     * @param id - 用户 ID
     * @param newPassword - 新密码
     */
    async resetPassword(id, newPassword) {
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new not_found_exception_1.NotFoundError('用户');
        }
        const hashedPassword = await (0, encrypt_1.hashPassword)(newPassword);
        await this.userRepository.update(id, { password: hashedPassword });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        config_1.ConfigService])
], UserService);
//# sourceMappingURL=user.service.js.map