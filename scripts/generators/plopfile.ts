import { NodePlopAPI } from 'plop';

export default function (plop: NodePlopAPI) {
  plop.setHelper('pascalCase', (text: string) => {
    return text
      .replace(/(-|^)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())
      .replace(/-/g, '');
  });

  plop.setHelper('camelCase', (text: string) => {
    const pascal = text
      .replace(/(-|^)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())
      .replace(/-/g, '');
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  });

  plop.setHelper('upperCase', (text: string) => {
    return text.replace(/-/g, '_').toUpperCase();
  });

  plop.setGenerator('backend-module', {
    description: '输出后端模块生成指令（供 AI Agent 执行）',
    prompts: [
      {
        type: 'input',
        name: 'moduleName',
        message: '模块名称（英文，kebab-case，如 order-management）',
        validate: (value: string) => {
          if (!value.trim()) return '模块名称不能为空';
          if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value.trim())) {
            return '模块名称必须为 kebab-case 格式（小写字母、数字、连字符）';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'moduleDesc',
        message: '模块中文名（如 订单管理）',
        validate: (value: string) => (value.trim() ? true : '模块中文名不能为空'),
      },
      {
        type: 'input',
        name: 'permCode',
        message: '权限编码（如 pc_root:sys:order-management）',
        default: (answers: { moduleName: string }) => `pc_root:sys:${answers.moduleName}`,
      },
      {
        type: 'checkbox',
        name: 'permValues',
        message: '权限值（多选）',
        choices: ['添加', '编辑', '删除', '导出', '导入'],
        default: ['添加', '编辑', '删除'],
      },
      {
        type: 'input',
        name: 'businessDesc',
        message: '业务描述（可选，描述该模块管理的核心实体和业务规则，帮助 AI 理解需求）',
        default: '',
      },
    ],
    actions: (data: any) => {
      const { moduleName, moduleDesc, permCode, permValues, businessDesc } = data;
      const pascalName = moduleName
        .replace(/(-|^)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())
        .replace(/-/g, '');
      const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1);
      const upperName = moduleName.replace(/-/g, '_').toUpperCase();

      return [
        {
          type: 'message',
          content: [
            '',
            '╔══════════════════════════════════════════════════════════════╗',
            '║            后端模块生成指令 — 供 AI Agent 执行              ║',
            '╚══════════════════════════════════════════════════════════════╝',
            '',
            `## 模块元数据`,
            `  - 模块名: ${moduleName}`,
            `  - 中文名: ${moduleDesc}`,
            `  - 类名: ${pascalName}`,
            `  - 权限编码: ${permCode}`,
            `  - 权限值: ${permValues?.join(', ') || '添加, 编辑, 删除'}`,
            businessDesc ? `  - 业务描述: ${businessDesc}` : '',
            '',
            `## 生成要求`,
            '',
            `请按照 {{ref:backend/new-backend-module}} 的 13 项清单生成代码，核心要求：`,
            '',
            `### 目录结构（扁平模式）`,
            `  packages/base-backend/src/modules/sys/${moduleName}/`,
            `  ├── entities/${moduleName}.entity.ts       ← 根据${businessDesc ? '业务描述' : '实际需求'}设计字段`,
            `  ├── dto/req/create-${moduleName}.dto.ts    ← 校验规则匹配 Entity 字段`,
            `  ├── dto/req/update-${moduleName}.dto.ts    ← PartialType(CreateDto)`,
            `  ├── dto/req/query-${moduleName}.dto.ts     ← 继承 PaginationQueryDto`,
            `  ├── dto/res/${moduleName}-response.dto.ts  ← 响应字段匹配实际需要`,
            `  ├── dto/index.ts                           ← 桶导出`,
            `  ├── ${moduleName}.controller.ts            ← 只生成业务需要的接口`,
            `  ├── ${moduleName}.service.ts               ← 只实现业务需要的方法`,
            `  └── ${moduleName}.module.ts`,
            '',
            `### Controller 规范`,
            `  - @ApiTags('${moduleName}', '${moduleDesc}')`,
            `  - @ApiBearerAuth('Authorization') + @UseGuards(AuthGuard)`,
            `  - CUD 方法必须加 @AuditLog + @RequirePermission`,
            `  - 只生成业务实际需要的接口（不需要的不要生成）`,
            `  - 使用 ApiResponseUtil.success() 包装响应`,
            '',
            `### Service 规范`,
            `  - 分页查询使用 PaginationX + WhereBuilder（禁止 QueryBuilder）`,
            `  - 删除使用 softDelete（禁止硬删除）`,
            `  - 创建使用事务（QueryRunner）`,
            `  - 查询单条使用 NotFoundError`,
            '',
            `### Entity 规范`,
            `  - 继承 Base，使用 UUID 主键`,
            `  - 表名: sys_${moduleName}s`,
            `  - 根据${businessDesc ? '业务描述' : '实际需求'}设计字段，不要固定 name/description/status/sortOrder`,
            '',
            `### 注册（自动完成）`,
            `  1. sys/index.ts — 添加 export * from './${moduleName}'`,
            `  2. app.module.ts — 添加 import + imports 注册`,
            `  3. app.module.ts — 将 Entity 添加到 entities 数组`,
            `  4. AuditModule 枚举 — 添加 ${upperName} 项（如需审计日志）`,
            '',
            `### 后续步骤`,
            `  1. 运行 pnpm run api:build 生成前端 API`,
            `  2. 在权限表中添加 ${permCode} 对应的权限记录`,
            '',
          ].filter(Boolean).join('\n'),
        },
      ];
    },
  });

  plop.setGenerator('frontend-page', {
    description: '输出前端页面生成指令（供 AI Agent 执行）',
    prompts: [
      {
        type: 'input',
        name: 'moduleGroup',
        message: '所属模块（如 sys）',
        default: 'sys',
      },
      {
        type: 'input',
        name: 'pageName',
        message: '页面名称（英文，kebab-case，如 order）',
        validate: (v: string) => !!v.trim() || '页面名称不能为空',
      },
      {
        type: 'input',
        name: 'pageDesc',
        message: '页面中文名（如 订单管理）',
        validate: (v: string) => !!v.trim() || '页面中文名不能为空',
      },
      {
        type: 'input',
        name: 'permCode',
        message: '权限编码',
        default: (answers: Record<string, string>) => `pc_root:sys:${answers.pageName}`,
      },
      {
        type: 'checkbox',
        name: 'permValues',
        message: '权限按钮',
        choices: ['添加', '编辑', '删除', '导出'],
      },
      {
        type: 'input',
        name: 'icon',
        message: '图标名称',
        default: 'Document',
      },
      {
        type: 'input',
        name: 'businessDesc',
        message: '业务描述（可选，描述页面管理的核心数据和交互需求）',
        default: '',
      },
    ],
    actions: (data: any) => {
      const { moduleGroup, pageName, pageDesc, permCode, permValues, icon, businessDesc } = data;
      const pascalName = pageName
        .replace(/(-|^)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())
        .replace(/-/g, '');

      return [
        {
          type: 'message',
          content: [
            '',
            '╔══════════════════════════════════════════════════════════════╗',
            '║            前端页面生成指令 — 供 AI Agent 执行              ║',
            '╚══════════════════════════════════════════════════════════════╝',
            '',
            `## 页面元数据`,
            `  - 模块: ${moduleGroup}`,
            `  - 页面名: ${pageName}`,
            `  - 中文名: ${pageDesc}`,
            `  - 类名: ${pascalName}`,
            `  - 权限编码: ${permCode}`,
            `  - 权限按钮: ${permValues?.join(', ') || '无'}`,
            `  - 图标: ${icon}`,
            businessDesc ? `  - 业务描述: ${businessDesc}` : '',
            '',
            `## 生成要求`,
            '',
            `请按照 {{ref:frontend/new-frontend-page}} 的规范生成代码，核心要求：`,
            '',
            `### 文件结构`,
            `  packages/base-frontend/src/views/${moduleGroup}/${pageName}/`,
            `  ├── Index.vue                  ← 列表页（MfwPageWrapper + MfwListPage）`,
            `  ├── ${pascalName}Form.vue      ← 表单组件（MfwFormCard + MfwPopup）`,
            `  └── index.ts                   ← definePageConfig`,
            '',
            `  如模块 index.ts 不存在，还需创建:`,
            `  packages/base-frontend/src/views/${moduleGroup}/index.ts  ← defineModuleConfig`,
            '',
            `### 列表页（Index.vue）`,
            `  - 使用 MfwPageWrapper + MfwListPage 标准模式`,
            `  - searchTemplate: 根据${businessDesc ? '业务描述' : '实际需求'}设计搜索条件`,
            `  - columns: 根据 Entity 字段设计表格列，不要固定 name/status/createdAt`,
            `  - actionColumn: 只包含${permValues?.length ? permValues.filter(v => ['编辑', '删除'].includes(v)).join('/') : '业务需要的'}操作`,
            `  - 删除操作必须有 ElMessageBox.confirm 二次确认`,
            `  - API 删除必须传 { hintSuccess: true }`,
            '',
            `### 表单组件（${pascalName}Form.vue）`,
            `  - 使用 MfwFormCard + defineExpose({ onConfirm })`,
            `  - formTemplate: 根据${businessDesc ? '业务描述' : 'Entity 字段'}设计表单项`,
            `  - 支持新增/编辑模式（isEdit = computed(() => !!props?.id)）`,
            `  - 验证失败 throw new Error('表单验证失败') 阻止弹窗关闭`,
            '',
            `### 页面配置（index.ts）`,
            `  - definePageConfig({ path, name, icon, auth: true, permissions })`,
            `  - permissions: [${permValues?.map(v => `'${v}'`).join(', ') || ''}]`,
            '',
          ].filter(Boolean).join('\n'),
        },
      ];
    },
  });

  plop.setGenerator('frontend-component', {
    description: '输出前端组件生成指令（供 AI Agent 执行）',
    prompts: [
      {
        type: 'input',
        name: 'componentName',
        message: '组件名称（英文，kebab-case，如 data-panel）',
        validate: (v: string) => (v.trim() ? true : '组件名称不能为空'),
      },
      {
        type: 'input',
        name: 'componentDesc',
        message: '组件中文描述',
      },
      {
        type: 'list',
        name: 'category',
        message: '组件分类',
        choices: [
          'business',
          'display',
          'editor',
          'feedback',
          'form',
          'page',
          'picker',
          'table',
          'upload',
        ],
      },
      {
        type: 'list',
        name: 'componentType',
        message: '组件类型',
        choices: [
          { name: 'Vue SFC', value: 'vue' },
          { name: 'TSX', value: 'tsx' },
        ],
      },
      {
        type: 'input',
        name: 'businessDesc',
        message: '业务描述（可选，描述组件的功能和交互需求）',
        default: '',
      },
    ],
    actions: (data: any) => {
      const { componentName, componentDesc, category, componentType, businessDesc } = data;
      const pascalName = componentName
        .replace(/(-|^)(\w)/g, (_: string, __: string, c: string) => c.toUpperCase())
        .replace(/-/g, '');
      const entryFile = componentType === 'vue' ? 'Index.vue' : 'index.tsx';

      return [
        {
          type: 'message',
          content: [
            '',
            '╔══════════════════════════════════════════════════════════════╗',
            '║            前端组件生成指令 — 供 AI Agent 执行              ║',
            '╚══════════════════════════════════════════════════════════════╝',
            '',
            `## 组件元数据`,
            `  - 组件名: ${componentName}`,
            `  - 中文名: ${componentDesc}`,
            `  - 注册名: Mfw${pascalName}`,
            `  - 分类: ${category}`,
            `  - 类型: ${componentType === 'vue' ? 'Vue SFC' : 'TSX'}`,
            businessDesc ? `  - 业务描述: ${businessDesc}` : '',
            '',
            `## 生成要求`,
            '',
            `请按照 {{ref:shared/coding-conventions}} 的规范生成代码，核心要求：`,
            '',
            `### 文件结构`,
            `  packages/base-frontend/src/components/${category}/${componentName}/`,
            `  ├── ${entryFile}         ← 入口文件`,
            `  ├── types.ts             ← Props/Emits/Instance 类型定义`,
            `  ├── style.scss            ← BEM + mfw- 前缀样式`,
            `  ├── mod.ts               ← 模块导出`,
            `  └── index.ts             ← re-export from mod`,
            '',
            `### 组件规范`,
            `  - ${componentType === 'vue' ? 'Vue SFC: defineOptions({ name: "Mfw' + pascalName + '" }) + <script setup>' : 'TSX: defineComponent({ name: "Mfw' + pascalName + '" })'}`,
            `  - CSS 类名: .mfw-${componentName}（BEM: .mfw-${componentName}__element--modifier）`,
            `  - 类型定义: ${pascalName}Props + ${pascalName}Emits + ${pascalName}Instance`,
            `  - mod.ts: export { default as Mfw${pascalName} } from '${componentType === 'vue' ? './Index.vue' : './index'}' + export type * from './types'`,
            '',
            `### 注册（手动）`,
            `  1. components/${category}/index.ts — 添加导出`,
            `  2. components/index.ts — 如需全局导出`,
            '',
          ].filter(Boolean).join('\n'),
        },
      ];
    },
  });
}
