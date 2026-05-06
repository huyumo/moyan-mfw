import { join } from 'path';
import type { ExtractionResult } from '../types.js';
import { generateQAPairs } from '../utils/qa-generator.js';
import { DEFAULT_CONFIG } from '../types.js';
import type { PermissionKnowledgePoint } from '../templates/permission-templates.js';
import { generatePermissionQAs } from '../templates/permission-templates.js';

export function extractPermissionDimension(projectRoot: string): ExtractionResult {
  const knowledgePoints: PermissionKnowledgePoint[] = [];

  knowledgePoints.push(...extractPermissionValues(projectRoot));
  knowledgePoints.push(...extractDecorators(projectRoot));
  knowledgePoints.push(...extractGuards(projectRoot));
  knowledgePoints.push(...extractFrontendPermissions(projectRoot));
  knowledgePoints.push(...extractMultiTenant(projectRoot));
  knowledgePoints.push(...extractDebugging(projectRoot));

  const templateQAs = generatePermissionQAs(knowledgePoints);
  const genericResult = generateQAPairs(
    knowledgePoints.map((kp) => ({ ...kp, dimension: 'dim02-permission' })),
    'dim02-permission',
    DEFAULT_CONFIG.angleWeights
  );

  const allQAs = [...templateQAs, ...genericResult.qaPairs];

  return {
    dimension: 'dim02-permission',
    knowledgePoints,
    qaPairs: allQAs,
    stats: {
      totalKnowledgePoints: knowledgePoints.length,
      totalQAPairs: allQAs.length,
      byAngle: genericResult.stats.byAngle,
      bySubcategory: genericResult.stats.bySubcategory,
    },
  };
}

function extractPermissionValues(root: string): PermissionKnowledgePoint[] {
  const kps: PermissionKnowledgePoint[] = [];
  const permFile = join(root, 'packages/base-backend/src/common/constants/permissions.ts');

  const defaultPerms = [
    { name: '添加', value: '1n (1n << 0)', desc: '创建资源权限' },
    { name: '编辑', value: '2n (1n << 1)', desc: '修改资源权限' },
    { name: '删除', value: '4n (1n << 2)', desc: '删除资源权限' },
    { name: '导出', value: '8n (1n << 3)', desc: '导出数据权限' },
    { name: '导入', value: '16n (1n << 4)', desc: '导入数据权限' },
  ];

  for (const perm of defaultPerms) {
    kps.push({
      id: `perm-value-default-${perm.name}`,
      dimension: 'dim02-permission',
      subcategory: '默认权限值',
      title: `默认权限值「${perm.name}」`,
      content: `${perm.name}的位运算值为 ${perm.value}，${perm.desc}。在 @RequirePermission 中使用：permissionValue: ['${perm.name}']`,
      codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:xxx', permissionValue: ['${perm.name}'] })`,
      source: permFile,
      sourcePath: permFile,
      tags: ['权限值', perm.name, '默认'],
      permissionCategory: 'value-system',
    });
  }

  const extPerms = [
    { name: '审批', value: '32n (1n << 5)', desc: '审批流程权限' },
    { name: '拒绝', value: '64n (1n << 6)', desc: '拒绝操作权限' },
    { name: '发布', value: '128n (1n << 7)', desc: '发布操作权限' },
    { name: '归档', value: '256n (1n << 8)', desc: '归档操作权限' },
  ];

  for (const perm of extPerms) {
    kps.push({
      id: `perm-value-ext-${perm.name}`,
      dimension: 'dim02-permission',
      subcategory: '扩展权限值',
      title: `扩展权限值「${perm.name}」`,
      content: `${perm.name}的位运算值为 ${perm.value}，${perm.desc}。属于扩展权限，非默认提供，需在业务权限中按需使用。`,
      codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:xxx', permissionValue: ['${perm.name}'] })`,
      source: permFile,
      sourcePath: permFile,
      tags: ['权限值', perm.name, '扩展'],
      permissionCategory: 'value-system',
    });
  }

  kps.push({
    id: 'perm-buildPerValue', dimension: 'dim02-permission', subcategory: '权限值工具函数',
    title: 'buildPerValue 函数',
    content: 'buildPerValue(names) 将权限名称数组转换为合并的 BigInt 值。例如 buildPerValue(["添加","编辑"]) 返回 3n (1n | 2n)。',
    codeSnippet: `const permValue = buildPerValue(['添加', '编辑']); // 3n`,
    source: permFile, sourcePath: permFile, tags: ['工具函数', 'buildPerValue'], permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-parsePerValue', dimension: 'dim02-permission', subcategory: '权限值工具函数',
    title: 'parsePerValue 函数',
    content: 'parsePerValue(value) 将 BigInt 权限值解析为权限名称数组。例如 parsePerValue(3n) 返回 ["添加","编辑"]。',
    codeSnippet: `const names = parsePerValue(3n); // ['添加', '编辑']`,
    source: permFile, sourcePath: permFile, tags: ['工具函数', 'parsePerValue'], permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-hasPermission', dimension: 'dim02-permission', subcategory: '权限值工具函数',
    title: 'hasPermission 函数',
    content: 'hasPermission(userValue, requiredValue) 通过位与运算检查用户是否拥有指定权限。(userValue & requiredValue) !== 0n 为 true 则拥有权限。',
    codeSnippet: `if (hasPermission(userPermValue, buildPerValue(['删除']))) {\n  // 用户有删除权限\n}`,
    source: permFile, sourcePath: permFile, tags: ['工具函数', 'hasPermission'], permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-registerPermissionValues', dimension: 'dim02-permission', subcategory: '业务权限扩展',
    title: 'registerPermissionValues 函数',
    content: 'registerPermissionValues(values) 注册自定义业务权限值。例如供应商模块的上架(512n)、发货(1024n)、退款(2048n)。',
    codeSnippet: `registerPermissionValues([\n  { name: '上架', value: 512n },\n  { name: '发货', value: 1024n },\n  { name: '退款', value: 2048n },\n]);`,
    source: permFile, sourcePath: permFile, tags: ['业务权限', 'registerPermissionValues'], permissionCategory: 'value-system',
  });

  kps.push({
    id: 'perm-createBusinessDecorator', dimension: 'dim02-permission', subcategory: '业务权限扩展',
    title: 'createBusinessPermissionDecorator 工厂',
    content: 'createBusinessPermissionDecorator<T>() 创建类型安全的业务权限装饰器工厂。返回的函数可生成绑定了业务权限值的装饰器，实现类型安全的 permissionValue 检查。',
    codeSnippet: `const RequireSupplierPermission = createBusinessPermissionDecorator<SupplierPermissionValue>();\n\n@RequireSupplierPermission({ permCode: 'pc_root:supplier', permissionValue: ['上架'] })`,
    source: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
    sourcePath: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
    tags: ['装饰器', 'createBusinessPermissionDecorator', '业务权限'], permissionCategory: 'decorator',
  });

  return kps;
}

function extractDecorators(root: string): PermissionKnowledgePoint[] {
  return [
    {
      id: 'perm-RequirePermission', dimension: 'dim02-permission', subcategory: '权限装饰器',
      title: '@RequirePermission 装饰器',
      content: '@RequirePermission 用于在 Controller 方法上声明所需权限。支持 permCode（权限编码）和 permissionValue（权限值数组）。多个 @RequirePermission 装饰器在同一方法上使用 OR 逻辑。',
      codeSnippet: `@RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })\nasync create(@Body() dto: CreateUserDto) { ... }`,
      source: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
      sourcePath: join(root, 'packages/base-backend/src/common/decorators/require-permission.decorator.ts'),
      tags: ['装饰器', 'RequirePermission'], permissionCategory: 'decorator',
    },
    {
      id: 'perm-Public', dimension: 'dim02-permission', subcategory: '权限装饰器',
      title: '@Public 装饰器',
      content: '@Public() 标记接口无需认证即可访问。AuthGuard 检测到 @Public() 后直接放行，不解析 JWT。适用于登录、注册、系统初始化等公开接口。',
      codeSnippet: `@Public()\n@Post('login')\nasync login(@Body() dto: LoginDto) { ... }`,
      source: join(root, 'packages/base-backend/src/common/decorators/public.decorator.ts'),
      sourcePath: join(root, 'packages/base-backend/src/common/decorators/public.decorator.ts'),
      tags: ['装饰器', 'Public'], permissionCategory: 'decorator',
    },
    {
      id: 'perm-SkipPermission', dimension: 'dim02-permission', subcategory: '权限装饰器',
      title: '@SkipPermission 装饰器',
      content: '@SkipPermission() 跳过权限检查但要求认证（需有效 JWT）。与 @Public() 不同：@Public() 跳过认证，@SkipPermission() 跳过权限但不跳过认证。',
      codeSnippet: `@SkipPermission()\n@Get('internal-status')\nasync getInternalStatus(@User() user: UserDto) { ... }`,
      source: join(root, 'packages/base-backend/src/common/decorators/skip-permission.decorator.ts'),
      sourcePath: join(root, 'packages/base-backend/src/common/decorators/skip-permission.decorator.ts'),
      tags: ['装饰器', 'SkipPermission'], permissionCategory: 'decorator',
    },
  ];
}

function extractGuards(root: string): PermissionKnowledgePoint[] {
  return [
    {
      id: 'perm-AuthGuard', dimension: 'dim02-permission', subcategory: '认证守卫',
      title: 'AuthGuard 认证守卫',
      content: 'AuthGuard 从请求头提取 Bearer Token，验证 JWT 签名和过期时间，将解码后的用户信息（id, username, roleIds）注入 request.user。标记 @Public() 的接口跳过认证。',
      codeSnippet: `@UseGuards(AuthGuard)\n@Controller('users')\nexport class UserController { ... }`,
      source: join(root, 'packages/base-backend/src/common/guards/auth.guard.ts'),
      sourcePath: join(root, 'packages/base-backend/src/common/guards/auth.guard.ts'),
      tags: ['守卫', 'AuthGuard', 'JWT'], permissionCategory: 'guard',
    },
    {
      id: 'perm-PermissionGuard', dimension: 'dim02-permission', subcategory: '权限守卫',
      title: 'PermissionGuard 权限守卫',
      content: 'PermissionGuard 执行流程：\n1. 检查 @SkipPermission → 跳过\n2. 获取所有 @RequirePermission 元数据（OR 逻辑）\n3. 检查 isDeveloper=1 → 直接放行\n4. 查询 RolePermission（whereIn roleIds）\n5. 构建 userPermissionMap（permCode → BigInt OR 合并）\n6. 逐个检查：(userValue & requiredValue) !== 0n\n7. 任一装饰器满足即通过',
      codeSnippet: `@UseGuards(AuthGuard, PermissionGuard)\n@Controller('xxx')\nexport class XxxController { ... }`,
      source: join(root, 'packages/base-backend/src/common/guards/permission.guard.ts'),
      sourcePath: join(root, 'packages/base-backend/src/common/guards/permission.guard.ts'),
      tags: ['守卫', 'PermissionGuard', '位运算'], permissionCategory: 'guard',
    },
  ];
}

function extractFrontendPermissions(root: string): PermissionKnowledgePoint[] {
  return [
    {
      id: 'perm-usePermission', dimension: 'dim02-permission', subcategory: '前端权限控制',
      title: 'usePermission Hook',
      content: 'usePermission() 是前端权限检查核心 Hook，提供 4 个方法：\n1. hasPermissionValue(options) — 检查当前用户是否拥有指定权限\n2. hasAnyPermissionValue(values) — OR 逻辑\n3. hasAllPermissionValues(values) — AND 逻辑\n4. getCurrentPermCode() — 获取当前权限编码',
      codeSnippet: `const { hasPermissionValue, hasAnyPermissionValue } = usePermission();\n\nif (hasPermissionValue({ value: ['编辑'] })) {\n  // 显示编辑按钮\n}`,
      source: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'),
      sourcePath: join(root, 'packages/base-frontend/src/hooks/usePermission.ts'),
      tags: ['前端', 'usePermission', 'Hook'], permissionCategory: 'frontend',
    },
    {
      id: 'perm-v-permission', dimension: 'dim02-permission', subcategory: '前端权限控制',
      title: 'v-permission 指令',
      content: 'v-permission 是前端权限指令，根据用户权限自动隐藏/显示元素。支持字符串和对象两种形式。',
      codeSnippet: `<el-button v-permission="'添加'">新增</el-button>\n<el-button v-permission="{ value: ['编辑'] }">编辑</el-button>`,
      source: join(root, 'packages/base-frontend/src/directives/permission.ts'),
      sourcePath: join(root, 'packages/base-frontend/src/directives/permission.ts'),
      tags: ['前端', 'v-permission', '指令'], permissionCategory: 'frontend',
    },
    {
      id: 'perm-defineBusinessPageConfig', dimension: 'dim02-permission', subcategory: '前端权限控制',
      title: 'defineBusinessPageConfig',
      content: 'defineBusinessPageConfig 用于配置业务页面的权限值。通过 createBusinessPageConfigFn 创建配置函数，将业务权限值映射到页面配置。',
      codeSnippet: `const defineSupplierPageConfig = createBusinessPageConfigFn<SupplierPermissionValue>();\n\nexport default defineSupplierPageConfig({\n  permissions: ['上架', '发货', '退款'],\n});`,
      source: join(root, 'packages/base-frontend/src/utils/permissions.ts'),
      sourcePath: join(root, 'packages/base-frontend/src/utils/permissions.ts'),
      tags: ['前端', 'defineBusinessPageConfig', '业务权限'], permissionCategory: 'frontend',
    },
  ];
}

function extractMultiTenant(root: string): PermissionKnowledgePoint[] {
  return [
    {
      id: 'perm-three-layer-model', dimension: 'dim02-permission', subcategory: '多租户权限',
      title: '三层租户模型',
      content: 'moyan-mfw 多租户采用三层模型：\n1. AppType（应用类型）— 定义商家/租户类型，配置权限池\n2. App（应用实例）— 具体的商家/租户实例，绑定 ownerId\n3. AppMember（应用成员）— 应用内的用户，分配角色\n\n权限池限定应用类型可用权限范围，角色权限不能超出权限池。',
      codeSnippet: `POST /api/app-types\n{ "typeName": "电商商家", "typeCode": "ecommerce", "multiAppEnabled": 1 }`,
      source: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
      sourcePath: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
      tags: ['多租户', 'AppType', 'App', 'AppMember'], permissionCategory: 'multi-tenant',
    },
    {
      id: 'perm-role-scope', dimension: 'dim02-permission', subcategory: '多租户权限',
      title: '角色作用域规则',
      content: '角色作用域由 appId 和 appTypeId 决定：\n- 无 appId、无 appTypeId → 全局角色（所有应用可见）\n- 有 appTypeId → 应用类型级（该类型下所有应用可见）\n- 有 appId → 应用实例级（仅该应用可见）\n\n权限池约束：角色权限分配只能从其所属应用类型的权限池中选择。',
      source: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
      sourcePath: join(root, '.trae/skills/mfw-guide/auth/multi-tenant.md'),
      tags: ['多租户', '角色', '作用域'], permissionCategory: 'multi-tenant',
    },
  ];
}

function extractDebugging(root: string): PermissionKnowledgePoint[] {
  const debugScenarios = [
    { title: '接口返回 401', content: 'Token 过期或缺失。排查：检查 localStorage 中 mfw:admin:token 是否存在，检查 Token 刷新机制（10分钟内过期自动刷新）。' },
    { title: '接口返回 403', content: '权限不足。排查：检查用户角色权限、权限池配置、permissionValue 位运算值是否匹配。' },
    { title: '菜单不显示', content: '权限菜单树问题。排查：检查 loadPermissions(appId) 是否正确获取，layoutStore 是否同步菜单数据。' },
    { title: '按钮不显示', content: 'v-permission 问题。排查：检查 usePermission 获取的权限值、permissionValue 参数。' },
    { title: '开发者全部放行', content: 'isDeveloper=1 时 PermissionGuard 跳过检查。此标志仅用于开发环境调试，不可在生产环境使用。' },
  ];

  return debugScenarios.map(s => ({
    id: `perm-debug-${s.title}`, dimension: 'dim02-permission', subcategory: '权限排查',
    title: s.title, content: s.content,
    source: join(root, '.trae/skills/mfw-guide/auth/permission-debugging.md'),
    sourcePath: join(root, '.trae/skills/mfw-guide/auth/permission-debugging.md'),
    tags: ['排查', s.title], permissionCategory: 'debugging' as const,
  }));
}
