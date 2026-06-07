# 架构决策记录

## 决策 1: 框架选择 — Vue Vben Admin

- **背景**: 需要企业级管理后台框架
- **决策**: 选用 Vben Admin Pro v5.7 (Vue 3 + TypeScript)
- **理由**: 成熟的 monorepo 架构、完善的权限系统、丰富的 UI 组件集成
- **权衡**: 框架升级需要跟进上游 breaking changes

## 决策 2: 无中间 Service 层

- **背景**: 项目不引入额外的 Service 抽象层
- **决策**: API 函数由 View 或 Store 直接调用
- **理由**: 请求层已通过 `requestClient` 拦截器统一处理认证/错误/BigInt 解析，当前业务复杂度无需额外 Service 层
- **权衡**: 未来如果出现跨页面的复杂数据组装逻辑，可能在 `api/` 层增加 orchestration 函数

## 决策 3: JSON BigInt 解析

- **背景**: 后端返回的数据中部分 ID 为 64 位整数
- **决策**: 使用 `json-bigint` 库在 `transformResponse` 中统一解析（`storeAsString: true`）
- **理由**: JavaScript 原生无法安全处理 64 位整数
- **影响**: 所有 API 响应中的 BigInt 字段以字符串形式传递

## 决策 4: 双角色权限模型

- **背景**: 系统需要同时支持管理员（Admin）和达人运营（BD）两类用户
- **决策**: 基于角色的路由级权限控制（`meta.authority`），动态生成菜单和路由
- **理由**: 两类角色关注的模块完全不同，路由级隔离最简洁
- **影响**: 新增模块时必须明确指定 `authority` 字段

## 决策 5: SOP 状态缓存

- **背景**: BD 在 SOP 各阶段切换时需要保持当前操作的 SOP 上下文
- **决策**: 使用 Pinia Store (`useBDSopStore`) + sessionStorage 缓存当前 SOP
- **理由**: 页面刷新后仍需保持上下文，但不需要跨会话持久化
- **影响**: 页面切换和刷新 SOP 详情页时自动恢复上次选中的 SOP

## 决策 6: requestClient 的单例模式

- **背景**: 需要统一的请求处理
- **决策**: `createRequestClient()` 创建单例，统一配置 `responseReturn: 'data'`
- **理由**: 所有 API 调用共享同一套拦截器链（认证/Token 刷新/错误处理）

## 决策 7: 达人筹备与任务解绑 + 新增达人池

- **日期**: 2026-06-07
- **背景**: 原有达人筹备（`kol_bd_prepare`）与任务（`task_bd_relation`）强绑定，BD 必须通过任务入口才能管理筹备达人，且需要 Admin 审核。新需求要求筹备模块独立，并新增公共达人池。
- **决策**:
  1. `kol_bd_prepare` 表移除 `task_id` 字段，BD 可独立管理自己的筹备记录
  2. 筹备流程不再经过 Admin 审核（移除 `status` 字段和审核接口）
  3. 新增 `kol_pool` 表作为公共达人资源池（来源：离职 BD 释放 + Admin 上传）
  4. BD 可从达人池认领达人到自己筹备列表
  5. 前端路由调整：`/bd/my-task/:task_id`（隐藏路由）→ `/bd/kol-prepare`（独立菜单页）
- **影响**:
  - 删除: `views/review/kol-prepare/`、`api/review/kol-prepare.ts`、`consts/bd-sop.ts` 中的 `KoaPrepareAuditStatus`
  - 新增: `views/bd/kol-prepare/`、`views/bd/kol-pool/`、`views/admin/kol-pool/`
  - 新增 API: `api/bd/kol-prepare.ts`、`api/bd/kol-pool.ts`、`api/admin/kol-pool.ts`、`api/admin/kol-prepare.ts`
  - 更新: `api/bd/bd-my-task.ts`（移除旧 prepare 函数）、`api/bd/kol.ts`（校验不再需要 task_id）、路由 `bd.ts`/`review.ts`/`kol.ts`
  - 文档: 更新 `module-map.md`、`modules/bd.md`、`modules/review.md`、`dependency.md`、`business/task-lifecycle.md`
