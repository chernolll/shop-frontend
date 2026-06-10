# BD 达人管理系统

基于 [Vue Vben Admin v5](https://github.com/vbenjs/vue-vben-admin) 的东南亚电商达人合作全流程管理系统。

## 功能

- **达人管理** — KOL 发现、建联、送样、视频、汇款全流程 SOP 管理
- **审核中心** — 达人审核、内容审核、佣金审批多级审核流
- **任务系统** — 任务创建、分配、执行、跟踪，支持多角色协作
- **数据面板** — BD 端实时数据统计与业务指标可视化
- **消息通知** — 站内实时通知，支持 SSE 推送、类型筛选、偏好设置
- **权限管理** — Admin/BD 双角色，动态路由 + 按钮级权限控制

## 消息通知

### 架构

```
playground/src/
├── api/core/notification.ts          # API 层 — 9 个接口 + 类型定义
├── store/notification.ts             # Pinia Store — 状态管理 + SSE 连接
├── views/_core/
│   ├── notification/index.vue        # 全屏通知列表页
│   └── profile/notification-setting.vue  # 通知偏好设置
├── layouts/basic.vue                 # 铃铛弹窗（接入 store）
└── router/routes/core.ts             # 路由注册
```

### 实时推送

基于 **SSE (Server-Sent Events)** 长连接，登录后自动建立，登出断开。支持断线自动重连（指数退避，3s → 6s → 12s → max 60s）。

### 通知类型

| 类型      | 颜色                                    | 说明     |
| --------- | --------------------------------------- | -------- |
| `system`  | <span style="color:#1677ff">●</span> 蓝 | 系统消息 |
| `task`    | <span style="color:#fa8c16">●</span> 橙 | 待办任务 |
| `audit`   | <span style="color:#722ed1">●</span> 紫 | 审核通知 |
| `message` | <span style="color:#52c41a">●</span> 绿 | 私信     |

### 交互

- **点击通知** → 标记已读 + 跳转业务路由（`item.link`）
- **点击 ✓** → 仅标记已读，不跳转
- **全部已读** / **清空** → 批量操作，支持按类型筛选
- **铃铛红点** → 实时反映未读总数

### API

| 方法     | 路径                          | 说明             |
| -------- | ----------------------------- | ---------------- |
| `GET`    | `/notifications`              | 分页获取通知列表 |
| `GET`    | `/notifications/unread-count` | 获取各类型未读数 |
| `PUT`    | `/notifications/{id}/read`    | 标记单条已读     |
| `PUT`    | `/notifications/read-all`     | 全部标记已读     |
| `DELETE` | `/notifications/{id}`         | 删除单条         |
| `DELETE` | `/notifications/clear`        | 清空通知         |
| `GET`    | `/notifications/settings`     | 获取偏好设置     |
| `PUT`    | `/notifications/settings`     | 更新偏好设置     |
| `POST`   | `/notifications/stream`       | SSE 实时推送     |

## 快速开始

```bash
pnpm install
pnpm dev
```

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Ant Design Vue · Turbo · pnpm

## 许可证

MIT
