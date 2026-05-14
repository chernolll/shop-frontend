# Current State

## 项目定位

- 项目是电商 BD 管理系统前端，基于 `Vue 3 + TypeScript + Vben Admin 5.x`。
- 当前高频开发区已从 `playground/src/views/bd` 扩展到多个模块。

## 当前路由全景

### BD 模块 (`/bd`) — BD 和 ADMIN 共用入口

| 路由 | 视图 | 角色 | 状态 |
| --- | --- | --- | --- |
| `/bd/analytics` | `views/bd/analytics/index.vue` | BD | ⬜ 占位（5行） |
| `/bd/tasks` | `views/bd/tasks/index.vue` | ADMIN | ✅ 已实现（851行） |
| `/bd/my-tasks` | `views/bd/my-tasks/index.vue` | BD | ✅ 已实现 |
| `/bd/kols` | `views/bd/kols/index.vue` | BD | ✅ 已实现（444行） |
| `/bd/videos` | `views/bd/videos/index.vue` | BD | ✅ 已实现（368行） |
| `/bd/my-task/:task_id` | `views/bd/my-tasks/kol-prepare.vue` | BD | ✅ 已实现（隐藏路由） |
| `/bd/sop/list` | `views/bd/sop/index.vue` | BD | ✅ 已实现 |
| `/bd/sop/:sop_id` | `views/bd/sop/detail/index.vue` | BD | ✅ 已实现（隐藏路由） |
| `/bd/task-progress` | `views/bd/task-progress/index.vue` | ALL | ⬜ 占位（5行） |
| `/bd/workspace` | `views/bd/workspace/index.vue` | BD | ⬜ 占位（5行） |

### KOL 模块 (`/kol`) — ADMIN 专用

| 路由           | 视图                   | 状态                         |
| -------------- | ---------------------- | ---------------------------- |
| `/kol/list`    | `views/kol/index.vue`  | ✅ 已实现（884行）           |
| `/kol/:kol_id` | `views/kol/detail.vue` | ✅ 已实现（270行，隐藏路由） |

### 商品模块 (`/product`) — ADMIN 专用

| 路由               | 视图                              | 状态               |
| ------------------ | --------------------------------- | ------------------ |
| `/product/sku`     | `views/product/sku/index.vue`     | ✅ 已实现（539行） |
| `/product/listing` | `views/product/listing/index.vue` | ✅ 已实现（484行） |

### 审核模块 (`/review`) — ADMIN 专用

| 路由 | 视图 | 状态 |
| --- | --- | --- |
| `/review/kol-prepare` | `views/review/kol-prepare/index.vue` | ✅ 已实现（832行） |
| `/review/kol-prepare/:task_id` | `views/review/kol-prepare/detail.vue` | ✅ 已实现（70行，隐藏路由） |
| `/review/budget` | `views/review/budget/index.vue` | ✅ 已实现（597行） |
| `/review/sample` | `views/review/sample/index.vue` | ✅ 已实现（926行） |
| `/review/remittance` | `views/review/remittance/index.vue` | ✅ 已实现（1370行） |

### 视频模块 (`/video`) — ADMIN 专用

| 路由          | 视图                    | 状态               |
| ------------- | ----------------------- | ------------------ |
| `/video/list` | `views/video/index.vue` | ✅ 已实现（523行） |

### 系统管理 (`/system`) — ADMIN 专用（新实现）

| 路由 | 视图 | 状态 |
| --- | --- | --- |
| `/system/departments` | `views/system/department/index.vue` | ✅ 已实现（286行） |
| `/system/employees` | `views/system/employee/index.vue` | ✅ 已实现（707行） |
| `/system/bd-persons` | `views/system/bd-person/index.vue` | ✅ 已实现（376行） |

> 注意：`views/system/dept/`、`views/system/role/`、`views/system/menu/` 为旧版实现，已编译但路由未注册（`system.ts` 路由已改为指向新版 `department/employee/bd-person`）。

## 路由模块文件

- `playground/src/router/routes/modules/bd.ts` — BD 模块
- `playground/src/router/routes/modules/kol.ts` — KOL 管理（新增）
- `playground/src/router/routes/modules/product.ts` — 商品管理（新增）
- `playground/src/router/routes/modules/review.ts` — 审核模块（新增）
- `playground/src/router/routes/modules/video.ts` — 视频管理（新增）
- `playground/src/router/routes/modules/system.ts` — 系统管理（已从注释状态激活，路由结构已更新）
- `playground/src/router/routes/modules/dashboard.ts` — 仪表盘

## API 层文件

```
api/
├── core/          # auth, user, menu, timezone, file
├── bd/
│   ├── bd-my-task.ts   # BD我的任务、达人筹备
│   ├── index.ts        # BD通用
│   ├── kol.ts          # 达人校验
│   ├── sop.ts          # SOP列表
│   ├── tasks.ts        # Admin任务CRUD、商品链接查询、BD列表
│   └── video.ts        # BD视频列表
├── kol/
│   ├── index.ts        # KOL管理CRUD
│   └── useAdminKolBdSelect.ts
├── product/
│   └── index.ts        # SKU + 商品链接管理
├── review/
│   ├── index.ts
│   ├── kol-prepare.ts  # 达人筹备审核
│   ├── budget.ts       # 预算审核
│   ├── sample.ts       # 样品审核
│   └── remittance.ts   # 汇款审核
├── system/
│   ├── admin-bd-person.ts    # BD人员管理
│   ├── admin-department.ts   # 部门管理
│   ├── admin-employee.ts     # 员工管理
│   ├── admin-post.ts         # 岗位管理
│   ├── dept.ts, role.ts, menu.ts  # 旧版（路由已注释）
│   └── index.ts
└── video/
    └── index.ts        # 视频管理（Admin视角）
```

## Store

- `store/auth.ts` — 认证状态
- `store/bd-sop.ts` — SOP 列表跳详情时的当前行缓存（sessionStorage 兜底）

## 我的任务 / 达人筹备表现状

涉及文件：

- `playground/src/views/bd/my-tasks/index.vue`
- `playground/src/views/bd/my-tasks/kol-prepare.vue`
- `playground/src/api/bd/bd-my-task.ts`
- `playground/src/api/bd/kol.ts`

当前逻辑：

- BD 在"我的任务"列表中进入某条任务详情。
- 上传达人筹备 Excel 后，前端解析出 `kol_id`、`kol_link`。
- 再调用 `queryKolPrepareState` 做校验，返回每个达人是否可筹备、原因、状态等。
- 解析结果会在页面表格中展示，支持：
  - 删除行
  - 添加行
  - 编辑 `kol_id` / `kol_link`
  - 前端筛选"校验结果""达人状态"
- 提交筹备时使用 `uploadKolPrepareData`。
- 提交成功后自动切换到"提交记录"标签。
- 提交记录使用 `queryKolPrepareData`，支持分页和筛选。

## SOP 列表 / 详情现状

涉及文件：

- `playground/src/views/bd/sop/index.vue`
- `playground/src/views/bd/sop/detail/index.vue` — 详情容器
- `playground/src/views/bd/sop/detail/SopSteps.vue` — 可点击步骤条（247行）
- `playground/src/views/bd/sop/detail/SopStepContent.vue` — 步骤内容容器（233行）
- `playground/src/views/bd/sop/detail/SopContactPanel.vue` — 建联面板（498行）
- `playground/src/views/bd/sop/detail/SopSamplePanel.vue` — 送样面板（844行）
- `playground/src/views/bd/sop/detail/SopVideoPanel.vue` — 回收视频面板（497行）
- `playground/src/views/bd/sop/detail/SopRemittancePanel.vue` — 汇款面板（1105行）
- `playground/src/store/bd-sop.ts`
- `playground/src/api/bd/sop.ts`

状态枚举：

- `0 CONTACT`
- `1 SAMPLE`
- `2 RECOVER`
- `3 COMPLETED`
- `4 REMITTANCE`
- `5 TERMINATED`

当前详情页实现：

- 步骤条不是直接用默认 `<Steps>` UI，而是自定义的可点击步骤条。
- 终止不是步骤条中的一个 step，而是独立状态。
- 如果 SOP 有预算，步骤条包含 `REMITTANCE`；无预算则跳过该步骤。
- 默认高亮根据当前 SOP 状态决定。
- 如果进入详情时已是 `TERMINATED`：
  - 默认显示第一个 step 的内容区
  - 顶部状态仍显示"终止"
  - 不能再次点击"终止"
  - 可查看终止信息
- 已做暗色/亮色兼容，并处理了多语言下步骤标题换行展示。

SOP 各阶段面板均有完整的表单实现：

- **建联面板** (`SopContactPanel`)：联系信息、预算填写、预算审核（ADMIN）
- **送样面板** (`SopSamplePanel`)：样品申请、地址、跟踪号、审核流程
- **回收视频面板** (`SopVideoPanel`)：视频链接、评分、播放量、GMV
- **汇款面板** (`SopRemittancePanel`)：汇款金额、聊天截图、汇款截图、审核流程

## SOP 状态来源现状

当前 SOP 详情页的数据来源分两层：

1. 路由只传 `sop_id`
2. 列表页点击进入详情前，把整条 SOP 行数据写入 `bd-sop store`

`bd-sop.ts` 的作用：

- 缓存当前点击的 SOP 行数据
- 用 `sessionStorage` 做同 tab 刷新兜底
- 详情页按 `sop_id` 读取对应缓存

注意：

- 这套方案只解决"从列表进入详情时，详情页拿到首屏数据"的问题。
- 还没有真正的 `SOP detail API`。
- 如果用户直接新开标签访问 `/bd/sop/:sop_id`，当前没有完整详情数据兜底，只能靠有限默认值。

## 新增模块现状总结

### BD 任务管理（Admin）— `/bd/tasks`

- 851 行，完整实现
- Admin 创建任务：选择商品链接、设定佣金/视频数/截止日期、选择任务类型、分配 BD
- 支持废弃任务操作
- API：`/api/bd/tasks.ts`（createAdminTask、getAdminTaskList、abandonAdminTask 等）

### BD 达人列表 — `/bd/kols`

- 444 行，完整实现
- BD 视角的达人列表，含搜索筛选、分页

### BD 视频列表 — `/bd/videos`

- 368 行，完整实现
- BD 视角查看视频产出，含 GMV/播放量等字段筛选
- API：`/api/bd/video.ts`

### KOL 管理（Admin）— `/kol`

- 列表页 884 行，详情页 270 行
- Admin 管理全部达人，含 BD 绑定、状态管理等
- API：`/api/kol/index.ts`

### 商品管理（Admin）— `/product`

- SKU 管理 539 行、商品链接管理 484 行
- 共享组件：`useAdminMainSkuSelect.ts`
- API：`/api/product/index.ts`

### 审核模块（Admin）— `/review`

- 达人筹备审核 832 行、预算审核 597 行、样品审核 926 行、汇款审核 1370 行
- 共享组件：`useAdminBdSelect.ts`、`dateRange.ts`
- API：`/api/review/kol-prepare.ts`、`budget.ts`、`sample.ts`、`remittance.ts`
- 筹备审核详情页较简单（70行），可能是轻量展示

### 视频管理（Admin）— `/video`

- 523 行，完整实现
- Admin 视角全局视频管理，支持多维度筛选
- API：`/api/video/index.ts`

### 系统管理 — `/system`

- 新版实现：部门管理（286行）、员工管理（707行）、BD人员管理（376行）
- 旧版文件（role/menu/dept）仍在 `views/system/` 下但路由已不再指向
- 共享组件：`useAdminDepartmentSelect.ts`、`useAdminEmployeeSelect.ts`、`useAdminPostSelect.ts`
- API：`/api/system/admin-department.ts`、`admin-employee.ts`、`admin-bd-person.ts`、`admin-post.ts`

## 已记录但暂未实现的建议

见 `docs/temp.md`。

核心建议：

- 详情页后续应维护独立的 `sopDetail` 本地状态
- 页面内推进流程成功后，应以后端返回的最新数据或重新拉取详情为准
- 不建议前端自己做 `status + 1`

## 新会话建议阅读顺序

1. `docs/README.md`
2. `docs/crrent-state.md`
3. 与当前任务相关的页面 / API 文件
4. 若涉及业务背景，再补读：
   - `docs/flows.md`
   - `docs/database.md`
   - `docs/temp.md`

## 近期最可能继续做的事情

- 给 SOP 详情页补真实 SOP detail API，摆脱仅依赖列表行缓存
- 完善筹备审核详情页（目前仅 70 行）
- BD 工作台 `/bd/analytics` 和任务进度 `/bd/task-progress` 仍为占位
