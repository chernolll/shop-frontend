# BD 接收任务 & SOP 全流程（后端参考）

## 一、数据链路（按依赖顺序）

```
shop ── product_listing ── task_main ──┬── task_bd_relation (BD分配)
                                       │        │
                                       │        └── task_sop (SOP进度)
                                       │              ├── sop_contact (建联)
                                       │              ├── sample_application (送样)
                                       │              └── video (回收视频)
                                       │
                                       └── kol_bd_prepare (达人筹备)
                                                └── kol (达人池)
```

## 二、分阶段流程

### 阶段1：ADMIN 创建任务 + 分配 BD

**涉及表**：`task_main`, `task_bd_relation`

```
1. ADMIN 创建 task_main
   - product_listing_id → 商品链接
   - commission → 任务佣金（后续所有视频都走这个值）
   - video_num → 该任务总共需要的视频数
   - deadline → 截止日期
   - type → 0-定制 / 1-公开
   - budget → 0-无预算 / 1-有预算

2. ADMIN 分配 BD
   - 创建 task_bd_relation(task_id, bd_code, video_quantity)
   - video_quantity → 这个 BD 负责的视频数量
```

### 阶段2：BD 查看"我的任务"

**前端页面**：`GET /bd/my-tasks`

| 前端字段 | 来源表.字段 |
| --- | --- |
| `taskId` | `task_main.id` |
| `productName` | `product_sku.sku_name`（通过 product_listing.main_sku_id） |
| `productImage` | `product_sku.image_url` |
| `shopName` | `shop.shop_name`（通过 product_listing.shop_id） |
| `platform` | `shop.platform` |
| `country` | `shop.country` |
| `commission` | `task_main.commission` |
| `myVideoNum` | `task_bd_relation.video_quantity` |
| `totalVideoNum` | `task_main.video_num` |
| `preparePassed` | `COUNT(kol_bd_prepare WHERE status=1)` |
| `preparePending` | `COUNT(kol_bd_prepare WHERE status=0)` |
| `prepareTotal` | `COUNT(kol_bd_prepare)` |
| `progress` | `preparePassed / myVideoNum * 100`（整数） |
| `prepareStatus` | 计算：全部通过→`DONE`，0通过且0待审→`NOT_STARTED`，有通过且未满→`PARTIAL`，其他→`IN_PROGRESS` |
| `deadline` | `task_main.deadline` |
| `followEntryTime` | `task_bd_relation.follow_entry_time` |
| `taskType` | `task_main.type` |

**JOIN 链路**：

```
task_bd_relation (bd_code = 当前BD)
  → task_main ON task_bd_relation.task_id = task_main.id
  → product_listing ON task_main.product_listing_id = product_listing.id
  → shop ON product_listing.shop_id = shop.id
  → product_sku ON product_listing.main_sku_id = product_sku.id
  → kol_bd_prepare ON task_main.id = kol_bd_prepare.task_id
                     AND task_bd_relation.bd_code = kol_bd_prepare.bd_code
```

### 阶段3：达人筹备（BD 选达人 → ADMIN 审核）

**涉及表**：`kol`, `kol_bd_prepare`, `kol_bd_prepare_audit`

```
1. BD 从达人池(kol)选取达人
   - 达人状态要求：kol.status = 1（正常），kol.deleted_at IS NULL
   - 达人未被占用：通过 uk_prepare_kol 唯一约束保证

2. BD 提交筹备 → INSERT kol_bd_prepare
   - task_id + kol_id + bd_code
   - status = 0（待审核）

3. ADMIN 审核（每次状态变更需记录审计）：
   - 开始审核 → UPDATE status = 1（审核中）
     → INSERT kol_bd_prepare_audit(prepare_id, from_status=0, to_status=1, reviewer_id)
   - 通过 → UPDATE status = 3（审核通过）
     → INSERT kol_bd_prepare_audit(prepare_id, from_status=1, to_status=3, reviewer_id)
   - 不通过 → UPDATE status = 2（审核不通过）
     → INSERT kol_bd_prepare_audit(prepare_id, from_status=1, to_status=2, reviewer_id, reason)

约束：uk_prepare_kol → 一个达人同一时间只能参与一个任务的筹备
```

### 阶段4：SOP 执行（BD 逐步推进）

**涉及表**：`task_sop`, `sop_contact`, `sample_application`, `video`

筹备通过后，对每个通过的 KOL 创建 `task_sop` 记录，然后按状态机流转：

```
task_sop 创建（status = 0，建联）

  ① 建联 (status=0)
     └── 填写 sop_contact(task_sop_id, contact_information, budget)
         └── budget 需要 ADMIN 审批：budget_status 0→1/2
     └── 完成后 UPDATE task_sop.status = 1

  ② 送样 (status=1)
     └── 填写 sample_application(task_sop_id, product_listing_id, address, quantity)
         └── 后续可补 tracking_number
     └── 完成后 UPDATE task_sop.status = 2

  ③ 回收视频 (status=2)
     └── INSERT video(kol_id, sop_id, bd_code, video_url, product_listing_id, commission)
         - commission 取 task_main.commission（快照）
     └── 后续回填：score(0-100), play_count, gmv, finish_time
     └── 全部视频回收完成 → UPDATE task_sop.status = 3

  ④ 结束 (status=3)
```

## 三、关键约束和规则

- **佣金冻结**：task_main.commission 创建后不变，video.commission 取快照
- **达人独占**：一个 KOL 同一时间只能在一个筹备中（`uk_prepare_kol`）
- **SOP 唯一**：同一任务下，bd_code + kol_id 唯一（`uk_sop_task_bd_kol`）
- **BD 唯一绑定**：bd_person.employee_id 一对一（`uk_bd_employee`）
- **所有表软删除**：均有 deleted_at，唯一索引均带 `WHERE deleted_at IS NULL`
- **BD 代号格式**：如 BD001、BD002

## 四、后端需要实现的接口（优先级排序）

| 接口 | 说明 | 涉及表 |
| --- | --- | --- |
| `GET /bd/my-tasks` | BD 我的任务列表（✅ 前端已对接） | task_main + task_bd_relation + product_listing + shop + product_sku + kol_bd_prepare 聚合 |
| `GET /bd/my-tasks/:id/kol-prepare` | 查看某任务下的达人筹备列表 | kol_bd_prepare + kol |
| `POST /bd/kol-prepare` | BD 提交达人筹备 | kol_bd_prepare |
| `PUT /bd/kol-prepare/:id/approve` | ADMIN 审核通过 | kol_bd_prepare |
| `GET /bd/sop` | SOP 列表 | task_sop |
| `POST /bd/sop/:id/contact` | 填写建联信息 | sop_contact |
| `POST /bd/sop/:id/sample` | 填写样品申请 | sample_application |
| `POST /bd/sop/:id/video` | 回收视频 | video |
