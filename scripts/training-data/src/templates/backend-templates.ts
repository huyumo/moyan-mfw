import type { QAPair, KnowledgePoint } from '../types.js';

export function generateControllerQAs(moduleName: string, endpoints: string[], sourcePath: string): QAPair[] {
  const pairs: QAPair[] = [];

  pairs.push({
    conversations: [
      { role: 'user', content: `moyan-mfw 中 ${moduleName} Controller 有哪些端点？` },
      { role: 'assistant', content: `${moduleName} Controller 的端点列表：\n\n${endpoints.map(e => `- ${e}`).join('\n')}\n\n所有端点遵循以下规范：\n- 使用 @UseGuards(AuthGuard) 保护\n- 写操作（CUD）必须有 @AuditLog + @RequirePermission\n- 响应统一使用 ApiResponseUtil.success()\n- ID 参数使用 @Param('id', ParseUUIDPipe)` },
    ],
  });

  return pairs;
}

export function generateServiceQAs(moduleName: string, methods: string[], sourcePath: string): QAPair[] {
  const pairs: QAPair[] = [];

  pairs.push({
    conversations: [
      { role: 'user', content: `moyan-mfw 中 ${moduleName} Service 有哪些方法？` },
      { role: 'assistant', content: `${moduleName} Service 的方法列表：\n\n${methods.map(m => `- ${m}`).join('\n')}\n\nService 规范：\n- 多表操作必须使用事务（createQueryRunner）\n- 删除统一使用 softDelete\n- 资源不存在使用 NotFoundError\n- 分页查询使用 PaginationX + WhereBuilder` },
    ],
  });

  return pairs;
}

export function generatePaginationQAs(): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: 'moyan-mfw 中如何进行分页查询？' },
        { role: 'assistant', content: 'moyan-mfw 禁止使用 TypeORM QueryBuilder 分页查询，必须使用 PaginationX + WhereBuilder：\n\n```typescript\nasync findAll(query: QueryXxxDto): Promise<PaginationResult<XxxResponseDto>> {\n  const whereBuilder = new WhereBuilder();\n  whereBuilder.like(\'xxx.name\', name).eq(\'xxx.status\', status);\n\n  const pager = new PaginationX(this.dataSource, query);\n  return await pager\n    .where(\'main\', whereBuilder)\n    .sql(({ select, wheres, orderBy, limit }) => {\n      const whereClause = wheres?.main || \'\';\n      return `SELECT ${select} FROM sys_xxx xxx ${whereClause} ${orderBy} ${limit}`;\n    })\n    .select(\'xxx.*\')\n    .defaultOrderBy(\'xxx.createdAt DESC\')\n    .getData();\n}\n```\n\n反模式：禁止使用 createQueryBuilder 做分页查询。' },
      ],
    },
    {
      conversations: [
        { role: 'user', content: 'moyan-mfw 中 WhereBuilder 有哪些方法？' },
        { role: 'assistant', content: 'WhereBuilder 常用方法：\n\n| 方法 | 操作符 | 说明 |\n|------|--------|------|\n| eq(field, val) | = | 等于（undefined 自动跳过） |\n| neq(field, val) | != | 不等于 |\n| like(field, val) | LIKE %val% | 模糊查询 |\n| in(field, vals) | IN | IN 条件 |\n| between(field, min, max) | BETWEEN | 范围查询 |\n| isNull(field) | IS NULL | 空值判断 |\n| custom(condition, params) | 自定义 | 自定义条件字符串 |\n| group(builder, op?) | () | 条件分组（支持 OR） |\n\n所有方法自动参数化防 SQL 注入。' },
      ],
    },
  ];
}

export function generateModuleStandardQAs(): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: 'moyan-mfw 中如何新增后端模块？' },
        { role: 'assistant', content: '新增后端模块的目录结构：\n\n```\nmodules/sys/xxx/\n├── dto/\n│   ├── req/\n│   │   ├── create-xxx.dto.ts\n│   │   ├── update-xxx.dto.ts\n│   │   └── query-xxx.dto.ts      # 继承 PaginationQueryDto\n│   ├── res/\n│   │   └── xxx-response.dto.ts\n│   └── index.ts\n├── entities/\n│   └── xxx.entity.ts\n├── xxx.controller.ts\n├── xxx.service.ts\n└── xxx.module.ts\n```\n\n必须遵守的规范：\n1. 每个方法必须有 @ApiOperation\n2. 写操作必须有 @AuditLog + @RequirePermission\n3. 响应使用 ApiResponseUtil.success()\n4. ID 参数使用 ParseUUIDPipe\n5. 分页查询使用 PaginationX + WhereBuilder\n6. 多表操作使用事务\n7. 删除使用 softDelete\n\n完成后运行 pnpm run api:build 重新生成前端 API。' },
      ],
    },
  ];
}
