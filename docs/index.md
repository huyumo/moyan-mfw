---
layout: home

hero:
  name: Moyan MFW 权限系统
  text: 企业级权限管理框架文档
  tagline: 高效、灵活、可扩展的权限管理解决方案
  actions:
    - theme: brand
      text: 快速开始
      link: /01-业务需求/01-基础设施/01-产品概述/基础设施概述
    - theme: alt
      text: 术语表
      link: /01-业务需求/01-基础设施/01-产品概述/术语表

features:
  - icon: 📋
    title: 业务需求
    details: 产品概述、核心概念、数据库设计、业务流程、页面设计、API 接口
    link: /01-业务需求/01-基础设施/README
  - icon: 👥
    title: 团队协作
    details: 团队章程、评审流程、检查清单、会议纪要
    link: /02-团队/README
  - icon: 📐
    title: 框架规范
    details: 前端规范、后端规范、统一开发规范
    link: /03-框架规范/README
  - icon: 🚀
    title: 项目实施
    details: 项目规划、前端开发、后端开发、API 开发、任务追踪
    link: /04-项目实施/README
---

<script setup>
import { ref } from 'vue'

const expanded = ref({
  '01': true,
  '02': false,
  '03': false,
  '04': false,
})

const toggle = (key) => {
  expanded.value[key] = !expanded.value[key]
}
</script>

<style>
.dir-tree { margin-top: 2rem; }
.dir-section { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; }
.dir-header { background: var(--vp-c-bg-soft); padding: 1rem 1.5rem; font-weight: 600; font-size: 1.1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.dir-header:hover { background: var(--vp-c-bg-alt); }
.dir-toggle { transition: transform 0.2s; }
.dir-toggle.expanded { transform: rotate(90deg); }
.dir-content { padding: 0; }
.dir-subsection { border-bottom: 1px solid var(--vp-c-divider); }
.dir-subsection:last-child { border-bottom: none; }
.dir-subtitle { background: var(--vp-c-bg-soft); padding: 0.75rem 1.5rem; font-weight: 500; display: flex; align-items: center; cursor: pointer; }
.dir-subtitle:hover { background: var(--vp-c-bg-alt); }
.dir-list { list-style: none; padding: 0.5rem 0; margin: 0; }
.dir-list li { padding: 0.25rem 0; }
.dir-list a { display: block; padding: 0.4rem 1.5rem; color: var(--vp-c-text-1); text-decoration: none; transition: all 0.2s; }
.dir-list a:hover { background: var(--vp-c-default-soft); color: var(--vp-c-brand); padding-left: 1.8rem; }
.dir-group-title { font-weight: 600; padding: 0.5rem 1.5rem; color: var(--vp-c-brand); }
</style>

<div class="dir-tree">

## 文档目录

<div class="dir-section">

### <span style="cursor:pointer" @click="toggle('01')">▶ 01-业务需求</span>

<div v-if="expanded['01']" class="dir-content">

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('01-01')">▶ 01-基础设施</div>

<div v-if="expanded['01-01']" class="dir-list">

<div class="dir-group-title">01-产品概述</div>
- [产品概述](/01-业务需求/01-基础设施/01-产品概述/产品概述)
- [基础设施概述](/01-业务需求/01-基础设施/01-产品概述/基础设施概述)
- [术语表](/01-业务需求/01-基础设施/01-产品概述/术语表)
- [基础设施详细设计索引](/01-业务需求/01-基础设施/01-产品概述/基础设施详细设计索引)
- [基础设施详细设计](/01-业务需求/01-基础设施/01-产品概述/基础设施详细设计)
- [入门](/01-业务需求/01-基础设施/01-产品概述/入门)

<div class="dir-group-title">02-核心概念</div>
- [权限系统](/01-业务需求/01-基础设施/02-核心概念/权限系统)
- [角色体系](/01-业务需求/01-基础设施/02-核心概念/角色体系)
- [系统架构](/01-业务需求/01-基础设施/02-核心概念/系统架构)
- [缓存策略](/01-业务需求/01-基础设施/02-核心概念/缓存策略)

<div class="dir-group-title">03-数据库设计</div>
- [数据库实体设计](/01-业务需求/01-基础设施/03-数据库设计/数据库实体设计)
- [数据库 ER 关系图](/01-业务需求/01-基础设施/03-数据库设计/数据库 ER 关系图)

<div class="dir-group-title">04-业务流程</div>
- [权限分配流程](/01-业务需求/01-基础设施/04-业务流程/权限分配流程)
- [权限池配置流程](/01-业务需求/01-基础设施/04-业务流程/权限池配置流程)
- [系统初始化流程](/01-业务需求/01-基础设施/04-业务流程/系统初始化流程)
- [用户登录流程](/01-业务需求/01-基础设施/04-业务流程/用户登录流程)
- [权限计算规则](/01-业务需求/01-基础设施/04-业务流程/权限计算规则)
- [开发者模式](/01-业务需求/01-基础设施/04-业务流程/开发者模式)

<div class="dir-group-title">05-页面设计</div>
- [应用类型管理页面](/01-业务需求/01-基础设施/05-页面设计/应用类型管理页面)
- [应用实例管理页面](/01-业务需求/01-基础设施/05-页面设计/应用实例管理页面)
- [角色管理页面](/01-业务需求/01-基础设施/05-页面设计/角色管理页面)
- [成员管理页面](/01-业务需求/01-基础设施/05-页面设计/成员管理页面)
- [权限管理页面](/01-业务需求/01-基础设施/05-页面设计/权限管理页面)
- [PC 权限管理页面](/01-业务需求/01-基础设施/05-页面设计/PC 权限管理页面)

<div class="dir-group-title">06-API 接口</div>
- [API 接口索引](/01-业务需求/01-基础设施/06-API 接口/API 接口索引)
- [统一类型定义](/01-业务需求/01-基础设施/06-API 接口/统一类型定义)
- [错误码定义](/01-业务需求/01-基础设施/06-API 接口/错误码定义)
- [认证接口](/01-业务需求/01-基础设施/06-API 接口/认证接口)
- [用户接口](/01-业务需求/01-基础设施/06-API 接口/用户接口)
- [应用类型接口](/01-业务需求/01-基础设施/06-API 接口/应用类型接口)
- [应用接口](/01-业务需求/01-基础设施/06-API 接口/应用接口)
- [角色接口](/01-业务需求/01-基础设施/06-API 接口/角色接口)
- [成员接口](/01-业务需求/01-基础设施/06-API 接口/成员接口)
- [权限接口](/01-业务需求/01-基础设施/06-API 接口/权限接口)
- [审计日志设计](/01-业务需求/01-基础设施/06-API 接口/审计日志设计)

<div class="dir-group-title">07-UI 规范</div>
- [异常状态 UI 规范](/01-业务需求/01-基础设施/07-UI 规范/异常状态 UI 规范)

<div class="dir-group-title">08-开发指南</div>
- [典型应用场景](/01-业务需求/01-基础设施/08-开发指南/典型应用场景)
- [错误处理流程](/01-业务需求/01-基础设施/08-开发指南/错误处理流程)

<div class="dir-group-title">09-追踪文档</div>
- [问题追踪](/01-业务需求/01-基础设施/09-追踪文档/问题追踪)
- [变更日志](/01-业务需求/01-基础设施/09-追踪文档/变更日志)
- [PC 权限同步功能方案](/01-业务需求/01-基础设施/09-追踪文档/PC 权限同步功能方案)
- [评审报告](/01-业务需求/01-基础设施/09-追踪文档/评审报告%20-2026-03-28)

</div>
</div>

<div style="padding: 0.75rem 1.5rem;">
> 📖 完整导航：[01-基础设施 README](/01-业务需求/01-基础设施/README)
</div>

</div>
</div>

<div class="dir-section">

### <span style="cursor:pointer" @click="toggle('02')">▶ 02-团队</span>

<div v-if="expanded['02']" class="dir-content">

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('02-01')">▶ 01-团队规范</div>

<div v-if="expanded['02-01']" class="dir-list">

- [01-团队章程](/02-团队/01-团队规范/01-团队章程)
- [02-评审流程](/02-团队/01-团队规范/02-评审流程)
- [03-任务模板](/02-团队/01-团队规范/03-任务模板)
- [04-会议纪要模板](/02-团队/01-团队规范/04-会议纪要模板)
- [05-任务执行全流程](/02-团队/01-团队规范/05-任务执行全流程)
- [09-前端组件库开发计划](/02-团队/01-团队规范/09-前端组件库开发计划)
- [06-质量检查清单](/02-团队/01-团队规范/06-质量检查清单)
- [08-质量保障体系总览](/02-团队/01-团队规范/08-质量保障体系总览)
- [10-改进行动计划](/02-团队/01-团队规范/10-改进行动计划)
- [11-项目经理建议](/02-团队/01-团队规范/11-项目经理建议)
- [12-项目交付报告](/02-团队/01-团队规范/12-项目交付报告)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('02-02')">▶ 02-检查清单</div>

<div v-if="expanded['02-02']" class="dir-list">

- [产品经理检查清单](/02-团队/02-检查清单/产品经理检查清单)
- [前端检查清单](/02-团队/02-检查清单/前端检查清单)
- [后端检查清单](/02-团队/02-检查清单/后端检查清单)
- [测试工程师检查清单](/02-团队/02-检查清单/测试工程师检查清单)
- [文档检查清单](/02-团队/02-检查清单/文档检查清单)
- [技术主管检查清单](/02-团队/02-检查清单/技术主管检查清单)
- [项目审查检查清单](/02-团队/02-检查清单/项目审查检查清单)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('02-03')">▶ 03-评审报告</div>

<div v-if="expanded['02-03']" class="dir-list">

- [2026-03-27_文档三轮评审报告](/02-团队/03-评审报告/2026-03-27_文档三轮评审报告)
- [2026-03-28_PC 权限同步专题评审](/02-团队/03-评审报告/2026-03-28_PC 权限同步专题评审)
- [2026-03-29_前端组件计划评审](/02-团队/03-评审报告/2026-03-29_前端组件计划评审)
- [2026-03-29_前端组件计划修订报告](/02-团队/03-评审报告/2026-03-29_前端组件计划修订报告)
- [2026-03-29_前端组件评估报告](/02-团队/03-评审报告/2026-03-29_前端组件评估报告)
- [综合评审报告](/02-团队/03-评审报告/综合评审报告)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('02-04')">▶ 04-会议纪要</div>

<div v-if="expanded['02-04']" class="dir-list">

- [会议纪要归档说明](/02-团队/04-会议纪要/会议纪要归档说明)
- [2026-03-27_三团队综合评审会_评审会_纪要](/02-团队/04-会议纪要/2026-03/2026-03-27_三团队综合评审会_评审会_纪要)

</div>
</div>

<div style="padding: 0.75rem 1.5rem;">
> 📖 完整导航：[02-团队 README](/02-团队/README)
</div>

</div>
</div>

<div class="dir-section">

### <span style="cursor:pointer" @click="toggle('03')">▶ 03-框架规范</span>

<div v-if="expanded['03']" class="dir-content">

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('03-01')">▶ 01-前端规范</div>

<div v-if="expanded['03-01']" class="dir-list">

- [00-前端规范索引](/03-框架规范/01-前端规范/00-前端规范索引)
- [01-编码基础规范](/03-框架规范/01-前端规范/01-编码基础规范)
- [02-Vue-组件规范](/03-框架规范/01-前端规范/02-Vue-组件规范)
- [03-Composables 规范](/03-框架规范/01-前端规范/03-Composables 规范)
- [04-状态管理规范](/03-框架规范/01-前端规范/04-状态管理规范)
- [05-路由配置指南](/03-框架规范/01-前端规范/05-路由配置指南)
- [06-API 调用规范](/03-框架规范/01-前端规范/06-API 调用规范)
- [07-样式规范](/03-框架规范/01-前端规范/07-样式规范)
- [08-Git 工作流](/03-框架规范/01-前端规范/08-Git 工作流)
- [09-测试规范](/03-框架规范/01-前端规范/09-测试规范)
- [10-构建与部署](/03-框架规范/01-前端规范/10-构建与部署)
- [11-性能优化](/03-框架规范/01-前端规范/11-性能优化)
- [12-代码审查清单](/03-框架规范/01-前端规范/12-代码审查清单)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('03-02')">▶ 02-后端规范</div>

<div v-if="expanded['03-02']" class="dir-list">

- [00-后端规范索引](/03-框架规范/02-后端规范/00-后端规范索引)
- [01-编码基础规范](/03-框架规范/02-后端规范/01-编码基础规范)
- [02-项目架构规范](/03-框架规范/02-后端规范/02-项目架构规范)
- [03-API 设计规范](/03-框架规范/02-后端规范/03-API设计规范)
- [04-数据库规范](/03-框架规范/02-后端规范/04-数据库规范)
- [05-权限安全规范](/03-框架规范/02-后端规范/05-权限安全规范)
- [06-日志与监控](/03-框架规范/02-后端规范/06-日志与监控)
- [07-Git 工作流](/03-框架规范/02-后端规范/07-Git工作流)
- [08-测试规范](/03-框架规范/02-后端规范/08-测试规范)
- [09-部署规范](/03-框架规范/02-后端规范/09-部署规范)
- [10-性能优化](/03-框架规范/02-后端规范/10-性能优化)
- [11-代码审查清单](/03-框架规范/02-后端规范/11-代码审查清单)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('03-03')">▶ 统一规范</div>

<div v-if="expanded['03-03']" class="dir-list">

- [统一开发规范](/03-框架规范/统一开发规范)

</div>
</div>

<div style="padding: 0.75rem 1.5rem;">
> 📖 完整导航：[03-框架规范 README](/03-框架规范/README)
</div>

</div>
</div>

<div class="dir-section">

### <span style="cursor:pointer" @click="toggle('04')">▶ 04-项目实施</span>

<div v-if="expanded['04']" class="dir-content">

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('04-01')">▶ 01-项目规划</div>

<div v-if="expanded['04-01']" class="dir-list">

- [00-项目综合分析与发展规划](/04-项目实施/01-项目规划/00-项目综合分析与发展规划)
- [01-实施方案](/04-项目实施/01-项目规划/01-实施方案)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('04-02')">▶ 02-前端开发</div>

<div v-if="expanded['04-02']" class="dir-list">

- [02-前端开发文档](/04-项目实施/02-前端开发/02-前端开发文档)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('04-03')">▶ 03-后端开发</div>

<div v-if="expanded['04-03']" class="dir-list">

- [03-后端开发文档](/04-项目实施/03-后端开发/03-后端开发文档)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('04-04')">▶ 04-API 开发</div>

<div v-if="expanded['04-04']" class="dir-list">

- [02-API 开发文档（所有接口）](/04-项目实施/04-API 开发/02-API 开发文档（所有接口）)

</div>
</div>

<div class="dir-subsection">

<div class="dir-subtitle" @click="toggle('04-05')">▶ 05-任务追踪</div>

<div v-if="expanded['04-05']" class="dir-list">

- [README](/04-项目实施/05-任务追踪/README)
- [001-前端组件库开发](/04-项目实施/05-任务追踪/001-前端组件库开发)
- [TASK-动态调整示例](/04-项目实施/05-任务追踪/TASK-动态调整示例)

</div>
</div>

<div style="padding: 0.75rem 1.5rem;">
> 📖 完整导航：[04-项目实施 README](/04-项目实施/README)
</div>

</div>
</div>

</div>

---

## 关于 Moyan MFW

Moyan MFW (Moyan Management Framework) 是一个企业级权限管理框架，为多租户 SaaS 应用提供完整的权限管理解决方案。

### 核心特性

- **多级权限控制** - 支持应用类型、应用实例、角色、成员多层级权限管理
- **权限池机制** - 灵活的权限分组和批量分配能力
- **角色继承** - 支持角色层级和权限继承
- **开发者模式** - 为开发环境提供便捷的权限调试能力
- **审计日志** - 完整的操作记录和审计追踪
- **缓存优化** - 多级缓存策略，提升权限计算性能

## 快速开始

| 步骤 | 内容 | 链接 |
|------|------|------|
| 1 | 阅读基础设施概述 | [基础设施概述](/01-业务需求/01-基础设施/01-产品概述/基础设施概述) |
| 2 | 学习核心概念 | [权限系统](/01-业务需求/01-基础设施/02-核心概念/权限系统) |
| 3 | 参考 API 文档 | [API 接口索引](/01-业务需求/01-基础设施/06-API 接口/API 接口索引) |

---

**维护**: @doc | **审查**: @audit | **批准**: @pm
