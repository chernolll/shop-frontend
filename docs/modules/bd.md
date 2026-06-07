# BD 模块

## 模块职责

BD（达人运营）端的核心业务模块，覆盖达人全生命周期管理：数据看板、任务执行、达人库运营、SOP 工作流。

## 入口文件

- 路由入口: `playground/src/router/routes/modules/bd.ts`
- 路由路径前缀: `/bd`

## 子模块

### 1. 数据看板（Analytics）

- 页面: `views/bd/analytics/index.vue`
- API: `getBDAnalytics()` → `/bd/analytics`
- 数据: 月度 GMV / 月完成任务数 / 14 天内截止任务 / KOL 销售排行 / BD 销售排行
- 权限: BD only

### 2. 任务管理（Admin Tasks）

- 页面: `views/bd/tasks/index.vue`
- API: `api/bd/tasks.ts` (CRUD + BD分配 + 废弃)
- 权限: Admin only
- 核心操作: 创建任务（指定商品/Budget/佣金/BD）→ 分配 BD → 废弃

### 3. 公开任务（Public Tasks）

- 页面: `views/bd/public-tasks/index.vue`
- API: `getBDPublicTaskList()` + `applyForPublicTask()`
- 权限: BD only
- 核心操作: 浏览公开任务 → 申请参与 → 等待 Admin 审核

### 4. 我的任务（My Tasks）

- 页面: `views/bd/my-tasks/index.vue`
- API: `getBdTaskList()` / `getBDPublicTaskList()` / `applyForPublicTask()`
- 权限: BD only
- 核心操作: 查看已分配任务 → 进入达人筹备（独立页面）

### 5. 达人筹备（KOL Prepare）

- 页面: `views/bd/kol-prepare/index.vue`
- API: `api/bd/kol-prepare.ts` (validate / create / list / delete)
- 权限: BD only
- 核心操作: 上传/录入达人 → 预校验 → 填写预算信息 → 提交筹备
- **重构变化:** 与任务完全解绑，BD 可独立管理自己的筹备记录，无需任务上下文。不再有审核流程。

### 6. 达人池（KOL Pool）

- 页面: `views/bd/kol-pool/index.vue`
- API: `api/bd/kol-pool.ts` (list / claim)
- 权限: BD only
- 核心操作: 浏览公共达人池 → 筛选（来源/预算） → 认领达人到自己筹备列表
- **新增模块:** 无主 BD 的公共达人资源池，来源包括离职 BD 释放和 Admin 上传。

### 7. 达人候选池（KOLs）

- 页面: `views/bd/kols/index.vue`
- API: `getBdKolList()` / `createKolCandidate()` / `deleteKolCandidate()`
- 权限: BD only
- 核心操作: 搜索达人 → 添加候选 → 校验达人状态

### 8. 达人库（KOL Library）

- 页面: `views/bd/kol-library/index.vue`
- API: `getBdKolLibraryList()`
- 权限: BD only
- 数据: 达人基本信息 + 合作费用 + 参与/完成任务数 + 评分

### 7. 视频打分（Videos）

- 页面: `views/bd/videos/index.vue`
- API: `getBdVideoList()`
- 权限: BD only
- 数据: GMV / 播放量 / 广告号 / 评分

### 8. SOP 工作流

- 列表: `views/bd/sop/index.vue`
- 详情: `views/bd/sop/detail/index.vue`
- API: `api/bd/sop.ts` (全流程)
- Store: `useBDSopStore` (当前 SOP 缓存到 sessionStorage)
- 状态流转: 建联 → 送样 → 回收 → 视频 → 汇款 → 完成 (或终止)

## 外部依赖

- `@vben/request` — RequestClient 实例
- `@vben/stores` — useAccessStore / useUserStore
- `ant-design-vue` — UI 组件库

## 关联模块

- [[docs/modules/review|审核模块]] — BD 提交的数据由 Admin 审核
- [[docs/business/sop-workflow|SOP 流程]] — SOP 状态流转详细说明
- [[docs/business/task-lifecycle|任务生命周期]] — 任务从创建到完成的完整流程
