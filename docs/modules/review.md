# 审核模块

## 模块职责

Admin 端审核中心，集中处理 BD 提交的各项申请：达人筹备、预算、汇款、公开任务申请。

## 入口文件

- 路由入口: `playground/src/router/routes/modules/review.ts`
- 路由路径前缀: `/review`
- 权限: Admin only

## 子模块

### 1. 达人筹备审核（KOL Prepare Review）

- 列表页: `views/review/kol-prepare/index.vue`
- 详情页: `views/review/kol-prepare/detail.vue` (通过路由参数 `task_id`)
- API: `api/review/kol-prepare.ts`
- 核心操作: Admin 审核 BD 提交的达人筹备表 → 通过/驳回

### 2. 预算审核（Budget Review）

- 列表页: `views/review/budget/index.vue`
- API: `api/review/budget.ts`
- 核心操作: Admin 审核 BD 在 SOP 建联阶段提交的预算申请 → 通过/驳回

### 3. 汇款审核（Remittance Review）

- 列表页: `views/review/remittance/index.vue`
- API: `api/review/remittance.ts`
- 核心操作: Admin 审核 BD 在 SOP 汇款阶段提交的汇款申请 → 通过/驳回

### 4. 公开任务申请审核（Public Task Applications）

- 列表页: `views/review/public-task-applications/index.vue`
- API: `api/review/public-task-application.ts`
- 核心操作: Admin 审核 BD 对公开任务的参与申请 → 通过/驳回

## 共享组件

- `views/review/shared/dateRange.ts` — 日期范围组件
- `views/review/shared/useAdminBdSelect.ts` — BD 选择器 composable

## 外部依赖

- `@vben/request` — RequestClient
- `@vben/stores` — useAccessStore
- `ant-design-vue` — UI 组件库

## 关联模块

- [[docs/modules/bd|BD 模块]] — BD 提交申请，Admin 在此审核
- [[docs/business/sop-workflow|SOP 流程]] — 预算审核和汇款审核是 SOP 流程的关键审批节点
