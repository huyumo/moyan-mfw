/**
 * @fileoverview 角色模块统一导出
 * @description 导出角色模块的所有内容
 */
export { Role } from './entities/role.entity';
export { UserRole } from './entities/user-role.entity';
export { RolePermission } from './entities/role-permission.entity';
export * from './dto';
export { RoleService } from './role.service';
export { RoleController } from './role.controller';
export { RoleModule } from './role.module';
