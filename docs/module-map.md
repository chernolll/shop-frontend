# 模块地图

## 角色定义

| 角色 | 标识 | 权限范围 |
|------|------|---------|
| Admin | `admin` | 系统管理 + 审核 + KOL/商品/店铺管理 + 任务管理 |
| BD | `bd` | 达人库 + 任务执行 + SOP 流程 + 数据分析 |

## 路由 → 组件 → API 映射

### BD 端（`/bd`）

| 路由路径 | 页面组件 | API 模块 | 说明 |
|---------|---------|---------|------|
| `/bd/analytics` | `views/bd/analytics/index.vue` | `api/bd/bd-my-task.ts` (`getBDAnalytics`) | 数据看板 |
| `/bd/tasks` | `views/bd/tasks/index.vue` | `api/bd/tasks.ts` | Admin 任务管理 |
| `/bd/public-tasks` | `views/bd/public-tasks/index.vue` | `api/bd/bd-my-task.ts` (`getBDPublicTaskList`) | 公开任务广场 |
| `/bd/my-tasks` | `views/bd/my-tasks/index.vue` | `api/bd/bd-my-task.ts` (`getBdTaskList`) | 我的任务 |
| `/bd/my-task/:task_id` | `views/bd/my-tasks/kol-prepare.vue` | `api/bd/bd-my-task.ts` (`uploadKolPrepareData`) | 达人筹备表（隐藏路由） |
| `/bd/kols` | `views/bd/kols/index.vue` | `api/bd/kol.ts` (`getBdKolList`) | 达人候选池 |
| `/bd/kol-library` | `views/bd/kol-library/index.vue` | `api/bd/kol.ts` (`getBdKolLibraryList`) | 达人库 |
| `/bd/videos` | `views/bd/videos/index.vue` | `api/bd/video.ts` (`getBdVideoList`) | 视频列表+打分 |
| `/bd/sop/list` | `views/bd/sop/index.vue` | `api/bd/sop.ts` (`getBDSopList`) | SOP 工作流列表 |
| `/bd/sop/:sop_id` | `views/bd/sop/detail/index.vue` | `api/bd/sop.ts` (全部接口) | SOP 详情（建联→送样→视频→汇款） |

### Review 审核端（`/review`，Admin）

| 路由路径 | 页面组件 | API 模块 |
|---------|---------|---------|
| `/review/kol-prepare` | `views/review/kol-prepare/index.vue` | `api/review/kol-prepare.ts` |
| `/review/kol-prepare/:task_id` | `views/review/kol-prepare/detail.vue` | `api/review/kol-prepare.ts` |
| `/review/budget` | `views/review/budget/index.vue` | `api/review/budget.ts` |
| `/review/remittance` | `views/review/remittance/index.vue` | `api/review/remittance.ts` |
| `/review/public-task-applications` | `views/review/public-task-applications/index.vue` | `api/review/public-task-application.ts` |

### KOL 管理端（`/kol`，Admin）

| 路由路径 | 页面组件 | API 模块 |
|---------|---------|---------|
| `/kol/list` | `views/kol/index.vue` | `api/kol/index.ts` |
| `/kol/candidate` | `views/kol/candidate.vue` | `api/kol/index.ts` |
| `/kol/:kol_id` | `views/kol/detail.vue` | `api/kol/index.ts` |

### 系统管理端（`/system`，Admin）

| 路由路径 | 页面组件 | API 模块 |
|---------|---------|---------|
| `/system/departments` | `views/system/department/index.vue` | `api/system/admin-department.ts` |
| `/system/employees` | `views/system/employee/index.vue` | `api/system/admin-employee.ts` |
| `/system/bd-persons` | `views/system/bd-person/index.vue` | `api/system/admin-bd-person.ts` |

### 商品/店铺/视频/样品（Admin）

| 路由路径 | 页面组件 | API 模块 |
|---------|---------|---------|
| `/product/sku` | `views/product/sku/index.vue` | `api/product/index.ts` |
| `/product/listing` | `views/product/listing/index.vue` | `api/product/index.ts` |
| `/shop/list` | `views/system/shop/index.vue` | `api/system/admin-shop.ts` |
| `/video/list` | `views/video/index.vue` | `api/video/index.ts` |
| `/sample/dashboard` | `views/sample/dashboard/index.vue` | `api/review/sample.ts` |
| `/sample/list` | `views/sample/list/index.vue` | `api/review/sample.ts` |

## Pinia Store 清单

| Store | 文件 | 作用域 |
|-------|------|--------|
| `useAuthStore` | `store/auth.ts` | 登录/登出/获取用户信息 |
| `useBDSopStore` | `store/bd-sop.ts` | 当前选中的 SOP 及其 sessionStorage 缓存 |
| `useAccessStore` | `@vben/stores` | access token / 权限码 / 动态路由 |
| `useUserStore` | `@vben/stores` | 用户基本信息 |
