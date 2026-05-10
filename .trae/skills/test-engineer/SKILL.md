---
version: "1.0"
last_updated: "2026-05-10"
scope: shared
triggers:
  - "写测试"
  - "单元测试"
  - "集成测试"
  - "e2e测试"
  - "测试用例"
  - "test"
  - "spec"
  - "单测"
  - "接口测试"
  - "自动化测试"
  - "测试覆盖率"
  - "测试骨架"
dependencies:
  - infra/testing-guide
  - shared/coding-conventions
  - shared/project-structure
  - backend/new-backend-module
maturity: stable
tags: [测试, 单元测试, 集成测试, e2e, vitest, Jest, Playwright, 自动化, 预防Bug]
---

# 测试工程师 Agent — 预防 Bug 而不只是找 Bug

## 核心哲学

> 好的测试不是等 Bug 出现后才发现它，而是在 Bug 出现前就让它无法存在。

本 Agent 的三层工作方式：

| 层级 | 做什么 | 时机 |
|------|--------|------|
| **L1 — 静态防御** | 阅读代码时同步识别反模式、边界缺失、类型安全隐患 | 任何代码阅读任务中自动执行 |
| **L2 — 骨架生成** | 根据模块/组件/接口自动生成完整测试骨架 | 用户请求"写测试"时执行 |
| **L3 — 自动化验证** | 运行测试、分析失败原因、补全遗漏用例 | 测试骨架生成后自动执行 |

---

## 关键红线（违反 = 测试不可交付）

1. **测试文件不允许 TypeScript 类型错误**。`*.spec.ts` 文件也必须通过 `tsc --noEmit`。
2. **测试任务不允许修改业务代码**。只能测试，不能"为了让测试通过而改源码"。
3. **测试用例基于业务需求，不基于实现细节**。用例描述应反映"用户/调用方期望什么行为"，不反映"代码内部怎么做的"。
4. **`apis/` 目录禁止手动修改**。前端 API 调用层由 `moyan-api` 自动生成。
5. **测试之间禁止执行顺序依赖**。每个 `it()` 必须可独立运行。

---

## L1 — 静态防御：代码审查时的自动 Bug 预防

当你阅读或审查任何业务代码时，**同步输出**以下分析，不等用户要求：

### 后端代码审查检查点

阅读 Controller / Service / Entity / DTO 时，检查以下反模式：

| # | 检查项 | 反模式 | 正确做法 |
|---|--------|--------|----------|
| 1 | 事务处理 | `createQueryRunner() + try/catch` | `dataSource.transaction(callback)` |
| 2 | 分页查询 | `repository.find()` 直接分页 | `PaginationX + WhereBuilder` |
| 3 | 用户获取 | `@Request() req` → `req.user` | `@User() user: UserDto` |
| 4 | 主键类型 | `@PrimaryGeneratedColumn()` 自增 | `@PrimaryColumn('uuid')` UUID |
| 5 | 删除方式 | `repository.remove()` / `repository.delete()` | `softDelete()` |
| 6 | 响应格式 | 直接 `return data` | `ApiResponseUtil.success(data, msg)` |
| 7 | 审计日志 | 写操作缺 `@AuditLog` | CUD 必加 |
| 8 | 权限控制 | 写操作缺 `@RequirePermission` | CUD 必加 |
| 9 | 异常类型 | `throw new Error('xxx')` | 使用框架异常类（NotFoundError / ConflictException 等） |
| 10 | 密码处理 | 明文存储 | `hashPassword` / `verifyPassword` |
| 11 | DI 注册 | Service 注入新 Repository 但 Module 未注册 | Module 的 `TypeOrmModule.forFeature([...])` 同步注册 |
| 12 | 输入验证 | DTO 缺少 `class-validator` 装饰器 | 必填加 `@IsNotEmpty`，字符串加 `@Length` |

**输出格式**：每发现一个问题，输出：
```
⚠️ [L1-{编号}] {文件名}:{行号} — {反模式描述}
   建议：{正确做法}
```

### 前端代码审查检查点

阅读 Vue 组件 / composable / store 时，检查以下反模式：

| # | 检查项 | 反模式 | 正确做法 |
|---|--------|--------|----------|
| 1 | 表单弹窗 | `emit('confirm')` 传递数据 | `defineExpose({ onConfirm })` |
| 2 | 组件位置 | 弹窗/面板放 `views/` | 放 `components/` |
| 3 | 状态常量 | `const STATUS = {...}` 内联 | 使用 `moyan-shared-dict` |
| 4 | 删除确认 | 直接调 API 无二次确认 | `ElMessageBox.confirm` + `catch` 后 `return` |
| 5 | API 删除 | 缺 `{ hintSuccess: true }` | 必须传该参数 |
| 6 | 文字颜色 | `color: inherit` | `var(--el-text-color-*)` |
| 7 | 组件注册名 | 缺少 `Mfw` 前缀 | `MfwXxx` |
| 8 | CSS 类名 | 缺少 `mfw-` 前缀 | BEM + `mfw-` 前缀 |
| 9 | 布尔变量 | 不用 is/has/can 前缀 | `isVisible` / `hasPermission` |
| 10 | 事件处理 | 不用 handle 前缀 | `handleAdd` / `handleDelete` |

### 边界条件自动枚举

阅读任何函数/方法时，自动输出应注意的边界条件：

```
📋 边界条件分析 — {函数名}()
  输入边界：空值 / 最小值 / 最大值 / 类型错误 / 超长字符串
  状态边界：不存在 / 已存在 / 已删除 / 已禁用 / 已过期
  权限边界：未认证 / 无权限 / 权限不足 / Token 过期
  并发边界：重复提交 / 同时操作同一资源
```

---

## L2 — 骨架生成：自动生成单测与接口测试

### 触发方式

用户说"写测试"、"生成测试"、"加单测"时自动进入本流程。

### 工作流程

```
1. 识别目标 → 2. 读取源码 → 3. 分析接口/组件 → 4. 枚举测试场景 → 5. 生成骨架 → 6. 运行验证
```

#### Step 1：识别测试目标类型

| 目标类型 | 判断依据 | 测试框架 | 文件位置 |
|----------|----------|----------|----------|
| 后端 API 模块 | `*.controller.ts` | Jest + supertest | `packages/base-backend/tests/integration/xxx-api.spec.ts` |
| 后端 Service | `*.service.ts`（复杂业务逻辑） | Jest | `packages/base-backend/tests/integration/xxx-api.spec.ts`（通过 API 间接测试） |
| 前端组件 | `packages/base-frontend/src/components/**/Index.vue` | Vitest + @vue/test-utils | `packages/base-frontend/src/components/**/__tests__/xxx-spec.ts` |
| 前端页面 | `views/**/Index.vue` | Vitest（可测试逻辑部分） | 同目录 `__tests__/` |
| E2E 流程 | 跨页面用户操作流程 | Playwright | `e2e/tests/xxx.spec.ts` |

#### Step 2：读取源码并分析

读取目标文件的完整代码，提取：
- 后端：路由路径、HTTP 方法、请求体/查询参数结构、权限要求、可能的响应状态码
- 前端：props 定义、emits 事件、slot 插槽、composable 依赖、store 依赖
- E2E：页面关键元素（`data-testid`）、交互流程、API 调用序列

#### Step 3：枚举测试场景

**后端 API 测试场景模板**（每个端点必须覆盖）：

```
POST /api/xxx（创建）
  ✅ 正常创建 — 返回 201 + 完整数据
  ✅ 必填字段缺失 — 返回 400
  ✅ 唯一性冲突 — 返回 409（如适用）
  ✅ 未认证 — 返回 401
  ✅ 无权限 — 返回 403

GET /api/xxx（列表查询）
  ✅ 正常分页查询 — 返回 list + total
  ✅ 带筛选条件查询 — 验证过滤生效
  ✅ 空结果查询 — 返回空 list

GET /api/xxx/:id（详情查询）
  ✅ 正常查询 — 返回完整数据
  ✅ 不存在的 ID — 返回 404

PUT /api/xxx/:id（更新）
  ✅ 正常更新 — 返回更新后数据
  ✅ 更新不存在的 ID — 返回 404
  ✅ 更新导致唯一冲突 — 返回 409

DELETE /api/xxx/:id（删除）
  ✅ 正常删除 — 返回 200
  ✅ 删除不存在的 ID — 返回 404
  ✅ 删除后查询不到 — 验证软删除生效
```

**前端组件测试场景模板**：

```
基础渲染
  ✅ 应正确渲染组件
  ✅ 应显示传入的 props 值
  ✅ 无 props 时应使用默认值

交互行为
  ✅ 点击按钮应触发 emit 事件
  ✅ 表单输入应更新绑定值
  ✅ 条件渲染应在满足条件时显示

边界情况
  ✅ 空值/null/undefined 应优雅降级
  ✅ 空数组/空对象应不报错
  ✅ 超长文本应正确截断或换行

插槽
  ✅ 默认插槽内容应正确渲染
  ✅ 具名插槽应在正确位置渲染
```

**E2E 测试场景模板**：

```
页面加载
  ✅ 页面应正常加载并显示关键元素
  ✅ 数据应正确渲染到表格/列表中

CRUD 流程
  ✅ 创建 → 列表可见 → 编辑 → 删除 → 列表不可见

错误处理
  ✅ 必填字段为空时应有错误提示
  ✅ 网络错误时应显示友好提示

权限控制
  ✅ 无权限用户应看不到操作按钮
  ✅ 无权限用户直接访问 URL 应跳转 403
```

---

## L3 — 后端集成测试骨架模板

```typescript
/**
 * @fileoverview {模块名} 集成测试
 * @description 测试 /api/{路由} 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - {模块}-01: 创建（N 个子场景）
 * - {模块}-02: 查询列表（N 个子场景）
 * - {模块}-03: 查询详情（N 个子场景）
 * - {模块}-04: 更新（N 个子场景）
 * - {模块}-05: 删除（N 个子场景）
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  login,
  generateUniqueIdentifier,
} from '../setup';

describe('{模块中文名}模块集成测试 ({ModuleName} API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  // =====================================================================
  // {模块}-01: 创建
  // =====================================================================
  describe('{模块}-01: 创建{资源名}', () => {
    it('{模块}-01-01: 应创建{资源名}成功', async () => {
      const uniqueId = generateUniqueIdentifier('newxxx');
      const response = await request(app.getHttpServer())
        .post('/api/{路由}')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // 根据 DTO 填写必填字段
          name: `新{资源名}-${uniqueId}`,
          code: uniqueId,
        })
        .expect(201);

      expect(response.body.code).toBe(0);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toContain('新{资源名}');

      createdId = response.body.data.id;
    });

    it('{模块}-01-02: 必填字段缺失应返回 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/{路由}')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.code).toBe(10001);
    });

    it('{模块}-01-03: 编码重复应返回 409', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/{路由}')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '重复{资源名}',
          code: 'admin', // 使用已存在的编码
        })
        .expect(409);

      expect(response.body.code).toBe(10002);
    });

    it('{模块}-01-04: 未认证应返回 401', async () => {
      await request(app.getHttpServer())
        .post('/api/{路由}')
        .send({ name: '测试', code: 'test' })
        .expect(401);
    });
  });

  // =====================================================================
  // {模块}-02: 查询列表
  // =====================================================================
  describe('{模块}-02: 查询{资源名}列表', () => {
    it('{模块}-02-01: 应返回分页列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/{路由}?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data.list).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });

    it('{模块}-02-02: 应按名称模糊查询', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/{路由}?name=admin&page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data.list.length).toBeGreaterThan(0);
    });

    it('{模块}-02-03: 未认证应返回 401', async () => {
      await request(app.getHttpServer())
        .get('/api/{路由}')
        .expect(401);
    });
  });

  // =====================================================================
  // {模块}-03: 查询详情
  // =====================================================================
  describe('{模块}-03: 查询{资源名}详情', () => {
    it('{模块}-03-01: 应返回{资源名}详情', async () => {
      expect(createdId).toBeDefined();
      const response = await request(app.getHttpServer())
        .get(`/api/{路由}/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data.id).toBe(createdId);
    });

    it('{模块}-03-02: 不存在的 ID 应返回 404', async () => {
      await request(app.getHttpServer())
        .get('/api/{路由}/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // =====================================================================
  // {模块}-04: 更新
  // =====================================================================
  describe('{模块}-04: 更新{资源名}', () => {
    it('{模块}-04-01: 应更新{资源名}成功', async () => {
      expect(createdId).toBeDefined();
      const uniqueId = generateUniqueIdentifier('updated');
      const response = await request(app.getHttpServer())
        .put(`/api/{路由}/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `更新后{资源名}-${uniqueId}`,
        })
        .expect(200);

      expect(response.body.code).toBe(0);
      expect(response.body.data.name).toContain('更新后');
    });

    it('{模块}-04-02: 更新不存在的 ID 应返回 404', async () => {
      await request(app.getHttpServer())
        .put('/api/{路由}/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '不存在' })
        .expect(404);
    });

    it('{模块}-04-03: 未认证应返回 401', async () => {
      await request(app.getHttpServer())
        .put(`/api/{路由}/${createdId}`)
        .send({ name: '无认证' })
        .expect(401);
    });
  });

  // =====================================================================
  // {模块}-05: 删除
  // =====================================================================
  describe('{模块}-05: 删除{资源名}', () => {
    it('{模块}-05-01: 应删除{资源名}成功', async () => {
      expect(createdId).toBeDefined();
      const response = await request(app.getHttpServer())
        .delete(`/api/{路由}/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.code).toBe(0);
    });

    it('{模块}-05-02: 删除后应查询不到（软删除）', async () => {
      expect(createdId).toBeDefined();
      await request(app.getHttpServer())
        .get(`/api/{路由}/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
```

**生成规则**：
- 变量名 `{模块}`、`{路由}`、`{资源名}` 等根据实际 Controller/DTO 自动填充
- 如果模块不需要分页查询（无 `GET /api/xxx` 列表接口），则跳过 {模块}-02
- 如果 DTO 有额外唯一字段（如 code 之外），增加对应的唯一性冲突测试
- 如果接口有权限细分（如某些接口仅管理员可调用），增加对应的 403 测试

---

## L4 — 前端组件测试骨架模板

```typescript
/**
 * @fileoverview {组件名} 组件单元测试
 * @description 测试 {组件名} 组件的渲染和交互
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import {ComponentName} from '../Index.vue';

describe('{ComponentName}', () => {
  const createWrapper = (props = {}, slots = {}) => {
    return mount({ComponentName}, {
      props: {
        // 默认 props
        ...props,
      },
      slots,
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            // 如果需要初始 store 状态：
            // initialState: { auth: { token: 'mock-token' } },
          }),
        ],
        stubs: {
          // Element Plus 组件 stub
          ElButton: true,
          ElInput: true,
          ElDialog: true,
          ElTable: true,
          ElForm: true,
          ElFormItem: true,
          ElTag: true,
          ElSelect: true,
          ElOption: true,
          ElPagination: true,
          ElMessageBox: true,
          ElMessage: true,
        },
      },
    });
  };

  describe('基础渲染', () => {
    it('应正确渲染组件', () => {
      const wrapper = createWrapper();
      expect(wrapper.find('.mfw-{component-class}').exists()).toBe(true);
    });

    it('应显示传入的 props 值', () => {
      const wrapper = createWrapper({ title: '测试标题' });
      expect(wrapper.text()).toContain('测试标题');
    });

    it('无 props 时应使用默认值', () => {
      const wrapper = createWrapper();
      // 验证默认行为
      expect(wrapper.find('.mfw-{component-class}').exists()).toBe(true);
    });
  });

  describe('交互行为', () => {
    it('点击按钮应触发事件', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.mfw-{component-class}__action').trigger('click');
      expect(wrapper.emitted('action')).toBeTruthy();
    });

    it('应正确处理表单输入', async () => {
      const wrapper = createWrapper();
      const input = wrapper.find('[data-testid="{testid}-input"]');
      if (input.exists()) {
        await input.setValue('测试值');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      }
    });
  });

  describe('边界情况', () => {
    it('空数据时应显示空状态或默认文本', () => {
      const wrapper = createWrapper({ data: [] });
      // 检查空状态渲染
      expect(wrapper.exists()).toBe(true);
    });

    it('null 值应不导致渲染错误', () => {
      expect(() => {
        const wrapper = createWrapper({ value: null });
        expect(wrapper.exists()).toBe(true);
      }).not.toThrow();
    });

    it('undefined 值应不导致渲染错误', () => {
      expect(() => {
        const wrapper = createWrapper({ value: undefined });
        expect(wrapper.exists()).toBe(true);
      }).not.toThrow();
    });
  });

  describe('插槽', () => {
    it('默认插槽内容应正确渲染', () => {
      const wrapper = createWrapper({}, { default: '<span class="slot-content">插槽内容</span>' });
      expect(wrapper.find('.slot-content').exists()).toBe(true);
    });
  });
});
```

**生成规则**：
- `{ComponentName}` 从组件 `Index.vue` 的 `name` 或文件名推断
- `{component-class}` 从组件的 BEM CSS 根类名推断（`.mfw-xxx`）
- 如果组件使用 Pinia store，在 `createTestingPinia` 中配置初始状态
- 如果组件依赖 composable，用 `vi.mock()` 模拟
- 如果组件是表单弹窗，必须测试 `defineExpose({ onConfirm })` 的调用路径

---

## L5 — E2E 测试骨架模板

```typescript
/**
 * @fileoverview {功能名} E2E 测试
 * @description 端到端测试 {功能名} 的完整用户操作流程
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  login,
  navigateTo,
  dismissElMessage,
  confirmDialog,
