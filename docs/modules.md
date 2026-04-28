# 🧩 模块划分（Modules）

## 一、模块总览

| 模块      | 路由前缀            | 角色      | 状态      |
| --------- | ------------------- | --------- | --------- |
| BD 工作台 | `/bd/analytics`     | ADMIN, BD | ✅ 已创建 |
| 任务管理  | `/bd/tasks`         | ADMIN     | ✅ 已创建 |
| 我的任务  | `/bd/my-tasks`      | BD        | ✅ 已实现 |
| 任务进度  | `/bd/task-progress` | ALL       | ⬜ 占位   |
| SOP 管理  | `/bd/sop`           | ALL       | ⬜ 占位   |
| 系统管理  | `/system`           | ADMIN     | ⬜ 注释中 |

## 二、BD 模块（核心业务）

路由文件：`playground/src/router/routes/modules/bd.ts`

### 2.1 工作台 (`/bd/analytics`)

**视图**：`views/bd/analytics/index.vue`  
**角色**：ADMIN, BD  
**说明**：BD 个人/全局数据看板，展示任务统计、GMV 趋势等  
**状态**：⬜ 占位

### 2.2 任务管理 (`/bd/tasks`)

**视图**：`views/bd/tasks/index.vue`  
**角色**：ADMIN  
**说明**：管理员视角的任务 CRUD，包括创建任务、分配 BD、设置佣金/截止日期/视频数量  
**关联表**：`task_main`, `task_bd_relation`, `product_listing`  
**状态**：⬜ 占位

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

**筹备状态枚举**（`PrepareStatus`）：| 值 | 含义 | |----|------| | `NOT_STARTED` | 未开始 | | `IN_PROGRESS` | 筹备中 | | `PARTIAL` | 部分通过 | | `DONE` | 已完成 |

**状态**：✅ 已实现

### 2.4 任务进度 (`/bd/task-progress`)

**视图**：`views/bd/task-progress/index.vue`  
**说明**：全局任务进度看板，按任务/BD 维度查看 SOP 执行进度  
**状态**：⬜ 占位

### 2.5 SOP 管理 (`/bd/sop`)

**子路由**：

| 路由 | 视图 | 说明 |
| --- | --- | --- |
| `/bd/sop/list` | `views/bd/sop/index.vue` | SOP 列表页 |
| `/bd/sop/detail/:id` | `views/bd/sop/detail/index.vue` | SOP 详情页（hideInMenu） |

**说明**：SOP 执行主模块，BD 在此完成建联→送样→回收视频的全流程操作  
**关联表**：`task_sop`, `sop_contact`, `sample_application`, `video`  
**状态**：⬜ 占位

### 2.6 BD 工作区 (`/bd/workspace`)

**视图**：`views/bd/workspace/index.vue`  
**说明**：BD 个人工作区（不在当前路由表中，独立页面）  
**状态**：⬜ 占位

## 三、系统管理模块

路由文件：`playground/src/router/routes/modules/system.ts`  
**状态**：⚠️ 路由已注释，代码已实现但暂未启用

### 3.1 角色管理 (`/system/role`)

**视图**：`views/system/role/list.vue` + `modules/form.vue` + `data.ts`  
**API**：`api/system/role.ts`  
**关联表**：`sys_role`, `sys_role_permission`  
**状态**：⬜ 路由已注释

### 3.2 菜单管理 (`/system/menu`)

**视图**：`views/system/menu/list.vue` + `modules/form.vue` + `data.ts`  
**API**：`api/system/menu.ts`  
**关联表**：`sys_permission`  
**说明**：树形菜单/权限管理，支持菜单、按钮、接口三类权限  
**状态**：⬜ 路由已注释

### 3.3 部门管理 (`/system/dept`)

**视图**：`views/system/dept/list.vue` + `modules/form.vue` + `data.ts`  
**API**：`api/system/dept.ts`  
**关联表**：`department`  
**状态**：⬜ 路由已注释

## 四、核心共享模块

### 4.1 认证模块

**Store**：`store/auth.ts`  
**API**：`api/core/auth.ts`, `api/core/user.ts`  
**流程**：login → 获取 token → 获取用户信息 → 获取权限码 → 路由跳转  
**角色枚举**：`consts/role.ts` → `ADMIN | BD`

### 4.2 动态路由

**机制**：前端路由 + 后端菜单（通过 `accessCodes` 控制可见性）  
**辅助函数**：`packages/utils/src/helpers/generate-routes-backend.ts`  
**路由守卫**：`router/guard.ts`

### 4.3 布局

**布局类型**：

- `layouts/basic.vue` — 主布局（侧边栏 + 顶栏 + 内容区）
- `layouts/auth.vue` — 认证布局（登录页）

**共享布局组件**（`packages/effects/layouts`）：

- 标签栏（tabbar）
- 面包屑（breadcrumb）
- 语言切换（language-toggle）
- 布局切换（layout-toggle）
- 认证页面（authentication）

## 五、API 层结构

```
api/
├── core/           # 通用接口
│   ├── auth.ts     # 登录/登出
│   ├── user.ts     # 用户信息
│   ├── menu.ts     # 菜单/权限
│   └── timezone.ts # 时区
├── bd/
│   └── index.ts    # BD 模块接口（my-tasks 等）
├── system/
│   ├── role.ts     # 角色 CRUD
│   ├── menu.ts     # 菜单 CRUD
│   └── dept.ts     # 部门 CRUD
└── examples/       # 示例代码（参考用）
    ├── table.ts
    ├── form.ts
    └── ...
```

## 六、开发优先级建议

1. **我的任务** → 已完成 ✅
2. **任务管理（admin）** → 任务 CRUD + BD 分配
3. **达人筹备** → BD 选达人 + 审核流程
4. **SOP 执行** → 建联→送样→回收视频状态流转
5. **视频管理** → 视频回收 + GMV 统计
6. **系统管理** → 取消注释路由，启用角色/菜单/部门管理
