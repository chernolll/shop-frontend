# 架构规范

> 本节总结现有架构模式，非新增规则。

## 分层原则

```
playground (业务实现)
    ↓ 单向依赖
packages/effects (通用效果)
    ↓ 单向依赖
packages/@core (核心基础)
```

- 上层可依赖下层，下层不可依赖上层
- 同层可互相依赖

## 数据流方向

```
View Component
    ↓ 直接调用
API Function (api/)
    ↓ 通过
requestClient (拦截器链)
    ↓ HTTP
Backend
```

- 无中间 Service 层，API 函数由 View 或 Store 直接调用
- requestClient 统一处理认证、BigInt 解析、错误提示

## Pinia Store 使用规范

- 全局 Store 放 `@vben/stores`（user / access / tabbar）
- 业务 Store 放 `playground/src/store/`（auth / bd-sop）
- Store 使用 Setup Store 语法（`defineStore('id', () => { ... })`）
- Store 可调用 API 函数，但不应被 API 函数依赖

## 路由设计

- 静态路由: `routes/core.ts`（登录/注册/404 等不可移除页面）
- 业务路由: `routes/modules/*.ts`（按模块拆分）
- 动态路由: 由 `generateAccess()` 根据用户角色在运行时过滤
- 隐藏路由: `meta.hideInMenu: true` + `meta.activeMenu` 指向父级

## Composable 使用规范

- UI 相关 composable: `packages/effects/hooks/`（useTabs / useWatermark 等）
- 核心 composable: `packages/@core/composables/`（useNamespace / useSortable）
- 业务 composable: `playground/src/views/<module>/shared/`（useAdminXxxSelect 等）

## 禁止的依赖方向

- ❌ `packages/*` → `playground/*`
- ❌ View → View（页面间不能相互 import）
- ❌ API → Component / Store
- ❌ `@core/base` → `effects`

## 模块注册模式

- Vue 插件/指令/组件统一在 `bootstrap.ts` 中注册
- 启动顺序: 适配器 → i18n → Store → 路由 → 挂载
