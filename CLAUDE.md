# MIS — Shop System Frontend

Vue 3 + TypeScript + Vben Admin 5.x（monorepo）。电商 BD 管理系统前端。

## 新会话恢复

1. `docs/crrent-state.md` — 路由全景、各模块行数、SOP 详情现状
2. 与当前任务直接相关的页面 / API 文件
3. 按需补读 `docs/flows.md`、`docs/database.md`

不要一开始就全量扫描项目。

## 技术栈

Vue 3 (Composition API) + Vben Admin 5.x + vxe-table + Ant Design Vue + Pinia + Vue Router 4。构建：Vite + Turbo + pnpm workspace。

## 角色权限

`ADMIN` — 管理类页面（任务管理/KOL/商品/审核/视频/系统管理）。`BD` — 业务页面（我的任务/SOP/达人列表/视频列表）。前端通过 `accessCodes` 控制菜单/按钮可见性。

## 及时更新文档

功能/修坑完成后，同步更新 `docs/crrent-state.md`（行数、状态标记）。文档与代码不一致时，AI 会读到过时信息。

## 关键约束

### 路由模块

```
playground/src/router/routes/modules/
├── bd.ts        # /bd/* (analytics/tasks/my-tasks/kols/videos/sop)
├── kol.ts       # /kol/*
├── product.ts   # /product/*
├── review.ts    # /review/*
├── video.ts     # /video/*
├── system.ts    # /system/* (新版: departments/employees/bd-persons)
└── dashboard.ts
```

### SOP 状态机

无预算：0(建联) → 1(送样) → 2(回收视频) → 3(结束) 有预算：0 → 1 → 2 → 4(汇款) → 3异常：任一阶段 → 5(终止)

### SOP 详情页

后端已有 SOP 各阶段详情 API。详情页混用 store (`bd-sop.ts`) 缓存 + API 调用。推进流程成功后以后端返回数据为准，**不要前端自己做 `status + 1`**。

### 废弃文件（不要改动）

`views/system/dept/`、`role/`、`menu/` 及对应 API（`api/system/dept.ts`、`role.ts`、`menu.ts`）— 代码仍在但路由已废弃，新版路由指向 `department/employee/bd-person`。

### 占位文件

`views/bd/analytics/`、`views/bd/workspace/`、`views/bd/task-progress/` — 均为 5 行占位，analytics 有路由注册，workspace 和 task-progress 无路由注册。

### 附件图片显示

汇款审核等处后端返回的附件是 `{access_url, file_key, file_name, ...}` 对象数组，模板中遍历时使用 `item.access_url` 而非直接将对象当 `:src`。参考 `views/review/remittance/index.vue` 中的 `#payment_attachments` 和 `#chat_attachments` 模板。
