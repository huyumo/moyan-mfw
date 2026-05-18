# Contributing to moyan-mfw-cli

面向 CLI 开发者和维护者的开发指南。

## 开发

```bash
# 克隆仓库后进入 CLI 目录
cd packages/cli

# 安装依赖
pnpm install

# 开发模式（watch）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## 模板说明

moyan-mfw-cli 使用 [Handlebars](https://handlebarsjs.com/) 模板引擎，模板文件以 `.hbs` 扩展名存放在 `src/templates/` 目录下。

### Handlebars 模板变量

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `{{name}}` | `my-ext` | kebab-case 项目名 |
| `{{displayName}}` | `MyExt` | 显示名称 |
| `{{description}}` | 用户输入 | 项目描述 |
| `{{className}}` | `MyExt` | PascalCase 类名 |
| `{{version}}` | `0.1.0` | 初始版本 |
| `{{year}}` | `2026` | 当前年份 |

### 自定义 Helpers

| Helper | 输入 | 输出 | 说明 |
|--------|------|------|------|
| `pascalCase` | `my-ext` | `MyExt` | 转 PascalCase |
| `pascalCaseUpper` | `my-ext` | `MYEXT` | 转大写 PascalCase |
| `camelCase` | `my-ext` | `myExt` | 转 camelCase |
| `snakeCase` | `my-ext` | `my_ext` | 转 snake_case |

Helpers 定义在 [`src/utils/template.ts`](src/utils/template.ts)。

### 模板变量示例

```hbs
<!-- 权限常量声明 -->
export const {{pascalCaseUpper name}}_PERMISSION_VALUES = [...]

<!-- 数据库名 -->
DB_NAME={{snakeCase name}}

<!-- 包名引用 -->
"moyan-mfw-extension-{{name}}": "workspace:*"
```

## 添加新模板

1. 在 `src/templates/` 下创建新目录
2. 编写 `.hbs` 模板文件
3. 在 `src/commands/` 添加对应命令
4. 在 `src/utils/template.ts` 注册 helpers（如需）

## 架构

```
src/
├── index.ts              # Commander 入口，注册命令树
├── commands/
│   ├── create.ts         # mfw create extension
│   └── create-business.ts # mfw create business
├── utils/
│   ├── template.ts       # Handlebars 渲染 + Prettier 格式化
│   └── fs.ts             # 文件系统工具
└── templates/
    ├── extension/        # 扩展插件模板
    └── business/         # 业务项目模板
```
