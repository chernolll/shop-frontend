# 🧩 模块划分（Modules）

## 一、模块总览

| 模块         | 路由前缀               | 角色  | 状态              |
| ------------ | ---------------------- | ----- | ----------------- |
| BD 工作台    | `/bd/analytics`        | BD    | ⬜ 占位           |
| 任务管理     | `/bd/tasks`            | ADMIN | ✅ 已实现         |
| 我的任务     | `/bd/my-tasks`         | BD    | ✅ 已实现         |
| BD 达人列表  | `/bd/kols`             | BD    | ✅ 已实现         |
| BD 视频列表  | `/bd/videos`           | BD    | ✅ 已实现         |
| 达人筹备详情 | `/bd/my-task/:task_id` | BD    | ✅ 已实现（隐藏） |
| SOP 管理     | `/bd/sop`              | BD    | ✅ 已实现         |
| 任务进度     | `/bd/task-progress`    | ALL   | ⬜ 占位           |
| KOL 管理     | `/kol`                 | ADMIN | ✅ 已实现         |
| 商品管理     | `/product`             | ADMIN | ✅ 已实现         |
| 审核管理     | `/review`              | ADMIN | ✅ 已实现         |
| 视频管理     | `/video`               | ADMIN | ✅ 已实现         |
| 系统管理     | `/system`              | ADMIN | ✅ 已实现         |

## 二、BD 模块（核心业务）

路由文件：`playground/src/router/routes/modules/bd.ts`

### 2.1 工作台 (`/bd/analytics`)

**视图**：`views/bd/analytics/index.vue`  
**角色**：BD  
**说明**：BD 个人/全局数据看板  
**状态**：⬜ 占位

### 2.2 任务管理 (`/bd/tasks`)

**视图**：`views/bd/tasks/index.vue`（851行）  
**API**：`api/bd/tasks.ts`  
**角色**：ADMIN  
**说明**：管理员创建任务、选择商品链接、分配BD、设定佣金/视频数/截止日期、废弃任务  
**关联表**：`task_main`、`task_bd_relation`、`product_listing`  
**状态**：✅ 已实现

### 2.3 我的任务 (`/bd/my-tasks`)

**视图**：`views/bd/my-tasks/index.vue` + `data.ts`  
**API**：`api/bd/index.ts` → `GET /bd/my-tasks`  
**角色**：BD  
**说明**：BD 视角的任务列表，展示分配给当前 BD 的任务及筹备进度

**已实现的表格列**：

- 商品信息（图片 + 名称）
- 店铺（名称 + 平台 + 国家）
- 佣金
- 我的任务量（myVideoNum / totalVideoNum）
- 筹备进度（进度条：已通过/任务量）
- 筹备状态（Tag：未开始/筹备中/部分通过/已完成）
- 截止时间
- 操作（上传筹备表、查看达人）

**筹备状态枚举**（`PrepareStatus`）：

| 值            | 含义     |
| ------------- | -------- |
| `NOT_STARTED` | 未开始   |
| `IN_PROGRESS` | 筹备中   |
| `PARTIAL`     | 部分通过 |
| `DONE`        | 已完成   |

**状态**：✅ 已实现

### 2.4 BD 达人列表 (`/bd/kols`)

**视图**：`views/bd/kols/index.vue`（444行）  
**角色**：BD  
**说明**：BD 视角的达人列表，支持搜索、筛选、分页  
**状态**：✅ 已实现

### 2.5 BD 视频列表 (`/bd/videos`)

**视图**：`views/bd/videos/index.vue`（368行）  
**API**：`api/bd/video.ts`  
**角色**：BD  
**说明**：BD 视角查看视频产出，含 GMV、播放量等字段筛选  
**状态**：✅ 已实现

### 2.6 达人筹备详情 (`/bd/my-task/:task_id`)

**视图**：`views/bd/my-tasks/kol-prepare.vue`  
**API**：`api/bd/bd-my-task.ts`、`api/bd/kol.ts`  
**角色**：BD  
**说明**：上传解析 Excel、校验达人、编辑/删除/添加行、提交筹备、查看提交记录  
**状态**：✅ 已实现（隐藏路由）

### 2.7 SOP 管理 (`/bd/sop`)

**子路由**：

| 路由 | 视图 | 说明 |
| --- | --- | --- |
| `/bd/sop/list` | `views/bd/sop/index.vue` | SOP 列表页 |
| `/bd/sop/:sop_id` | `views/bd/sop/detail/index.vue` | SOP 详情页（hideInMenu） |

**说明**：SOP 执行主模块，BD 在此完成建联→送样→回收视频→汇款→结束的全流程操作

**详情页面板**：

| 组件                     | 大小   | 说明                                    |
| ------------------------ | ------ | --------------------------------------- |
| `SopSteps.vue`           | 247行  | 可点击自定义步骤条                      |
| `SopStepContent.vue`     | 233行  | 步骤内容容器                            |
| `SopContactPanel.vue`    | 498行  | 建联：联系信息 + 预算 + 预算审核        |
| `SopSamplePanel.vue`     | 844行  | 送样：样品申请 + 地址 + 跟踪号 + 审核   |
| `SopVideoPanel.vue`      | 497行  | 回收视频：链接 + 评分 + 播放量 + GMV    |
| `SopRemittancePanel.vue` | 1105行 | 汇款：金额 + 聊天截图 + 汇款截图 + 审核 |

**关联表**：`task_sop`、`sop_contact`、`sample_application`、`video`、`sop_remittance`  
**状态**：✅ 已实现（含完整表单和审核流程）

### 2.8 任务进度 (`/bd/task-progress`)

**视图**：`views/bd/task-progress/index.vue`  
**说明**：全局任务进度看板  
**状态**：⬜ 占位

## 三、KOL 模块

路由文件：`playground/src/router/routes/modules/kol.ts`  
**角色**：ADMIN

| 路由 | 视图 | 说明 | 状态 |
| --- | --- | --- | --- |
| `/kol/list` | `views/kol/index.vue`（884行） | 达人管理列表 | ✅ 已实现 |
| `/kol/:kol_id` | `views/kol/detail.vue`（270行） | 达人详情（隐藏） | ✅ 已实现 |

**API**：`api/kol/index.ts`、`api/kol/useAdminKolBdSelect.ts`  
**关联表**：`kol`、`bd_person`  
**功能**：达人 CRUD、BD 绑定、状态管理（正常/流失/黑名单）、粉丝数等属性管理

## 四、商品管理模块

路由文件：`playground/src/router/routes/modules/product.ts`  
**角色**：ADMIN

| 路由 | 视图 | 说明 | 状态 |
| --- | --- | --- | --- |
| `/product/sku` | `views/product/sku/index.vue`（539行） | SKU 管理 | ✅ 已实现 |
| `/product/listing` | `views/product/listing/index.vue`（484行） | 商品链接管理 | ✅ 已实现 |

**API**：`api/product/index.ts`  
**关联表**：`product_sku`、`product_listing`、`shop`  
**共享组件**：`views/product/shared/useAdminMainSkuSelect.ts`  
**功能**：SKU 的 CRUD（单品/组合SKU）、商品链接（铺货）的 CRUD

## 五、审核模块

路由文件：`playground/src/router/routes/modules/review.ts`  
**角色**：ADMIN

| 路由 | 视图 | 说明 | 状态 |
| --- | --- | --- | --- |
| `/review/kol-prepare` | `views/review/kol-prepare/index.vue`（832行） | 达人筹备审核列表 | ✅ 已实现 |
| `/review/kol-prepare/:task_id` | `views/review/kol-prepare/detail.vue`（70行） | 筹备审核详情（隐藏） | ✅ 已实现 |
| `/review/budget` | `views/review/budget/index.vue`（597行） | 预算审核列表 | ✅ 已实现 |
| `/review/sample` | `views/review/sample/index.vue`（926行） | 样品审核列表 | ✅ 已实现 |
| `/review/remittance` | `views/review/remittance/index.vue`（1370行） | 汇款审核列表 | ✅ 已实现 |

**API**：`api/review/kol-prepare.ts`、`budget.ts`、`sample.ts`、`remittance.ts`  
**关联表**：`kol_bd_prepare`、`kol_bd_prepare_audit`、`sop_budget_audit`、`sop_remittance_audit`  
**共享组件**：`views/review/shared/useAdminBdSelect.ts`、`views/review/shared/dateRange.ts`  
**功能**：各类 ADMIN 审核流程的列表展示和审批操作

## 六、视频管理模块

路由文件：`playground/src/router/routes/modules/video.ts`  
**角色**：ADMIN

| 路由          | 视图                             | 说明         | 状态      |
| ------------- | -------------------------------- | ------------ | --------- |
| `/video/list` | `views/video/index.vue`（523行） | 全局视频管理 | ✅ 已实现 |

**API**：`api/video/index.ts`  
**关联表**：`video`、`task_sop`、`kol`  
**功能**：Admin 视角全局视频管理，支持多维度筛选（GMV、播放量、评分、上传时间等）

## 七、系统管理模块

路由文件：`playground/src/router/routes/modules/system.ts`  
**角色**：ADMIN  
**状态**：✅ 已从注释状态激活，路由已更新为新版实现

| 路由 | 视图 | 说明 | 状态 |
| --- | --- | --- | --- |
| `/system/departments` | `views/system/department/index.vue`（286行） | 部门管理 | ✅ 已实现 |
| `/system/employees` | `views/system/employee/index.vue`（707行） | 员工管理 | ✅ 已实现 |
| `/system/bd-persons` | `views/system/bd-person/index.vue`（376行） | BD 人员管理 | ✅ 已实现 |

**API**：`api/system/admin-department.ts`、`admin-employee.ts`、`admin-bd-person.ts`、`admin-post.ts`  
**关联表**：`department`、`employee`、`post`、`bd_person`  
**共享组件**：`views/system/shared/useAdminDepartmentSelect.ts`、`useAdminEmployeeSelect.ts`、`useAdminPostSelect.ts`

> 注意：`views/system/dept/`、`views/system/role/`、`views/system/menu/` 为旧版实现文件，代码仍在但路由已不再指向它们。新的系统管理模块使用独立的路由和视图（`department/employee/bd-person`）。

## 八、核心共享模块

### 8.1 认证模块

**Store**：`store/auth.ts`  
**API**：`api/core/auth.ts`、`api/core/user.ts`  
**流程**：login → 获取 token → 获取用户信息 → 获取权限码 → 路由跳转  
**角色枚举**：`consts/role.ts` → `ADMIN | BD`

### 8.2 动态路由

**机制**：前端路由 + 后端菜单（通过 `accessCodes` 控制可见性）  
**辅助函数**：`packages/utils/src/helpers/generate-routes-backend.ts`  
**路由守卫**：`router/guard.ts`

### 8.3 布局

**布局类型**：

- `layouts/basic.vue` — 主布局（侧边栏 + 顶栏 + 内容区）
- `layouts/auth.vue` — 认证布局（登录页）

**共享布局组件**（`packages/effects/layouts`）：

- 标签栏（tabbar）
- 面包屑（breadcrumb）
- 语言切换（language-toggle）
- 布局切换（layout-toggle）
- 认证页面（authentication）

## 九、API 层结构

```
api/
├── core/              # 通用接口
│   ├── auth.ts        # 登录/登出
│   ├── user.ts        # 用户信息
│   ├── menu.ts        # 菜单/权限
│   ├── timezone.ts    # 时区
│   └── file.ts        # 文件上传
├── bd/
│   ├── index.ts       # BD 我的任务列表
│   ├── bd-my-task.ts  # 达人筹备（上传/校验/提交记录）
│   ├── kol.ts         # 达人校验
│   ├── sop.ts         # SOP 列表
│   ├── tasks.ts       # Admin 任务 CRUD + 商品链接 + BD列表
│   └── video.ts       # BD 视频列表
├── kol/
│   ├── index.ts       # KOL CRUD
│   └── useAdminKolBdSelect.ts
├── product/
│   └── index.ts       # SKU + 商品链接 CRUD
├── review/
│   ├── index.ts
│   ├── kol-prepare.ts  # 达人筹备审核
│   ├── budget.ts       # 预算审核
│   ├── sample.ts       # 样品审核
│   └── remittance.ts   # 汇款审核
├── system/
│   ├── index.ts
│   ├── admin-bd-person.ts    # BD人员管理
│   ├── admin-department.ts   # 部门管理
│   ├── admin-employee.ts     # 员工管理
│   ├── admin-post.ts         # 岗位管理
│   ├── dept.ts               # 旧版部门（路由已废弃）
│   ├── role.ts               # 旧版角色（路由已废弃）
│   └── menu.ts               # 旧版菜单（路由已废弃）
├── video/
│   └── index.ts       # 视频管理（Admin视角）
└── examples/          # 示例代码（参考用）
```

## 十、开发完成度总结

**✅ 已完成**：

- BD 我的任务 + 达人筹备表
- BD 任务管理（Admin 创建/分配/废弃）
- BD SOP 全流程（建联/送样/回收视频/汇款/终止，含 ADMIN 审核）
- BD 达人/视频列表
- KOL 达人管理（Admin）
- 商品管理（SKU + 商品链接）
- ADMIN 审核模块（筹备审核/预算审核/样品审核/汇款审核）
- 视频管理（Admin 全局视角）
- 系统管理（部门/员工/BD人员）

**⬜ 占位**：

- BD 工作台 (`/bd/analytics`)
- 任务进度 (`/bd/task-progress`)
