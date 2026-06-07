# 文件地图

## 入口与启动

| 文件 | 职责 |
|------|------|
| `playground/src/main.ts` | 应用入口 |
| `playground/src/bootstrap.ts` | 启动流程：初始化适配器→i18n→Store→路由→挂载 |
| `playground/src/app.vue` | 根组件 |
| `playground/src/preferences.ts` | 应用偏好设置覆盖 |

## 路由

| 文件 | 职责 |
|------|------|
| `playground/src/router/index.ts` | createRouter 实例 |
| `playground/src/router/guard.ts` | 通用守卫 + 权限守卫（动态路由生成） |
| `playground/src/router/access.ts` | generateAccess：基于角色/权限码生成可访问路由 |
| `playground/src/router/routes/index.ts` | 路由汇总导出 |
| `playground/src/router/routes/core.ts` | 核心路由（登录/404 等不可移除路由） |
| `playground/src/router/routes/modules/bd.ts` | BD 模块路由定义 |
| `playground/src/router/routes/modules/review.ts` | 审核模块路由定义 |
| `playground/src/router/routes/modules/kol.ts` | KOL 管理路由定义 |
| `playground/src/router/routes/modules/video.ts` | 视频管理路由定义 |
| `playground/src/router/routes/modules/system.ts` | 系统管理路由定义 |
| `playground/src/router/routes/modules/product.ts` | 商品管理路由定义 |
| `playground/src/router/routes/modules/shop.ts` | 店铺管理路由定义 |
| `playground/src/router/routes/modules/sample.ts` | 样品管理路由定义 |
| `playground/src/router/utils/generate-menus.ts` | 路由→菜单 转换 |
| `playground/src/router/utils/generate-routes-backend.ts` | 后端路由模式生成 |
| `playground/src/router/utils/generate-routes-frontend.ts` | 前端路由模式生成 |

## 请求层

| 文件 | 职责 |
|------|------|
| `playground/src/api/request.ts` | RequestClient 工厂：拦截器/认证/错误处理/BigInt |
| `playground/src/api/index.ts` | API 汇总导出 |
| `playground/src/api/core/auth.ts` | 登录/登出/刷新 Token |
| `playground/src/api/core/user.ts` | 用户信息 |
| `playground/src/api/core/menu.ts` | 动态菜单 |
| `playground/src/api/core/file.ts` | 文件上传 |
| `playground/src/api/core/timezone.ts` | 时区配置 |

## API 业务模块

| 文件 | 核心接口 |
|------|---------|
| `api/bd/tasks.ts` | Admin 任务 CRUD + BD 分配 + 商品链接查询 |
| `api/bd/bd-my-task.ts` | BD 我的任务 + 公开任务 + 达人筹备提交 + 数据看板 |
| `api/bd/kol.ts` | BD 达人候选池 + 达人库 CRUD |
| `api/bd/sop.ts` | SOP 全流程 API（建联/送样/视频/汇款/完成/终止） |
| `api/bd/video.ts` | BD 视频列表查询 + 打分 |
| `api/review/kol-prepare.ts` | Admin 审核达人筹备 |
| `api/review/budget.ts` | Admin 审核预算 |
| `api/review/remittance.ts` | Admin 审核汇款 |
| `api/review/public-task-application.ts` | Admin 审核公开任务申请 |
| `api/review/sample.ts` | Admin 样品管理 |
| `api/kol/index.ts` | Admin KOL 管理 |
| `api/system/admin-department.ts` | 部门管理 |
| `api/system/admin-employee.ts` | 员工管理 |
| `api/system/admin-bd-person.ts` | BD 人员管理 |
| `api/system/admin-shop.ts` | 店铺管理 |
| `api/product/index.ts` | 商品 SKU + 商品链接 |
| `api/video/index.ts` | Admin 视频管理 |

## 关键 View 页面

| 文件 | 职责 |
|------|------|
| `views/bd/my-tasks/index.vue` | BD 任务列表 |
| `views/bd/my-tasks/kol-prepare.vue` | 达人筹备表提交 |
| `views/bd/sop/detail/index.vue` | SOP 详情（建联/送样/视频/汇款面板组合） |
| `views/bd/sop/detail/SopContactPanel.vue` | 建联面板 |
| `views/bd/sop/detail/SopSamplePanel.vue` | 送样面板 |
| `views/bd/sop/detail/SopVideoPanel.vue` | 视频面板 |
| `views/bd/sop/detail/SopRemittancePanel.vue` | 汇款面板 |
| `views/bd/sop/detail/SopSteps.vue` | SOP 状态步骤条 |
| `views/bd/kols/index.vue` | 达人候选池列表 |
| `views/bd/kol-library/index.vue` | 达人库列表 |
| `views/bd/videos/index.vue` | 视频打分列表 |
| `views/review/kol-prepare/index.vue` | 达人筹备审核列表 |
| `views/review/budget/index.vue` | 预算审核列表 |
| `views/review/remittance/index.vue` | 汇款审核列表 |
| `views/system/dept/list.vue` | 部门管理列表 |
| `views/system/role/list.vue` | 角色管理列表 |
| `views/system/menu/list.vue` | 菜单管理列表 |
