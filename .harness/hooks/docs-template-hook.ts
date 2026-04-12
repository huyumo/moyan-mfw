/**
 * 文档模板 Hook（通用版）
 *
 * 目的：为 Docs-Architect 注入文档模板
 * 从项目配置文件中读取模板，如果没有配置则提供通用模板
 *
 * 配置文件路径:
 * - .harness/config/docs.json (项目特定配置)
 * - .harness/config/docs.example.json (示例配置)
 */

import * as fs from 'fs';
import * as path from 'path';
import { findProjectRoot, loadPathsConfig } from '../utils/paths';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    templates: Record<string, string>;
    configLoaded: boolean;
    configPath: string | null;
  };
}

function loadConfig(projectRoot: string): { config: any | null; path: string | null } {
  const paths = loadPathsConfig(projectRoot);
  const configPath = paths.input.config.docs;

  // 检查项目特定配置
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return { config: JSON.parse(content), path: configPath };
    } catch (e) {
      // 继续尝试示例配置
    }
  }

  // 尝试示例配置
  const exampleConfigPath = configPath.replace('.json', '.example.json');
  if (fs.existsSync(exampleConfigPath)) {
    try {
      const content = fs.readFileSync(exampleConfigPath, 'utf-8');
      return { config: JSON.parse(content), path: exampleConfigPath };
    } catch (e) {
      // 继续
    }
  }

  return { config: null, path: null };
}

/**
 * 通用 API 文档模板
 */
const DEFAULT_API_TEMPLATE = `# API 文档：[API 名称]

## 概述
[简要描述 API 用途和主要功能]

## 基础信息
- **基础路径**: \`[path]\`
- **认证方式**: [认证机制]
- **内容类型**: \`application/json\`

## 端点列表

### [端点名称]
\`\`\`
[METHOD] [路径]
\`\`\`

**描述**: [端点功能描述]

**请求参数**:
| 参数 | 类型 | 位置 | 必填 | 描述 |
|------|------|------|------|------|
| | | path/query/body | | |

**请求示例**:
\`\`\`json
{
}
\`\`\`

**响应示例** (200 OK):
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

**错误响应**:
| 状态码 | 描述 | 处理方式 |
|--------|------|----------|
| 400 | 请求参数错误 | 返回验证错误详情 |
| 401 | 未认证 | 返回认证错误 |
| 403 | 无权限 | 返回授权错误 |
| 404 | 资源不存在 | 返回资源错误 |
| 500 | 服务器错误 | 记录日志并返回通用错误 |
`;

/**
 * 通用技术设计文档模板
 */
const DEFAULT_DESIGN_TEMPLATE = `# 技术设计文档：[功能/模块名称]

## 1. 概述

### 1.1 背景
[为什么需要这个功能/模块]

### 1.2 目标
[要解决什么问题，达到什么目标]

### 1.3 范围
[包含什么，不包含什么]

## 2. 架构设计

### 2.1 系统上下文
[系统/模块在整体架构中的位置]

### 2.2 核心组件
[列出主要组件及其职责]

### 2.3 数据流
[数据如何在组件间流动]

## 3. 接口设计

### 3.1 对外接口
[API/事件/消息格式]

### 3.2 对内接口
[内部方法/函数签名]

## 4. 数据设计

### 4.1 数据模型
[数据库表/文档结构]

## 5. 安全设计

### 5.1 认证
[如何验证用户身份]

### 5.2 授权
[如何控制访问权限]

## 6. 测试策略

### 6.1 单元测试
[核心逻辑测试]

### 6.2 集成测试
[接口/流程测试]

## 7. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| | 低/中/高 | 低/中/高 | |
`;

/**
 * 通用用户指南模板
 */
const DEFAULT_GUIDE_TEMPLATE = `# 用户指南：[功能名称]

## 快速开始

### 前提条件
- [ ] [条件 1]
- [ ] [条件 2]

### 安装/配置步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

## 功能说明

### [功能 1]
**用途**: [功能用途]

**操作步骤**:
1. [操作 1]
2. [操作 2]

**预期结果**: [预期输出]

## 常见问题

### Q: [问题 1]
A: [解答 1]

### Q: [问题 2]
A: [解答 2]

## 故障排除

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| | | |
`;

/**
 * 通用 README 模板
 */
const DEFAULT_README_TEMPLATE = `# [项目名称]

[项目简介 - 一句话描述项目用途]

## 功能特性

- [特性 1]
- [特性 2]
- [特性 3]

## 快速开始

### 环境要求
- [要求 1]
- [要求 2]

### 安装依赖
\`\`\`bash
[安装命令]
\`\`\`

### 启动
\`\`\`bash
[启动命令]
\`\`\`

### 运行测试
\`\`\`bash
[测试命令]
\`\`\`

## 项目结构

\`\`\`
project/
├── src/           # 源代码
├── tests/         # 测试文件
├── docs/          # 文档
└── scripts/       # 脚本
\`\`\`

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

[许可证类型]
`;

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const { config, path: configPath } = loadConfig(projectRoot);

  // 从配置加载或使用默认模板
  const templates = config?.templates || {
    apiDoc: DEFAULT_API_TEMPLATE,
    designDoc: DEFAULT_DESIGN_TEMPLATE,
    userGuide: DEFAULT_GUIDE_TEMPLATE,
    readme: DEFAULT_README_TEMPLATE
  };

  if (config) {
    result.message = `📄 文档模板已加载（来自 ${path.relative(projectRoot, configPath!)})`;
  } else {
    result.message = '📄 文档模板（通用模板 - 可配置项目特定模板）';
    result.warnings.push(
      '未找到文档配置文件，已加载通用模板',
      '建议创建 .harness/config/docs.json 定义项目特定模板'
    );
  }

  result.data = {
    templates,
    configLoaded: !!config,
    configPath: configPath ? path.relative(projectRoot, configPath) : null
  };

  // 写入模板文件
  const outputDir = path.join(projectRoot, '.harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const templatesFile = path.join(outputDir, 'docs-templates.json');
  fs.writeFileSync(templatesFile, JSON.stringify(result.data, null, 2), 'utf-8');

  // 写入 markdown 格式
  const mdFile = path.join(outputDir, 'docs-templates.md');
  const mdContent = `# 文档模板

${config ? `> 配置文件：${path.relative(projectRoot, configPath!)}` : '> ℹ️ 未找到配置文件，使用通用模板'}

## 可用模板

### 1. API 文档模板
用于编写 API 接口文档，包含端点描述、请求参数、响应示例等。

### 2. 技术设计文档模板
用于编写技术方案设计文档，包含架构设计、接口设计、数据设计等。

### 3. 用户指南模板
用于编写用户使用指南，包含快速开始、功能说明、常见问题等。

### 4. README 模板
用于项目 README.md 文件，包含项目简介、快速开始等。

## 使用方式

在编写文档时，请参考 \`output/docs-templates.json\` 中的模板内容，根据项目实际情况进行调整。
`;
  fs.writeFileSync(mdFile, mdContent, 'utf-8');

  return result;
}

const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(JSON.stringify({
        passed: false,
        message: `钩子执行失败：${error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}
