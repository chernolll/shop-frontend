# Admin 总任务接口

## 1. 创建总任务

`POST /api/v1/admin/tasks`

### 请求体

```json
{
  "product_listing_id": 123,
  "commission": 50.5,
  "video_num": 6,
  "deadline": 1778112000000,
  "type": 0,
  "budget": 1,
  "bd_codes": ["BD001", "BD002", "BD003"]
}
```

### 请求参数说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `product_listing_id` | int64 | 是 | 商品链接 ID，对应 `product_listing.id` |
| `commission` | number | 是 | 总任务固定佣金 |
| `video_num` | int | 是 | 总任务视频总数，对应 `task_main.video_num` |
| `deadline` | int64 | 否 | 截止日期，UTC 毫秒时间戳 |
| `type` | int | 是 | 任务类型：`0=定制`，`1=公开` |
| `budget` | int | 是 | 是否有预算：`0=无预算`，`1=有预算` |
| `bd_codes` | string[] | 是 | 需要分配该任务的 BD 编码列表，至少 1 个，不能重复 |

### 业务说明

1. 创建 `task_main` 时，`status` 固定为 `0=正常`。
2. 同时创建 `task_bd_relation`。
3. `task_main.video_num` 为总视频数，按 `video_num / BD数量` 平均分配到各 BD。
4. 若不能整除，余数按顺序补到前面的 BD，保证各 BD `video_quantity` 之和等于 `task_main.video_num`。
5. 整个创建过程使用事务，任一步失败全部回滚。

### 成功响应

```json
{
  "task_id": 1001,
  "status": 0,
  "product_listing_id": 123,
  "commission": 50.5,
  "video_num": 6,
  "deadline": 1778112000000,
  "type": 0,
  "budget": 1,
  "bd_relations": [
    {
      "relation_id": 2001,
      "bd_code": "BD001",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    },
    {
      "relation_id": 2002,
      "bd_code": "BD002",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    },
    {
      "relation_id": 2003,
      "bd_code": "BD003",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    }
  ],
  "created_at": 1775000000000,
  "updated_at": 1775000000000
}
```

---

## 2. 总任务列表

`GET /api/v1/admin/tasks`

### 查询参数

| 参数                 | 类型  | 必填 | 说明                               |
| -------------------- | ----- | ---- | ---------------------------------- |
| `task_id`            | int64 | 否   | 总任务 ID                          |
| `product_listing_id` | int64 | 否   | 商品链接 ID                        |
| `status`             | int   | 否   | 任务状态：`0=正常`，`1=废弃`       |
| `type`               | int   | 否   | 任务类型：`0=定制`，`1=公开`       |
| `budget`             | int   | 否   | 是否有预算：`0=无预算`，`1=有预算` |
| `deadline_start`     | int64 | 否   | 截止日期开始时间，UTC 毫秒时间戳   |
| `deadline_end`       | int64 | 否   | 截止日期结束时间，UTC 毫秒时间戳   |
| `page`               | int   | 是   | 页码，从 1 开始                    |
| `page_size`          | int   | 是   | 每页条数                           |

### 成功响应

```json
{
  "total": 2,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "task_id": 1001,
      "product_listing_id": 123,
      "product_url": "https://example.com/product/123",
      "commission": 50.5,
      "video_num": 6,
      "deadline": 1778112000000,
      "type": 0,
      "budget": 1,
      "status": 0,
      "bd_count": 3,
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    },
    {
      "task_id": 1002,
      "product_listing_id": 456,
      "product_url": "https://example.com/product/456",
      "commission": 30,
      "video_num": 4,
      "deadline": null,
      "type": 1,
      "budget": 0,
      "status": 1,
      "bd_count": 2,
      "created_at": 1775001000000,
      "updated_at": 1775002000000
    }
  ]
}
```

### 响应字段说明

| 字段                 | 类型           | 说明                               |
| -------------------- | -------------- | ---------------------------------- |
| `task_id`            | int64          | 总任务 ID                          |
| `product_listing_id` | int64          | 商品链接 ID                        |
| `product_url`        | string \| null | 商品链接                           |
| `commission`         | number         | 总任务固定佣金                     |
| `video_num`          | int            | 总任务视频总数                     |
| `deadline`           | int64 \| null  | 截止日期，UTC 毫秒时间戳           |
| `type`               | int            | 任务类型：`0=定制`，`1=公开`       |
| `budget`             | int            | 是否有预算：`0=无预算`，`1=有预算` |
| `status`             | int            | 任务状态：`0=正常`，`1=废弃`       |
| `bd_count`           | int            | 当前负责该总任务的 BD 数量         |
| `created_at`         | int64          | 创建时间，UTC 毫秒时间戳           |
| `updated_at`         | int64          | 更新时间，UTC 毫秒时间戳           |

---

## 3. 查看总任务下的 BD 分配列表

`GET /api/v1/admin/tasks/relations?task_id=1001`

### 查询参数

| 参数      | 类型  | 必填 | 说明      |
| --------- | ----- | ---- | --------- |
| `task_id` | int64 | 是   | 总任务 ID |

### 成功响应

```json
{
  "task_id": 1001,
  "status": 0,
  "video_num": 6,
  "relations": [
    {
      "relation_id": 2001,
      "bd_code": "BD001",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    },
    {
      "relation_id": 2002,
      "bd_code": "BD002",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    },
    {
      "relation_id": 2003,
      "bd_code": "BD003",
      "video_quantity": 2,
      "follow_entry_time": 1775000000000
    }
  ]
}
```

### 响应字段说明

| 字段                            | 类型   | 说明                             |
| ------------------------------- | ------ | -------------------------------- |
| `task_id`                       | int64  | 总任务 ID                        |
| `status`                        | int    | 任务状态：`0=正常`，`1=废弃`     |
| `video_num`                     | int    | 总任务视频总数                   |
| `relations[].relation_id`       | int64  | `task_bd_relation.id`            |
| `relations[].bd_code`           | string | BD 编码                          |
| `relations[].video_quantity`    | int    | 该 BD 分配到的视频数             |
| `relations[].follow_entry_time` | int64  | 分配记录创建时间，UTC 毫秒时间戳 |

---

## 4. 废弃总任务

`PUT /api/v1/admin/tasks/abandon`

### 请求体

```json
{
  "task_id": 1001
}
```

### 请求参数说明

| 字段      | 类型  | 必填 | 说明      |
| --------- | ----- | ---- | --------- |
| `task_id` | int64 | 是   | 总任务 ID |

### 业务说明

1. admin 创建后的总任务，仅支持废弃，不支持修改其他字段。
2. 废弃后，`task_main.status` 更新为 `1=废弃`。
3. 该总任务下：
   - `task_sop.status == 0` 的记录，自动更新为 `5=终止`
   - 已经进入后续阶段的 SOP 保持原状态继续执行

### 成功响应

```json
{
  "task_id": 1001,
  "status": 1,
  "terminated_sop_count": 3
}
```

### 响应字段说明

| 字段                   | 类型  | 说明                          |
| ---------------------- | ----- | ----------------------------- |
| `task_id`              | int64 | 总任务 ID                     |
| `status`               | int   | 最新任务状态，固定为 `1=废弃` |
| `terminated_sop_count` | int64 | 本次自动终止的 SOP 数量       |
