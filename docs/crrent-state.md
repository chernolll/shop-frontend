# Current State

## 项目定位

- 项目是电商 BD 管理系统前端，基于 `Vue 3 + TypeScript + Vben Admin`。
- 当前高频开发区在 `playground/src/views/bd`。
- 最近主要在做两条链路：
  - `我的任务 -> 达人筹备表`
  - `SOP 列表 -> SOP 流程详情`

## 关键目录

- `playground/src/views/bd/my-tasks`
  - `index.vue`：BD 我的任务列表
  - `kol-prepare.vue`：达人筹备表详情页
- `playground/src/views/bd/sop`
  - `index.vue`：SOP 列表
  - `detail/index.vue`：SOP 详情容器
  - `detail/SopSteps.vue`：顶部步骤条
  - `detail/SopStepContent.vue`：步骤内容卡片
- `playground/src/api/bd`
  - `bd-my-task.ts`：BD 任务、筹备表提交记录相关接口
  - `kol.ts`：达人筹备校验接口
  - `sop.ts`：SOP 列表接口
- `playground/src/store`
  - `bd-sop.ts`：SOP 列表跳详情时的当前行缓存
- `playground/src/router/routes/modules/bd.ts`
  - BD 模块路由定义

## 当前路由

- `/bd/my-tasks`
  - BD 我的任务列表
- `/bd/my-task/:task_id`
  - 达人筹备表详情页
- `/bd/sop/list`
  - SOP 列表
- `/bd/sop/:sop_id`
  - SOP 详情页

## 我的任务 / 达人筹备表现状

涉及文件：

- `playground/src/views/bd/my-tasks/index.vue`
- `playground/src/views/bd/my-tasks/kol-prepare.vue`
- `playground/src/api/bd/bd-my-task.ts`
- `playground/src/api/bd/kol.ts`

当前逻辑：

- BD 在“我的任务”列表中进入某条任务详情。
- 上传达人筹备 Excel 后，前端解析出 `kol_id`、`kol_link`。
- 再调用 `queryKolPrepareState` 做校验，返回每个达人是否可筹备、原因、状态等。
- 解析结果会在页面表格中展示，支持：
  - 删除行
  - 添加行
  - 编辑 `kol_id` / `kol_link`
  - 前端筛选“校验结果”“达人状态”
- 提交筹备时使用 `uploadKolPrepareData`。
- 提交成功后自动切换到“提交记录”标签。
- 提交记录使用 `queryKolPrepareData`，支持分页和筛选。

当前表格重点字段：

- `kol_id`
- `kol_link`
- 校验结果
- 达人状态
- 原因/提示信息

## SOP 列表 / 详情现状

涉及文件：

- `playground/src/views/bd/sop/index.vue`
- `playground/src/views/bd/sop/detail/index.vue`
- `playground/src/views/bd/sop/detail/SopSteps.vue`
- `playground/src/views/bd/sop/detail/SopStepContent.vue`
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
  - 顶部状态仍显示“终止”
  - 不能再次点击“终止”
  - 可查看终止信息
- 已做暗色/亮色兼容，并处理了多语言下步骤标题换行展示。

## SOP 状态来源现状

当前 SOP 详情页的数据来源分两层：

1. 路由只传 `sop_id`
2. 列表页点击进入详情前，把整条 SOP 行数据写入 `bd-sop store`

`bd-sop.ts` 的作用：

- 缓存当前点击的 SOP 行数据
- 用 `sessionStorage` 做同 tab 刷新兜底
- 详情页按 `sop_id` 读取对应缓存

注意：

- 这套方案只解决“从列表进入详情时，详情页拿到首屏数据”的问题。
- 还没有真正的 `SOP detail API`。
- 如果用户直接新开标签访问 `/bd/sop/:sop_id`，当前没有完整详情数据兜底，只能靠有限默认值。

## 已记录但暂未实现的 SOP 建议

见：

- `docs/temp.md`

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

- 给 SOP 详情页补真实步骤表单与提交逻辑
- 增加 SOP 详情接口，摆脱仅依赖列表行缓存
- 将“终止”“汇款”“预算审批”等流程从占位内容替换为真实业务表单
