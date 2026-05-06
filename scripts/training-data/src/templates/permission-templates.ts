import type { KnowledgePoint, QAPair } from '../types.js';

export interface PermissionKnowledgePoint extends KnowledgePoint {
  permissionCategory: 'value-system' | 'decorator' | 'guard' | 'frontend' | 'multi-tenant' | 'debugging';
}

export function generatePermissionQAs(kps: PermissionKnowledgePoint[]): QAPair[] {
  const pairs: QAPair[] = [];
  for (const kp of kps) {
    switch (kp.permissionCategory) {
      case 'value-system':
        pairs.push(...generatePermissionValueQAs(kp));
        break;
      case 'decorator':
        pairs.push(...generateDecoratorQAs(kp));
        break;
      case 'guard':
        pairs.push(...generateGuardQAs(kp));
        break;
      case 'frontend':
        pairs.push(...generateFrontendPermQAs(kp));
        break;
      case 'multi-tenant':
        pairs.push(...generateMultiTenantQAs(kp));
        break;
      case 'debugging':
        pairs.push(...generateDebuggingQAs(kp));
        break;
    }
  }
  return pairs;
}

function generatePermissionValueQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中${kp.title}的权限值是多少？如何计算？` },
        { role: 'assistant', content: `${kp.title}的权限值采用位运算（BigInt）表示：\n\n${kp.content}\n\n权限值计算原理：每个权限值 = 1n << index（左移位），使用 BigInt 位与运算（&）检查权限，位或运算（|）合并权限。` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `如何在 moyan-mfw 中使用${kp.title}？` },
        { role: 'assistant', content: `使用${kp.title}的方式：\n\n${kp.content}\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet || '// 参见源码'}\n\`\`\`` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 权限系统中${kp.title}有什么注意事项？` },
        { role: 'assistant', content: `注意事项：\n1. 权限值使用 BigInt 类型，不是普通数字\n2. 位运算检查：(userValue & requiredValue) !== 0n\n3. isDeveloper=1 时后端跳过权限检查\n4. 前端需通过 usePermission 或 v-permission 检查\n5. 业务权限需通过 registerPermissionValues() 注册` },
      ],
    },
  ];
}

function generateDecoratorQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中${kp.title}怎么用？` },
        { role: 'assistant', content: `${kp.title}的使用方法：\n\n${kp.content}\n\n代码示例：\n\`\`\`typescript\n${kp.codeSnippet || '// 参见源码'}\n\`\`\`\n\n支持两种调用形式：\n1. 对象形式：@RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })\n2. 简写形式：@RequirePermission('pc_root:sys:user', ['添加'])` },
      ],
    },
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 中 @RequirePermission 和 @Public 有什么区别？` },
        { role: 'assistant', content: `区别如下：\n- @RequirePermission：要求用户拥有指定权限才能访问，支持 permCode + permissionValue 细粒度控制\n- @Public：标记接口无需认证即可访问，跳过 AuthGuard\n- @SkipPermission：跳过权限检查但需认证\n\n使用场景：\n- @RequirePermission：所有需要权限控制的接口\n- @Public：登录、注册、系统初始化等公开接口\n- @SkipPermission：需认证但不需要权限检查的内部方法` },
      ],
    },
  ];
}

function generateGuardQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 的${kp.title}执行流程是什么？` },
        { role: 'assistant', content: `${kp.title}的执行流程：\n\n${kp.content}` },
      ],
    },
  ];
}

function generateFrontendPermQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 前端如何进行权限控制？` },
        { role: 'assistant', content: `前端权限控制方式：\n\n${kp.content}\n\n三种方式：\n1. v-permission 指令：<el-button v-permission="'添加'">新增</el-button>\n2. usePermission Hook：const { hasPermission } = usePermission()\n3. renderActionButtons：自动根据权限隐藏按钮` },
      ],
    },
  ];
}

function generateMultiTenantQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 多租户权限的${kp.title}怎么理解？` },
        { role: 'assistant', content: `${kp.content}\n\n三层模型：AppType → App → AppMember，权限池限定应用类型可用权限范围，角色可绑定全局/应用类型级/应用实例级作用域。` },
      ],
    },
  ];
}

function generateDebuggingQAs(kp: PermissionKnowledgePoint): QAPair[] {
  return [
    {
      conversations: [
        { role: 'user', content: `moyan-mfw 权限排查：${kp.title}` },
        { role: 'assistant', content: `${kp.content}\n\n排查路径：Token有效性 → 角色权限 → 权限池配置 → permissionValue位运算 → 前端权限指令` },
      ],
    },
  ];
}
