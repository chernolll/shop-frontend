# Current State

Vue 3 + TypeScript + Vben Admin 5.x。电商 BD 管理系统前端。

## 路由全景

### BD 模块 (`/bd`) — BD 和 ADMIN 共用入口

| 路由 | 视图 | 角色 | 行数 | 状态 |
| --- | --- | --- | --- | --- |
| `/bd/analytics` | `views/bd/analytics/index.vue` | BD | 1058 | ✅ 暗色模式+动画 |
| `/bd/public-tasks` | `views/bd/public-tasks/index.vue` | BD | 280+ | ✅ 申请参与功能 |
| `/bd/tasks` | `views/bd/tasks/index.vue` | ADMIN | 895 | ✅ |
| `/bd/my-tasks` | `views/bd/my-tasks/index.vue` | BD | 461 | ✅ |
| `/bd/kols` | `views/bd/kols/index.vue` | BD | 500+ | ✅ 支持多方式上传 |
| `/bd/videos` | `views/bd/videos/index.vue` | BD | 368 | ✅ |
| `/bd/my-task/:task_id` | `views/bd/my-tasks/kol-prepare.vue` | BD | 1217 | ✅ 隐藏路由 |
| `/bd/sop/list` | `views/bd/sop/index.vue` | BD | 310 | ✅ |
| `/bd/sop/:sop_id` | `views/bd/sop/detail/index.vue` | BD | 304 | ✅ 隐藏路由 |

> 注意：`/bd/workspace` 和 `/bd/task-progress` 文件存在（均为 5 行占位），但路由 **未注册**。

### KOL 模块 (`/kol`) — ADMIN 专用

| 路由             | 视图                      | 行数              |
| ---------------- | ------------------------- | ----------------- |
| `/kol/list`      | `views/kol/index.vue`     | 893               |
| `/kol/candidate` | `views/kol/candidate.vue` | 235 ✅ 筹备表视图 |
| `/kol/:kol_id`   | `views/kol/detail.vue`    | 270 隐藏路由      |

### 商品模块 (`/product`) — ADMIN 专用

| 路由               | 视图                              | 行数 |
| ------------------ | --------------------------------- | ---- |
| `/product/sku`     | `views/product/sku/index.vue`     | 548  |
| `/product/listing` | `views/product/listing/index.vue` | 493  |

### 审核模块 (`/review`) — ADMIN 专用

| 路由 | 视图 | 行数 |
| --- | --- | --- | --- |
| `/review/kol-prepare` | `views/review/kol-prepare/index.vue` | 850+ | ✅ 审核状态列前置固定 + 已审核禁用按钮 |
| `/review/kol-prepare/:task_id` | `views/review/kol-prepare/detail.vue` | 70 隐藏路由 |
| `/review/budget` | `views/review/budget/index.vue` | 612 |
| `/review/sample` | `views/review/sample/index.vue` | 1180+ | ✅ 含导出订单表格 + 同步物流单号 |
| `/review/remittance` | `views/review/remittance/index.vue` | 1380+ | ✅ 修复附件图片显示为 base64 的问题 |
| `/review/public-task-applications` | `views/review/public-task-applications/index.vue` | 300+ |

### 视频模块 + 系统管理 — ADMIN 专用

| 路由                  | 视图                                | 行数 |
| --------------------- | ----------------------------------- | ---- |
| `/video/list`         | `views/video/index.vue`             | 523  |
| `/system/departments` | `views/system/department/index.vue` | 293  |
| `/system/employees`   | `views/system/employee/index.vue`   | 716  |
| `/system/bd-persons`  | `views/system/bd-person/index.vue`  | 385  |

> 旧版文件 `views/system/dept/`、`role/`、`menu/` 代码仍在但路由已废弃。

## 路由模块文件

- `playground/src/router/routes/modules/bd.ts` — BD 模块（analytics/tasks/my-tasks/kols/videos/sop）
- `playground/src/router/routes/modules/kol.ts` — KOL 管理
- `playground/src/router/routes/modules/product.ts` — 商品管理
- `playground/src/router/routes/modules/review.ts` — 审核模块
- `playground/src/router/routes/modules/video.ts` — 视频管理
- `playground/src/router/routes/modules/system.ts` — 系统管理

## SOP 详情现状

后端已提供 SOP 各阶段详情 API（`GET /bd/sop/contact`、`/sample`、`/video`、`/remittance/detail`），详情页当前混用 store 缓存（列表行数据）+ 后端 API。直接新标签访问 `/bd/sop/:sop_id` 仍有部分数据依赖 store 兜底。

SOP 状态枚举：`0 CONTACT → 1 SAMPLE → 2 RECOVER → 3 COMPLETED → 4 REMITTANCE → 5 TERMINATED`

步骤条：终止不是 step，是独立状态。有预算才显示 REMITTANCE 步骤。

## API 层文件

```
api/
├── core/          # auth, user, menu, timezone, file
├── bd/            # index, bd-my-task, kol, sop, tasks, video
├── kol/           # index, useAdminKolBdSelect
├── product/       # index
├── review/        # index, kol-prepare, budget, sample, remittance
├── system/        # admin-bd-person, admin-department, admin-employee, admin-post (+ 旧版 dept/role/menu)
└── video/         # index
```

## Store

- `store/auth.ts` — 认证状态
- `store/bd-sop.ts` — SOP 列表跳详情时的当前行缓存（sessionStorage 兜底）

## 建议阅读顺序

1. `docs/crrent-state.md`（本文件）
2. 与当前任务相关的页面 / API 文件
3. 若涉及业务背景再补读 `docs/flows.md`、`docs/database.md`
