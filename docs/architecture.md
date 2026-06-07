# 系统架构

## 项目定位

BD达人运营管理系统 — 基于 Vue Vben Admin 定制的达人合作全流程管理平台。

## 技术栈

- **框架**: Vue 3 + TypeScript + Vite
- **构建**: Turbo monorepo + pnpm workspace
- **UI**: Ant Design Vue + Tailwind CSS
- **状态**: Pinia + @tanstack/vue-query
- **请求**: @vben/request (Axios 封装)
- **质量**: OXC (Lint + Format) + ESLint + Stylelint

## 基础层 (packages/)

| 分类 | 包名 | 职责 |
|------|------|------|
| 核心基础 | `@core/base/*` | design tokens / shared utils / icons / types |
| 核心组件 | `@core/composables` | useNamespace / useScrollLock / useSortable 等通用 composable |
| 核心 UI | `@core/ui-kit/*` | layout-ui / popup-ui / tabs-ui / form-ui / menu-ui |
| 效果层 | `effects/access` | 权限指令与 access control |
| 效果层 | `effects/common-ui` | 通用 UI 组件 (loading 等) |
| 效果层 | `effects/hooks` | useTabs / useWatermark / usePagination 等业务 composable |
| 效果层 | `effects/layouts` | 基础布局组件 |
| 效果层 | `effects/plugins` | 插件上下文 (form / motion 等) |
| 效果层 | `effects/request` | RequestClient 封装 (拦截器/错误处理/认证) |
| 共享包 | `stores` | Pinia stores (user / access / tabbar / timezone) |
| 共享包 | `locales` | i18n 国际化 |
| 共享包 | `constants` | 全局常量 |
| 共享包 | `types` | 共享 TypeScript 类型 |
| 共享包 | `utils` | 通用工具函数 |
| 共享包 | `icons` | SVG / Iconify 图标 |
| 共享包 | `styles` | 全局样式 (CSS 变量 / Tailwind 入口) |

## 业务层 (playground/src/)

| 目录 | 职责 |
|------|------|
| `views/` | 页面组件，按模块分子目录 |
| `router/` | 路由定义 (routes) + 权限守卫 (guard) + 动态路由生成 |
| `api/` | 后端 API 调用函数，按业务域分 |
| `store/` | 业务级 Pinia stores (auth / bd-sop) |
| `adapter/` | UI 组件库适配层 (form / vxe-table) |
| `locales/` | 当前项目国际化文案 (zh-CN / en-US) |
| `consts/` | 业务枚举与常量 |

## 架构层级 (数据流方向)

```
Page Component (views/)
    ↓ 调用
API Function (api/)
    ↓ 通过
requestClient (api/request.ts)
    ↓ 经过拦截器链
Backend API
```

```
Page Component
    ↓ 使用
Pinia Store (store/)
    ↓ 调用
API Function
```

## 禁止的依赖方向

- ❌ `packages/` 不能依赖 `playground/`
- ❌ `effects/` 不能依赖业务 views
- ❌ API functions 不能直接操作 DOM
- ❌ 页面组件之间不能互相引用
