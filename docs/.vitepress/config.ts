import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const sidebar: DefaultTheme.Sidebar = [
  {
    text: '首页',
    items: [
      { text: '文档首页', link: '/' },
    ],
  },
  {
    text: '01-业务需求',
    items: [
      { text: '基础设施导航', link: '/01-业务需求/01-基础设施/README' },
      { text: '产品概述', link: '/01-业务需求/01-基础设施/01-产品概述/产品概述' },
      { text: '核心概念', link: '/01-业务需求/01-基础设施/02-核心概念/权限系统' },
      { text: '数据库设计', link: '/01-业务需求/01-基础设施/03-数据库设计/数据库实体设计' },
      { text: '业务流程', link: '/01-业务需求/01-基础设施/04-业务流程/权限分配流程' },
      { text: '页面设计', link: '/01-业务需求/01-基础设施/05-页面设计/应用类型管理页面' },
      { text: 'API 接口', link: '/01-业务需求/01-基础设施/06-API 接口/API 接口索引' },
      { text: 'UI 规范', link: '/01-业务需求/01-基础设施/07-UI 规范/异常状态 UI 规范' },
      { text: '开发指南', link: '/01-业务需求/01-基础设施/08-开发指南/典型应用场景' },
      { text: '追踪文档', link: '/01-业务需求/01-基础设施/09-追踪文档/问题追踪' },
    ],
  },
  {
    text: '02-团队',
    items: [
      { text: '团队导航', link: '/02-团队/README' },
      { text: '团队章程', link: '/02-团队/01-团队规范/01-团队章程' },
      { text: '评审流程', link: '/02-团队/01-团队规范/02-评审流程' },
      { text: '检查清单', link: '/02-团队/02-检查清单/产品经理检查清单' },
      { text: '评审报告', link: '/02-团队/03-评审报告/评审报告' },
      { text: '会议纪要', link: '/02-团队/04-会议纪要/会议纪要归档说明' },
    ],
  },
  {
    text: '03-框架规范',
    items: [
      { text: '框架规范导航', link: '/03-框架规范/README' },
      { text: '前端规范', link: '/03-框架规范/01-前端规范/00-前端规范索引' },
      { text: '后端规范', link: '/03-框架规范/02-后端规范/00-后端规范索引' },
      { text: '统一开发规范', link: '/03-框架规范/统一开发规范' },
    ],
  },
  {
    text: '04-项目实施',
    items: [
      { text: '项目实施导航', link: '/04-项目实施/README' },
      { text: '项目规划', link: '/04-项目实施/01-项目规划/01-实施方案' },
      { text: '前端开发', link: '/04-项目实施/02-前端开发/02-前端开发文档' },
      { text: '后端开发', link: '/04-项目实施/03-后端开发/03-后端开发文档' },
      { text: 'API 开发', link: '/04-项目实施/04-API 开发/02-API 开发文档（所有接口）' },
      { text: '任务追踪', link: '/04-项目实施/05-任务追踪/README' },
    ],
  },
]

export default withMermaid(defineConfig({
  title: 'Moyan MFW 权限系统文档',
  description: 'Moyan MFW 权限系统基础设施文档',
  lastUpdated: true,
  srcDir: './',
  // 忽略 archived 目录（内部任务追踪文件，不是用户文档）
  srcExclude: ['04-项目实施/05-任务追踪/archived/**/*.md'],
  // 忽略死链检查（因为文档还在建设中，包含一些未完成区域的链接）
  ignoreDeadLinks: true,
  vite: {
    server: {
      host: '0.0.0.0', // 允许 IP 访问
    },
  },
  mermaid: {
  securityLevel: 'loose',
  startOnLoad: true,
  theme: 'default',
},
  mermaidPlugin: {
  class: 'mermaid',
},
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '术语表', link: '/glossary' },
    ],
    sidebar,
    search: {
      provider: 'local',
    },
  },
}))
