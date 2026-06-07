# 任务生命周期

## 业务目的

Admin 创建带货任务并分配给 BD，BD 执行达人合作全流程。任务按类型分为公开任务和指定任务。

## 状态流转

```
Admin 创建任务 (NORMAL)
    ↓
Admin 分配 BD（指定任务）/ BD 申请参与（公开任务）
    ↓
BD 在达人筹备中管理 KOL
    ↓
BD 对每个 KOL 启动 SOP
    ↓
SOP 流转（见 SOP 文档）
    ↓
任务完成 / 任务废弃 (ABANDONED)
```

## 任务类型

| 类型     | 标识        | 说明                          |
| -------- | ----------- | ----------------------------- |
| 指定任务 | `CUSTOM(0)` | Admin 直接指定 BD 执行        |
| 公开任务 | `PUBLIC(1)` | BD 可主动申请参与，Admin 审核 |

## 核心概念

- **task_main**: 总任务（商品链接 + 佣金 + 视频总数 + 预算标志 + 截止日期）
- **task_bd_relation**: 任务-BD 关联（每个 BD 的视频数配额）
- **task_sop**: 每个 KOL 合作流程实例（一条 SOP = 一个 KOL 在一个任务中的合作过程）

## 核心约束

- 任务创建后不可修改（只能废弃 → 重新创建）
- 指定任务：Admin 创建时即指定 BD
- 公开任务：BD 申请 → Admin 审核通过后分配
- 达人筹备与任务解绑，BD 可独立管理自己的筹备记录
- 废弃任务会同时终止其下所有进行中的 SOP

## 上下游关系

```
Product (商品SKU/链接) → Task (创建任务关联商品) → BD (分配执行)
    → KOL (达人候选/筹备) → SOP (执行流程) → Video (视频产出)
    → Remittance (汇款结算) → Review (Admin 全程审核)
```

## 关联模块

- [[docs/business/sop-workflow|SOP 流程]] — 任务内单 KOL 的执行流程
- [[docs/modules/bd|BD 模块]] — 任务执行端
- [[docs/modules/review|审核模块]] — 达人筹备审核
