---
version: "1.0"
last_updated: "2026-04-25"
scope: shared
triggers:
  - "编写测试"
  - "单元测试"
  - "集成测试"
  - "测试规范"
  - "vitest"
  - "Jest"
dependencies: []
maturity: stable
tags: [测试, 单元测试, 集成测试, vitest, Jest, 前端, 后端]
---

# 测试规范

## 后端集成测试

### 目录与命名

- 位置：`packages/base-backend/tests/integration/`
- 命名：`xxx-api.spec.ts`（对应 `xxx.controller.ts`）
- 框架：supertest + Jest
- 运行：`cd packages/base-backend ; pnpm run test:e2e`

### 标准模板

```typescript
/**
 * @fileoverview XXX 集成测试
 * @description 测试 XXX 模块的 API 端点
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('XxxController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    // 登录获取 token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    token = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/xxx', () => {
    it('应创建新记录', () => {
      return request(app.getHttpServer())
        .post('/api/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '测试名称' })
        .expect(201);
    });

    it('未认证应返回 401', () => {
      return request(app.getHttpServer())
        .post('/api/xxx')
        .send({ name: '测试名称' })
        .expect(401);
    });
  });

  describe('GET /api/xxx', () => {
    it('应返回分页列表', () => {
      return request(app.getHttpServer())
        .get('/api/xxx')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('DELETE /api/xxx/:id', () => {
    it('应软删除记录', async () => {
      // 先创建
      const createRes = await request(app.getHttpServer())
        .post('/api/xxx')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '待删除' });
      const id = createRes.body.data.id;

      // 再删除
      return request(app.getHttpServer())
        .delete(`/api/xxx/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
```

### 后端测试约定

- 每个模块对应一个 `xxx-api.spec.ts`
- 使用 `beforeAll` 初始化应用和获取 token
- 使用 `afterAll` 关闭应用
- 测试完整的 HTTP 请求/响应流程
- 必须测试认证失败（401）和权限不足（403）场景
- 分页查询测试应验证 `list` 和 `total` 字段

## 前端单元测试

### 目录与命名

- 位置：`packages/base-frontend/src/components/**/__tests__/`
- 命名：`xxx.spec.ts` 或 `xxx.test.ts`
- 框架：vitest + @vue/test-utils + jsdom
- 运行：`cd packages/base-frontend ; pnpm run test:unit`

### 标准模板

```typescript
/**
 * @fileoverview MfwXxx 组件测试
 * @description 测试 MfwXxx 组件的渲染和交互
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MfwXxx from '../Index.vue';

describe('MfwXxx', () => {
  const createWrapper = (props = {}) => {
    return mount(MfwXxx, {
      props,
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          ElButton: true,
          ElInput: true,
        },
      },
    });
  };

  it('应正确渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mfw-xxx').exists()).toBe(true);
  });

  it('点击按钮应触发事件', async () => {
    const wrapper = createWrapper();
    await wrapper.find('.mfw-xxx__action').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

### 前端测试约定

- 组件测试使用 `mount`（全挂载）优先，`shallowMount` 仅用于隔离复杂子组件
- Pinia store 使用 `createTestingPinia` 模拟
- Element Plus 组件使用 `stubs` 替代
- 异步操作使用 `vi.fn()` mock API 调用
- 测试文件放置在组件目录的 `__tests__/` 子目录中

## 通用测试约定

| 规则 | 说明 |
|------|------|
| 测试命名 | `describe('模块/组件名', () => { it('应...', ...) })` |
| 断言风格 | 使用 `expect` + `toBe`/`toEqual`/`toBeTruthy` 等语义化匹配器 |
| 环境变量 | 测试环境使用独立数据库，不污染开发数据 |
| 清理 | 每个测试用例应在 afterAll/afterEach 中清理创建的测试数据 |
| 覆盖率 | 目标：核心业务逻辑 ≥ 80% |

## 反模式（Red Flags）— 立即停止

- ✋ 在 `src/` 目录内放测试文件 → 测试必须放在 `tests/integration/` 或 `__tests__/` 中
- ✋ 集成测试直接操作数据库跳过 API → 必须通过 supertest 测试完整 HTTP 流程
- ✋ 前端测试中直接调用真实 API → 使用 `vi.fn()` mock
- ✋ 测试用例之间有执行顺序依赖 → 每个用例必须独立可执行
- ✋ 跳过认证/权限测试 → 必须覆盖 401/403 场景
- ✋ 测试中使用硬编码 ID → 使用创建 API 返回的动态 ID
