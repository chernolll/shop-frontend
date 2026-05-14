# 🏗️ 系统整体说明（Overview）

## 一、系统定位

**电商 BD 管理系统** — 管理 BD（商务拓展）人员与达人（KOL）之间的任务协作，覆盖从任务创建、BD 分配、达人筹备、SOP 执行到视频产出、GMV 统计的全链路。

## 二、技术架构

| 层面     | 技术选型                             |
| -------- | ------------------------------------ |
| 前端框架 | Vue 3（Composition API）+ TypeScript |
| 脚手架   | Vben Admin 5.x（monorepo）           |
| 表格     | vxe-table                            |
| UI 组件  | Vben UI Kit + Ant Design Vue         |
| 状态管理 | Pinia                                |
| 路由     | Vue Router 4（动态路由 + 后端菜单）  |
| 权限     | RBAC（用户 → 角色 → 权限）           |
| 构建     | Vite + Turbo                         |
| 包管理   | pnpm workspace                       |
| 后端 ORM | 基于 db.sql 的 Postgres 数据库       |

## 三、项目结构（关键路径）

```
/
├── db.sql                    # 数据库完整 schema（Postgres）
├── playground/               # 主应用入口
│   └── src/
│       ├── api/              # API 层
│       │   ├── core/         # 核心接口（auth, user, menu, timezone）
│       │   ├── bd/           # BD 模块接口
│       │   └── system/       # 系统管理接口（role, menu, dept）
│       ├── router/routes/modules/
│       │   ├── bd.ts         # BD 模块路由
│       │   ├── system.ts     # 系统管理路由（暂注释）
│       │   ├── dashboard.ts  # 仪表盘路由
│       │   └── ...
│       ├── views/            # 页面视图
│       │   ├── bd/           # BD 模块页面
│       │   │   ├── analytics/     # BD 工作台
│       │   │   ├── tasks/         # 任务管理（admin）
│       │   │   ├── my-tasks/      # 我的任务（BD）
│       │   │   ├── task-progress/ # 任务进度
│       │   │   └── sop/           # SOP 管理
│       │   ├── system/       # 系统管理页面
│       │   ├── dashboard/    # 仪表盘
│       │   └── _core/        # 核心页面（登录、个人中心）
│       ├── store/            # 状态管理
│       └── consts/           # 常量定义
├── packages/                 # 共享包
│   ├── @core/                # 核心库（composables, ui-kit, preferences）
│   ├── stores/               # 全局 store（user, access, tabbar, timezone）
│   ├── effects/              # 副作用包（layouts, access, plugins）
│   ├── types/                # 类型定义
│   ├── utils/                # 工具函数
│   ├── constants/            # 常量
│   ├── locales/              # 国际化
│   ├── icons/                # 图标
│   └── styles/               # 全局样式
└── internal/                 # 内部工具配置
```

## 四、权限体系

| 角色       | Role Code | 说明                                   |
| ---------- | --------- | -------------------------------------- |
| 超级管理员 | `ADMIN`   | 系统内置，拥有所有权限                 |
| BD 人员    | `BD`      | 业务人员，接收任务、管理达人、执行 SOP |

权限模型：`sys_user` → `sys_user_role` → `sys_role` → `sys_role_permission` → `sys_permission`

菜单/权限表为树形结构，`perm_type` 区分菜单、按钮、接口。

## 五、核心业务实体

| 实体 | 表名 | 说明 |
| --- | --- | --- |
| 员工 | employee | 公司员工基础信息 |
| BD 人员 | bd_person | BD 代号与员工绑定（如 BD001） |
| 达人/KOL | kol | 平台达人，可绑定 BD |
| 店铺 | shop | 电商店铺（TikTok/Shopee/Lazada） |
| SKU | product_sku | 商品 SKU |
| 商品链接 | product_listing | 店铺中的平台商品链接 |
| 任务 | task_main | 视频制作任务（定制/公开） |
| 任务-BD 关联 | task_bd_relation | 任务分配给 BD |
| 达人筹备 | kol_bd_prepare | BD 绑定达人（需审核） |
| 筹备审核记录 | kol_bd_prepare_audit | 达人筹备的状态变更审计 |
| SOP 进度 | task_sop | 任务执行进度（建联→送样→回收视频→结束） |
| 视频 | video | 产出视频及 GMV 数据 |

## 六、当前开发状态

- ✅ 登录认证 + 用户信息
- ✅ BD 模块路由框架
- ✅ 我的任务列表（BD 视角）+ 达人筹备表
- ✅ 任务管理（Admin 创建/分配 BD/废弃）
- ✅ SOP 全流程（建联/送样/回收视频/汇款/终止，含 ADMIN 审核面板）
- ✅ 达人管理（Admin KOL CRUD + BD 达人列表）
- ✅ BD 视频列表
- ✅ 商品管理（SKU + 商品链接）
- ✅ 审核模块（筹备审核/预算审核/样品审核/汇款审核）
- ✅ 视频管理（Admin 全局视角）
- ✅ 系统管理（部门/员工/BD 人员）
- ⬜ BD 工作台（占位）
- ⬜ 任务进度看板（占位）
