/**
 * @fileoverview 角色模块统一导出
 * @description 导出角色模块的所有内容
 */

// Entities
export { Role } from './entities/role.entity';
export { UserRole } from './entities/user-role.entity';
export { RolePermission } from './entities/role-permission.entity';

// DTOs
export * from './dto';

// Service
export { RoleService } from './role.service';

// Controller
export { RoleController } from './role.controller';

// Module
export { RoleModule } from './role.module';
