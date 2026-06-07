# KOL 管理模块

## 模块职责

Admin 端 KOL 全量管理：KOL 列表查看、候选池管理、KOL 详情。

## 入口文件

- 路由入口: `playground/src/router/routes/modules/kol.ts`
- 路由路径前缀: `/kol`
- 权限: Admin only

## 子模块

### 1. KOL 列表（KOL List）

- 页面: `views/kol/index.vue`
- API: `api/kol/index.ts`
- 核心操作: 查看所有 KOL → 搜索 → 筛选 → 进入详情

### 2. KOL 候选（Candidate Pool）

- 页面: `views/kol/candidate.vue`
- API: `api/kol/index.ts`
- 核心操作: Admin 管理全局 KOL 候选池

### 3. KOL 详情（KOL Detail）

- 页面: `views/kol/detail.vue` (隐藏路由，通过路由参数 `kol_id`)
- API: `api/kol/index.ts`
- 核心操作: 查看 KOL 详细信息

## 共享组件

- `views/kol/modules/NumberRangeField.vue` — 数值范围输入组件

## 外部依赖

- `@vben/request` — RequestClient
- `ant-design-vue` — UI 组件库

## 关联模块

- [[docs/modules/bd|BD 模块]] — Admin 管理的候选池可供 BD 选择达人加入任务筹备
