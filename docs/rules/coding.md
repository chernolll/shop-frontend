# 编码规范

> 本节规约均来源于项目现有代码模式，非新增规则。

## 命名规范

| 对象 | 规范 | 示例 |
| --- | --- | --- |
| 文件/目录 | kebab-case | `user-service.ts` / `my-tasks/` |
| Vue 组件文件 | kebab-case | `kol-prepare.vue` |
| Vue 组件 name | PascalCase | `SopContactPanel` |
| TypeScript 变量/函数 | camelCase | `getUserInfo` / `loginLoading` |
| TypeScript 接口/类型 | PascalCase | `UserInfo` / `BdTaskApi.ListParams` |
| TypeScript 枚举 | PascalCase | `RoleEnum` / `BDSopApi.Status` |
| 常量 | UPPER_SNAKE_CASE | `BD_CURRENT_SOP_STORAGE_KEY` |
| Pinia Store | `use[Xxx]Store` | `useAuthStore` / `useBDSopStore` |
| Composable | `use[Xxx]` | `useAdminBdSelect` / `useAdminDepartmentSelect` |

## 目录结构

- `views/<module>/` — 页面组件按业务模块分组
- `views/<module>/modules/` — 模块内部私有组件
- `views/<module>/shared/` — 模块间共享 composable
- `api/<domain>/` — API 函数按业务域分组
- `store/` — 全局 Pinia Store（非 `@vben/stores` 的业务 Store）

## TypeScript 规范

- 严格模式 `strict: true`
- 所有 API 返回类型必须通过 namespace 显式声明（如 `BDSopApi.ListResult`）
- 所有 API 函数返回值使用泛型约束：`requestClient.get<Type>(...)`
- 接口参数按 `Params` / `Result` / `Item` 命名约定
- 枚举值使用数字型（与后端协议匹配）
- Props/Emits 使用 `<script setup lang="ts">` + 泛型声明

## Vue 组件规范

- 语法: `<script setup lang="ts">`（全项目统一）
- 样式: 优先 Tailwind CSS 工具类；复杂场景用 `<style scoped>`
- Props: `defineProps<{ list: Item[] }>()`
- Emits: `defineEmits<{ (e: 'select', id: string): void }>()`
- 组件引入: 通过 `#/views/` alias
- 复杂逻辑抽取到 composable（`useXxx`）而非 mixin

## Import 规范

- 别名: `#/` → `playground/src/` ; `@vben/` → packages
- 顺序: 第三方库 → `@vben/*` → `#/*` → 相对路径
- 通过 OXC + ESLint 自动排序（`editor.codeActionsOnSave`）

## API 调用规范

- 所有 API 通过 `api/request.ts` 的 `requestClient` 实例调用
- API 函数签名: `export async function verbNoun(params/to)`
- Namespace 组织类型: `export namespace XxxApi { ... }`
- 参数直接传递（非 FormData 包装）
- 响应通过拦截器自动解包 (`responseReturn: 'data'`)

## 错误处理规范

- Token 过期: `authenticateResponseInterceptor` 自动刷新或跳登录
- 通用错误: `errorMessageResponseInterceptor` 弹出 `message.error`
- 业务错误码: 由组件自行处理 `response.code` 判断
