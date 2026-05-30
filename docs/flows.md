# 🔄 核心业务流程（Flows）

## 一、总览：端到端流程

```
创建任务(task_main)
  → 分配BD(task_bd_relation)
    → 达人筹备(kol_bd_prepare) ← 从达人池(kol)选取
      → SOP执行(task_sop)
        → ① 建联(sop_contact)
        → ② 送样(sample_application)
        → ③ 回收视频(video)
        → ④ 结束
          → GMV统计(video.gmv + video.play_count)
```

## 二、详细流程

### 2.1 任务创建与分配

```
ADMIN 创建任务
  ├── 选择商品链接(product_listing)
  ├── 设定佣金(commission)、视频数量(video_num)、截止日期(deadline)
  ├── 任务类型(type): 0-定制 / 1-公开
  └── 预算标记(budget): 0-无 / 1-有

ADMIN 分配 BD
  └── 创建 task_bd_relation（任务-BD绑定，含视频配额 video_quantity）
```

**关键表**：`task_main`, `task_bd_relation`

### 2.2 达人筹备（BD 选达人）

```
BD 从达人池(kol)选取达人
  └── 创建 kol_bd_prepare 记录
      ├── 绑定 task_id + kol_id + bd_code
      └── status: 0-待审核 → 1-审核中 → 3-审核通过 / 2-审核不通过（由 ADMIN 审核）

关键约束：
  - 一个 kol 同一时间只能绑定一个任务（uk_prepare_kol 唯一约束）
  - 达人 belog_bd_code 为 NULL 时表示闲置
```

**关键表**：`kol_bd_prepare`, `kol_bd_prepare_audit`, `kol`

### 2.3 SOP 执行流程

```
BD 对已通过筹备的达人执行 SOP：

① 建联（status=0）
    └── 填写 sop_contact（联系方式 + 预算）
        └── 若任务有预算：budget_status 0-待审核 / 1-通过 / 2-驳回
        └── 预算审核通过后，才可进入送样阶段

② 送样（status=1）
    └── 填写 sample_application（收样地址 + 商品链接 + 数量）
        └── 可后续补填 tracking_number（快递单号）

③ 回收视频（status=2）
    └── 创建 video 记录
        ├── video_url（视频链接）
        ├── score（打分 0-100）
        ├── play_count（播放量）
        ├── gmv（成交额）
        └── commission（佣金快照）

④ 结束（status=3）

⑤ 汇款阶段（status=4，仅有预算任务）
    └── 填写 sop_remittance
        ├── amount（汇款金额）
        ├── chat_screenshot_urls（聊天记录截图）
        └── remittance_screenshot_urls（汇款截图）
    └── 汇款审核通过后，才可进入结束阶段

⑥ 终止（status=5）
    └── 当 SOP 无法继续推进时，由 BD 主动终止
```

**关键表**：`task_sop`, `sop_contact`, `sop_budget_application`, `sample_application`, `sample_application_request`, `video`, `sop_remittance`, `sop_remittance_attachment`

**SOP 状态机**：

```
无预算任务：0(建联) → 1(送样) → 2(回收视频) → 3(结束)
有预算任务：0(建联/预算审核) → 1(送样) → 2(回收视频) → 4(汇款阶段) → 3(结束)
异常终止：任一阶段 → 5(终止)
```

### 2.4 数据关系链

```
task_main ──┐
            ├── task_bd_relation (1:N)
            │     └── task_sop (1:N, 每个 BD-达人一个 SOP)
            │           ├── sop_contact (1:1)
            │           ├── sample_application (1:1)
            │           ├── sop_remittance (1:1)
            │           └── video (1:N, 一个达人可产出多个视频)
            │
            └── kol_bd_prepare (1:N, 筹备记录)
                  └── kol (N:1, 达人信息)

product_listing ── task_main (1:N)
product_listing ── shop (N:1) ── employee (N:1, 店铺负责人)

kol ── bd_person (N:1, belong_bd_code) ── employee (1:1)
```

## 三、角色视角

### 3.1 ADMIN 视角

1. **任务管理** (`/bd/tasks`) — 创建任务、分配 BD、查看进度
2. **达人审核** — 审批 kol_bd_prepare（待审核 → 审核中 → 通过 / 不通过）
3. **预算审核** — 审批 sop_contact.budget_status
4. **全局数据** — 看板、GMV 汇总

### 3.2 BD 视角

1. **我的任务** (`/bd/my-tasks`) — 查看分配给我的任务列表
2. **达人筹备** — 从达人池选取达人提交审核
3. **SOP 执行** (`/bd/sop`) — 按任务逐步执行建联→送样→回收视频
4. **工作台** (`/bd/analytics`) — 个人数据概览

## 四、关键业务规则

- 任务佣金(commission)在创建时固定，后续 video 取快照值
- 一个达人同一时间只能参与一个任务（筹备表唯一约束）
- BD 代号(bd_code)与员工一对一绑定
- 所有核心表均采用软删除(deleted_at)
- 店铺支持多平台：TikTok(1) / Shopee(2) / Lazada(3)
- 店铺类型：跨境(1) / 本土(2)
