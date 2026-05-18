# 01 · 项目目录结构

## Monorepo 结构

```
moyan-mfw/                           # pnpm workspace 根
├── packages/
│   └── base/                        # 核心基础设施 (moyan-mfw-base)
│       ├── src/backend/             # 后端基包 → moyan-mfw-base/backend
│       │   ├── common/              # 通用基础设施
│       │   │   ├── constants/       #   权限常量（位运算值）
│       │   │   ├── decorators/      #   装饰器（Public/RequirePermission/AuditLog/User/AppId）
│       │   │   ├── entities/        #   Base 基类
│       │   │   ├── exceptions/      #   自定义异常
│       │   │   ├── filters/         #   全局异常过滤器
│       │   │   ├── guards/          #   守卫（Auth/Permission）
│       │   │   ├── interceptors/    #   拦截器（Transform/Logging/Audit）
│       │   │   ├── types/           #   通用类型（UserDto/ResourceDto）
│       │   │   └── utils/           #   工具函数（encrypt/pagination/sql/tree）
│       │   ├── config/              # 配置（app/database/redis/user/jwt）
│       │   ├── modules/sys/         # 系统业务模块
│       │   │   ├── auth/            #   认证（登录/注册/Token/权限菜单）
│       │   │   ├── user/            #   用户管理
│       │   │   ├── role/            #   角色管理
│       │   │   ├── permission/      #   权限管理
│       │   │   ├── app-type/        #   应用类型管理
│       │   │   ├── app/             #   应用实例+成员管理
│       │   │   ├── audit-log/       #   审计日志
│       │   │   ├── upload/          #   文件上传
│       │   │   └── install/         #   系统初始化
│       │   └── database/seeds/      # 种子数据
│       │
│       ├── src/frontend/            # 前端基包 → moyan-mfw-base/frontend
│       │   ├── apis/                # API 调用层（自动生成，禁止修改）
│       │   ├── components/          # 通用组件库（Mfw 前缀）
│       │   │   ├── business/        #   业务组件（权限/角色/应用选择器）
│       │   │   ├── display/         #   展示组件（CardPanel/Detail/Format）
│       │   │   ├── editor/          #   编辑器组件（MD/Quill/JSON）
│       │   │   ├── feedback/        #   反馈组件（MfwPopup）
│       │   │   ├── form/            #   表单组件（MfwFormCard）
│       │   │   ├── layout/          #   布局扩展组件
│       │   │   ├── page/            #   页面组件（PageWrapper/ListPage）
│       │   │   ├── picker/          #   选择器组件（UserPicker/IconPicker）
│       │   │   ├── table/           #   表格组件（TableList/ActionButtons）
│       │   │   └── upload/          #   上传组件
│       │   ├── composables/         # 组合式函数（useColorMode/useThemeSwitch）
│       │   ├── directives/          # 自定义指令（v-permission）
│       │   ├── hooks/               # 自定义钩子（usePermission）
│       │   ├── layouts/             # 布局系统（AdminLayout）
│       │   ├── plugins/             # 插件（ElementPlus + MoAxios）
│       │   ├── router/              # 路由（自动扫描+守卫+菜单树）
│       │   ├── store/               # 状态管理（auth/layout/app-loading）
│       │   ├── themes/              # 主题系统（9 套主题包）
│       │   ├── types/               # 类型定义
│       │   ├── utils/               # 工具（权限位运算）
│       │   └── views/               # 基础视图页面（仅路由页面，禁止放弹窗/面板）
│       │
│       └── src/shared/              # 共享字典 → moyan-mfw-base/shared
│           ├── core/                #   核心（装饰器/注册表/工具函数）
│           └── base/                #   内置字典（StatusDict/GenderDict/...）
│
├── packages/extensions/             # 扩展包目录
│   └── extension-xxx/
│       ├── src/backend/
│       ├── src/frontend/
│       └── src/shared/
│
└── docs/                            # 项目文档
    ├── api-reference/               #   API 参考手册
    └── development-standards/       #   开发规范
```

---

## 框架能力边界

### ✅ 框架提供

- 用户/角色/权限管理
- JWT 认证与 Token 自动刷新
- 位运算细粒度权限控制
- 多应用类型/多应用实例
- 审计日志（模块 + 事件 + 描述）
- 文件上传（简单 URL 存储 + 静态文件服务）
- 系统初始化向导
- 自动路由扫描与菜单生成
- 布局系统 + 9 套主题
- 字典体系（共享枚举定义）

### ❌ 框架不提供

- 复杂文件存储（OSS 等）
- 消息队列
- 工作流引擎
- WebSocket 实时通讯
- 搜索引擎集成

---

## 适合开发的系统类型

| 类型 | 示例 |
|------|------|
| 企业管理后台 | OA、CRM、内部管理系统 |
| SaaS 平台 | 多租户/多商家管理后台 |
| 运维管理平台 | 监控、配置、日志管理 |
| 内容管理系统 | CMS、博客后台 |
| 数据管理平台 | 报表、数据看板 |
