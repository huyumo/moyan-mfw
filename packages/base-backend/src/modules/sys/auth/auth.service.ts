/**
 * @fileoverview 认证服务
 * @description 处理用户认证相关业务逻辑
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { verifyPassword } from '../../../common/utils/encrypt';
import { LoginDto } from './dto/req/login.dto';
import { LoginResponseDto, UserInfoDto } from './dto/res/auth-response.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   * @param loginDto - 登录请求参数
   * @returns 登录响应（包含 Token）
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      // 用户不存在，返回 401 错误码
      throw new BusinessException('用户名或密码错误', 401);
    }

    // 检查用户状态
    if (user.userStatus !== 1) {
      throw new BusinessException('用户已被禁用', 403);
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // 密码错误，返回 401 错误码
      throw new BusinessException('用户名或密码错误', 401);
    }

    // 查询用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    // 生成 Token
    const payload = {
      sub: user.id,
      username: user.username,
      roleIds: userRoles.map((ur) => ur.roleId),
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
      },
    };
  }

  /**
   * 刷新 Token
   * @param refreshToken - 刷新 Token
   * @returns 新的 Token 对
   */
  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    try {
      // 验证刷新 Token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new BusinessException('用户不存在', 404);
      }

      // 查询用户角色
      const userRoles = await this.userRoleRepository.find({
        where: { userId: user.id },
        relations: ['role'],
      });

      // 生成新的 Token（使用当前时间戳确保 token 唯一）
      const newPayload = {
        sub: user.id,
        username: user.username,
        roleIds: userRoles.map((ur) => ur.roleId),
        iat: Date.now() / 1000, // 使用当前时间戳
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      };
    } catch (error) {
      // Token 验证失败，返回 401 错误码
      throw new BusinessException('刷新 Token 无效或已过期', 401);
    }
  }

  /**
   * 获取当前用户信息
   * @param userId - 用户 ID
   * @returns 用户信息
   */
  async getCurrentUser(userId: string): Promise<UserInfoDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException('用户不存在', 404);
    }

    // 查询用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar || '',
      // 返回角色名称列表
      roles: userRoles.map((ur) => ur.role.roleName) || [],
    };
  }

  /**
   * 退出登录
   * @description 清理 Token（可在 Redis 中将 Token 加入黑名单）
   * @param token - 当前 Token
   */
  async logout(_token: string): Promise<void> {
    // TODO: 将 Token 加入 Redis 黑名单
    // await this.redisService.setex(`token_blacklist:${token}`, expiresIn, '1');
  }
}
