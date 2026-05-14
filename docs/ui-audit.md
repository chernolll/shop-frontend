# UI Audit Report

> 基于 `docs/ui-system.md` 对全项目页面进行的合规性审计。
> 审计日期：2026-05-14

---

## 一、审计方法

1. **自动化扫描**：grep 全量检查 emoji、vxe-table、原生 table、Popconfirm、Empty、Loading、Dropdown、Page 组件、Lucide 图标、cursor-pointer、Card 使用
2. **抽样深读**：每个模块抽 1-2 个页面检查 Toolbar 结构、按钮密度、确认模式、状态颜色
3. **评分标准**：每条规则分 ✅ 合规 / ⚠️ 轻微偏离 / ❌ 违规 / — 不适用

---

## 二、全局扫描结果

### 2.1 硬性规则合规

| 规则 | 结果 | 说明 |
|---|---|---|
| 禁止 emoji 作图标 | ✅ 通过 | 业务代码零 emoji，仅 examples 中有 1 处 |
| 禁止原生 `<table>` | ✅ 通过 | 零使用 |
| 使用 vxe-table | ✅ 通过 | 所有列表页均使用 `useVbenVxeGrid` |
| 使用 `<Page>` 包裹 | ✅ 通过 | 18/18 业务页面使用 `<Page auto-content-height>` |
| 使用 Ant Design 组件 | ✅ 通过 | 所有页面均 import from `ant-design-vue` |
| Card 组件 | ✅ 通过 | 136 处使用，覆盖充分 |

### 2.2 全局违规

| 规则 | 结果 | 严重度 | 详情 |
|---|---|---|---|
| Lucide 图标 | ❌ 0 处 | **高** | 路由定义中使用了 `lucide:xxx` 格式，但模板中零使用 |
| cursor-pointer | ❌ 2 处 | **高** | 全项目仅 2 个文件有 cursor-pointer，hover 反馈缺失 |
| Popconfirm | ❌ 0 处 | **中** | 无 Popconfirm，但大部分危险操作通过 Modal.confirm 实现 |
| Empty 状态 | ❌ 10/13 缺失 | **中** | 大部分列表页无空状态处理 |
| reduced-motion | ❌ 0 处 | **低** | 无 `prefers-reduced-motion` 适配 |
| Dropdown 溢出 | ❌ 仅 2 页 | **中** | 操作列超 3 个按钮时未使用 Dropdown |

---

## 三、逐页审计

### 3.1 BD 模块

#### ✅ `/bd/tasks` — 任务管理（Admin）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Toolbar 左右分区 | ✅ 2 slots（搜索区 + 按钮区） |
| Loading | ✅ 多处（productOptionsLoading, bdOptionsLoading, createSubmitting, relationsLoading） |
| Empty | — vxe-table 内置 |
| 危险操作确认 | ✅ Modal.confirm（废弃任务） |
| Popconfirm | ⚠️ 使用 Modal.confirm 替代，功能等效 |
| 按钮密度 | ✅ 合理（创建、废弃各 1 个主操作） |
| cursor-pointer | ❌ |

#### ✅ `/bd/my-tasks` — 我的任务（BD）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Empty 状态 | ✅ 显式使用 `<Empty>` 组件 |
| Loading | ✅ `isBriefLoading` 行级加载 |
| cursor-pointer | ❌ |

#### ⚠️ `/bd/kols` — BD 达人列表（444行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Toolbar | ⚠️ 仅 1 个 slot，无左右分区 |
| Empty | ❌ 缺失 |
| 按钮密度 | ✅ 合理 |
| cursor-pointer | ❌ |

#### ⚠️ `/bd/videos` — BD 视频列表（368行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Toolbar | ⚠️ 仅 1 个 slot，无左右分区 |
| Empty | ❌ 缺失 |
| cursor-pointer | ❌ |

#### ✅ `/bd/sop/*` — SOP 详情（6 个面板组件）

| 规则 | 结果 |
|---|---|
| Card 分区 | ✅ 每个面板内 Card 分区清晰 |
| Loading | ✅ Spin + :loading 覆盖全面 |
| Empty | ✅ ContactPanel, VideoPanel, SamplePanel, RemittancePanel 均有 Empty |
| 危险操作确认 | ✅ Modal.confirm（终止流程、废弃样品申请） |
| Step 状态色 | ✅ 绿色对勾/蓝色高亮/灰色未达/红色终止 |
| cursor-pointer | ❌ |

SOP 模块评分：**A 级（最优）**，仅缺 cursor-pointer。

#### ⬜ `/bd/analytics` — 占位（5行）
#### ⬜ `/bd/task-progress` — 占位（5行）

---

### 3.2 KOL 模块

#### ⚠️ `/kol/list` — 达人管理列表（884行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Toolbar | ✅ 含 Dropdown 筛选联动 |
| Empty | ❌ 缺失 |
| cursor-pointer | ❌ |

#### ✅ `/kol/detail` — 达人详情（270行）

| 规则 | 结果 |
|---|---|
| Page 包裹 | ✅ |
| Empty | ✅ 显式使用 `<Empty>` |
| Card 分区 | ✅ |
| cursor-pointer | ❌ |

---

### 3.3 商品模块

#### ⚠️ `/product/sku` — SKU 管理（539行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Toolbar | ✅ 2 slots |
| Empty | ❌ 缺失 |
| Modal/Drawer | ✅ Drawer 编辑 |
| cursor-pointer | ❌ |

#### ⚠️ `/product/listing` — 商品链接管理（484行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Empty | ❌ 缺失 |
| Modal/Drawer | ✅ Modal 编辑 |
| cursor-pointer | ❌ |

---

### 3.4 审核模块

#### ✅ `/review/kol-prepare` — 达人筹备审核（832行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| 危险操作确认 | ✅ Modal.confirm + confirm-loading |
| Empty | ✅ |
| 按钮密度 | ⚠️ 13 个 Button，操作列可能过宽 |
| cursor-pointer | ❌ |

#### ✅ `/review/budget` — 预算审核（597行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| 危险操作确认 | ✅ Modal.confirm + confirm-loading |
| Empty | ❌ 缺失 |
| 按钮密度 | ⚠️ 9 个 Button |
| cursor-pointer | ❌ |

#### ✅ `/review/sample` — 样品审核（926行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| 危险操作确认 | ✅ Modal.confirm + confirm-loading |
| Empty | ❌ 缺失 |
| 按钮密度 | ⚠️ 9 个 Button |
| cursor-pointer | ❌ |

#### ✅ `/review/remittance` — 汇款审核（1370行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| 危险操作确认 | ✅ Modal.confirm + confirm-loading |
| Empty | ✅ |
| 按钮密度 | ⚠️ 13 个 Button |
| cursor-pointer | ❌ |

#### ⚠️ `/review/kol-prepare/:task_id` — 筹备审核详情（70行）

| 规则 | 结果 |
|---|---|
| 页面丰富度 | ⚠️ 仅 70 行，内容较薄 |
| Empty | ❌ |

---

### 3.5 视频模块

#### ⚠️ `/video/list` — 视频管理 Admin（523行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Page 包裹 | ✅ |
| Empty | ❌ 缺失 |
| Loading | ✅ confirm-loading（评分提交） |
| cursor-pointer | ❌ |

---

### 3.6 系统管理模块

#### ⚠️ `/system/departments` — 部门管理（286行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| Empty | ❌ 缺失 |
| cursor-pointer | ❌ |

#### ⚠️ `/system/employees` — 员工管理（707行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| Empty | ❌ 缺失 |
| cursor-pointer | ❌ |

#### ⚠️ `/system/bd-persons` — BD 人员管理（376行）

| 规则 | 结果 |
|---|---|
| vxe-table | ✅ |
| Toolbar | ✅ 2 slots |
| Empty | ❌ 缺失 |
| cursor-pointer | ❌ |

---

## 四、评级汇总

| 等级 | 页面数 | 页面 |
|---|---|---|
| **A** （优） | 6 | SOP 6个面板、`/bd/my-tasks`、`/bd/tasks`、`/kol/detail`、`/review/kol-prepare`、`/review/remittance` |
| **B** （良） | 4 | `/review/budget`、`/review/sample`、`/product/sku`、`/product/listing` |
| **C** （中） | 6 | `/bd/kols`、`/bd/videos`、`/kol/list`、`/video/list`、3 个 system 页面 |
| **D** （差） | 1 | `/review/kol-prepare/:task_id`（70行过薄） |
| **占位** | 2 | `/bd/analytics`、`/bd/task-progress` |

---

## 五、修复优先级

### P0 — 高危（影响全局一致性）

| # | 问题 | 影响范围 | 修复方式 |
|---|---|---|---|
| 1 | cursor-pointer 全局缺失 | 所有业务页面 | 全局 CSS 或逐页补充 |
| 2 | Empty 状态缺失 | 10 个列表页 | 逐个添加 `<Empty>` 组件 |

### P1 — 中危（影响统一性和体验）

| # | 问题 | 影响范围 | 修复方式 |
|---|---|---|---|
| 3 | 操作列按钮溢出 | 4 个 review 页面 | 超过 3 个操作时收进 Dropdown |
| 4 | Lucide 图标零使用 | 模板层 | 确认当前图标方案后决定是否迁移 |
| 5 | Toolbar 无左右分区 | `/bd/kols`、`/bd/videos` | 补充 toolbar 双 slot 结构 |

### P2 — 低危（细节打磨）

| # | 问题 | 影响范围 | 修复方式 |
|---|---|---|---|
| 6 | reduced-motion 适配 | 全局 | 在全局 CSS 中添加媒体查询 |
| 7 | 状态色字符串硬编码 | 多处 | 建立统一的 Tag 颜色映射常量 |
| 8 | 筹备审核详情页过薄 | `/review/kol-prepare/:task_id` | 补充详情内容 |

---

## 六、重构策略建议

### 分批执行

**第一批（P0，预计 2-3 小时）**：
1. 在全局样式或 Vben preference 中补 cursor-pointer
2. 为 10 个缺失 Empty 的列表页逐一添加

**第二批（P1，预计 3-5 小时）**：
3. Review 模块操作列重构（Dropdown 溢出）
4. Toolbar 双 slot 结构补全
5. 图标方案决策 + 执行

**第三批（P2，预计 1-2 小时）**：
6. reduced-motion 全局适配
7. 状态色常量化
8. 筹备审核详情补强

### 不改的页面

SOP 6 个面板组件已达到 A 级标准，仅需补 cursor-pointer（随 P0 全局修复即可覆盖），无需单独重构。

---
