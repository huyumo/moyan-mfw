import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Moyan MFW 权限系统文档',
  description: 'Moyan MFW 权限系统基础设施文档',
  lastUpdated: true,
  srcDir: './docs',
  ignoreDeadLinks: ['ALL'],
  mermaid: {
    securityLevel: 'loose',
    startOnLoad: false,
  },
  vite: {
    optimizeDeps: {
      include: [
        'mermaid',
        '@braintree/sanitize-url',
        'dayjs',
        'debug',
        'cytoscape-cose-bilkent',
        'cytoscape'
      ]
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '术语表', link: '/glossary' },
    ],
    sidebar: [
      {
        text: '入门指南',
        items: [
          { text: '首页', link: '/' },
          { text: '术语表', link: '/glossary' },
        ],
      },
      {
        text: '核心概念',
        items: [
          { text: '权限系统', link: '/core/permissions' },
          { text: '角色体系', link: '/core/roles' },
          { text: '系统架构', link: '/core/architecture' },
        ],
      },
      {
        text: '数据库设计',
        items: [
          { text: '数据库实体设计', link: '/database/database-entities-design' },
          { text: '数据库 ER 关系图', link: '/database/database-er-diagram' },
        ],
      },
      {
        text: '业务流程',
        items: [
          { text: '权限分配流程', link: '/flows/permission-assignment' },
          { text: '权限池配置流程', link: '/flows/permission-pool-setup' },
          { text: '系统初始化流程', link: '/flows/system-initialization' },
          { text: '用户登录流程', link: '/flows/user-login-flow' },
          { text: '权限计算规则', link: '/flows/permission-calculation-rules' },
          { text: '开发者模式说明', link: '/flows/developer-mode' },
        ],
      },
      {
        text: '页面设计',
        items: [
          { text: '应用类型管理页面', link: '/pages/app-type-management' },
          { text: '应用实例管理页面', link: '/pages/app-management' },
          { text: '角色管理页面', link: '/pages/role-management' },
          { text: '成员管理页面', link: '/pages/member-management' },
          { text: '权限管理页面', link: '/pages/permission-management' },
        ],
      },
      {
        text: 'API 接口文档',
        items: [
          { text: 'API 接口索引', link: '/api/api-index' },
          { text: '统一类型定义', link: '/api/types' },
          { text: '错误码定义', link: '/api/error-codes' },
          { text: '认证接口', link: '/api/auth-api' },
          { text: '用户接口', link: '/api/user-api' },
          { text: '应用类型接口', link: '/api/app-type-api' },
          { text: '应用接口', link: '/api/app-api' },
          { text: '角色接口', link: '/api/role-api' },
          { text: '成员接口', link: '/api/member-api' },
          { text: '权限接口', link: '/api/permission-api' },
          { text: '审计日志设计', link: '/api/audit-log-design' },
        ],
      },
      {
        text: 'UI 规范',
        items: [
          { text: '异常状态 UI 规范', link: '/ui/ui-error-states' },
        ],
      },
      {
        text: '开发指南',
        items: [
          { text: '典型应用场景', link: '/guides/use-cases' },
          { text: '错误处理流程', link: '/guides/error-handling' },
        ],
      },
      {
        text: '追踪文档',
        items: [
          { text: '问题追踪', link: '/tracking/REVIEW-ISSUES' },
          { text: '变更日志', link: '/tracking/CHANGELOG' },
          { text: '文档评审报告', link: '/tracking/REVIEW-REPORT' },
          { text: '项目交付报告', link: '/tracking/PROJECT-DELIVERY-REPORT' },
          { text: '三团队会议纪要', link: '/tracking/THREE-TEAM-MEETING-MINUTES' },
          { text: '综合评审报告', link: '/tracking/COMPREHENSIVE-REVIEW-REPORT' },
          { text: '改进行动计划', link: '/tracking/IMPROVEMENT-ACTION-PLAN' },
          { text: 'PM 建议书', link: '/tracking/PM-RECOMMENDATIONS' },
        ],
      },
      {
        text: '基础设施文档',
        items: [
          { text: '基础设施详细设计索引', link: '/infrastructure-detailed-design-index' },
          { text: '基础设施详细设计', link: '/infrastructure-detailed-design' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
  },
  markdown: {
    image: {
      lazyLoading: true,
    },
  },
}))
