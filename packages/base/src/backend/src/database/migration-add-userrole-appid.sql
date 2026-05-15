-- ============================================================================
-- 迁移：sys_user_roles 添加 appId 字段
-- 描述：为 UserRole 表添加应用实例级隔离
-- 执行时间：2026-05-08
-- 执行结果：✅ 成功
-- ============================================================================

-- Step 1: 添加 appId 列
ALTER TABLE sys_user_roles 
  ADD COLUMN appId CHAR(36) NULL COMMENT '应用实例 ID';

-- Step 2: 通过 sys_app_members 匹配填充 appId（已更新 5 条）
UPDATE sys_user_roles ur
JOIN sys_app_members am ON am.userId = ur.userId
JOIN sys_roles r ON r.id = ur.roleId
SET ur.appId = am.appId
WHERE ur.appId IS NULL
  AND (r.appId = am.appId OR r.appTypeId = (SELECT appTypeId FROM sys_apps WHERE id = am.appId));

-- Step 3: 删除无归属的歧义记录（已删除 0 条）
DELETE FROM sys_user_roles WHERE appId IS NULL;

-- Step 4: appId 设为 NOT NULL
ALTER TABLE sys_user_roles
  MODIFY COLUMN appId CHAR(36) NOT NULL COMMENT '应用实例 ID - 角色分配所属的具体应用实例';

-- Step 5: 删除旧唯一约束 (userId, roleId)，创建新唯一约束 (userId, roleId, appId)
ALTER TABLE sys_user_roles DROP INDEX IDX_8082e9e236f485365d7e7362cb;
ALTER TABLE sys_user_roles ADD UNIQUE INDEX idx_unique_user_role_app (userId, roleId, appId);

-- Step 6: 添加 appId 单独索引
CREATE INDEX idx_user_roles_appId ON sys_user_roles(appId);
