## Admin 寄样审核所需接口

只列前端做 admin 寄样审核功能需要的接口。

所有接口基于：

- Base URL：`/api/v1`
- 鉴权：需要 JWT
- 语言 Header：`X-Language: zh`

---

## 1. 寄样申请列表

### 接口

`GET /api/v1/admin/sop/sample/requests`

### Query 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | int | 否 | 寄样申请状态：`0=待审核`，`1=审核通过`，`2=驳回`，`3=放弃` |
| `task_sop_id` | int64 | 否 | SOP ID |
| `task_bd_id` | int64 | 否 | `task_bd_relation.id` |
| `task_id` | int64 | 否 | `task_main.id` |
| `product_listing_id` | int64 | 否 | 商品链接 ID |
| `bd_code` | string | 否 | BD 编码 |
| `kol_id` | string | 否 | 达人 ID |
| `created_time_start` | int64 | 否 | 提交开始时间，UTC 毫秒时间戳 |
| `created_time_end` | int64 | 否 | 提交结束时间，UTC 毫秒时间戳 |
| `page` | int | 是 | 页码，最小 `1` |
| `page_size` | int | 是 | 每页条数，范围 `1-200` |

### 请求示例

```http
GET /api/v1/admin/sop/sample/requests?status=0&page=1&page_size=20
```

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "total": 2,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "request_id": 101,
        "task_sop_id": 201,
        "task_bd_id": 11,
        "task_id": 301,
        "product_listing_id": 401,
        "product_url": "https://shop.example.com/products/1",
        "bd_code": "BD001",
        "kol_id": "kol_001",
        "address": "Bangkok ...",
        "quantity": 2,
        "status": 0,
        "review_reason": null,
        "reviewer_name": null,
        "reviewed_at": null,
        "created_at": 1715000000000,
        "updated_at": 1715000000000,
        "sop_status": 1,
        "tracking_number": null,
        "delivered_at": null,
        "package_received": 0,
        "terminate_remark": null
      }
    ]
  }
}
```

### 返回字段说明

| 字段 | 说明 |
| --- | --- |
| `request_id` | 寄样申请 ID，审核接口使用这个字段 |
| `task_sop_id` | SOP ID |
| `task_bd_id` | `task_bd_relation.id` |
| `task_id` | `task_main.id` |
| `product_listing_id` | 商品链接 ID，可直接请求 brief 链接 |
| `product_url` | 商品链接 |
| `bd_code` | BD 编码 |
| `kol_id` | 达人 ID |
| `address` | 收样地址 |
| `quantity` | 样品数量 |
| `status` | 寄样申请状态：`0=待审核`，`1=审核通过`，`2=驳回`，`3=放弃` |
| `review_reason` | 审核原因 |
| `reviewer_name` | 审核人名称 |
| `reviewed_at` | 审核时间，UTC 毫秒时间戳 |
| `created_at` | 申请创建时间，UTC 毫秒时间戳 |
| `updated_at` | 申请更新时间，UTC 毫秒时间戳 |
| `sop_status` | SOP 状态：`0=建联`，`1=寄样`，`2=回收视频`，`3=结束`，`4=汇款阶段`，`5=终止` |
| `tracking_number` | 当前样品物流单号；未填写则为 `null` |
| `delivered_at` | 发货时间，UTC 毫秒时间戳；未填写则为 `null` |
| `package_received` | BD 是否确认已收样：`0/1` |
| `terminate_remark` | 当 SOP 已终止时返回终止原因，否则为 `null` |

---

## 2. 审核寄样申请

### 接口

`POST /api/v1/admin/sop/sample/review`

### 说明

Admin 对寄样申请进行审核。  
这个接口既可以做“状态审核”，也可以在审核时同时补充或修改寄样信息。

### 请求体

```json
{
  "list": [
    {
      "request_id": 101,
      "status": 1,
      "reason": "",
      "address": "Bangkok ...",
      "quantity": 2,
      "tracking_number": "SF123456789",
      "delivered_at": 1715001000000,
      "package_received": 0
    },
    {
      "request_id": 102,
      "status": 2,
      "reason": "地址信息不完整"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `list` | array | 是 | 至少 1 条 |
| `list[].request_id` | int64 | 是 | 寄样申请 ID |
| `list[].status` | int | 否 | 目标状态：`0=待审核`，`1=审核通过`，`2=驳回`，`3=放弃` |
| `list[].reason` | string | 否 | 审核原因；当 `status=2` 时必须传 |
| `list[].address` | string | 否 | 可更新收样地址 |
| `list[].quantity` | int | 否 | 可更新样品数量，最小 `1` |
| `list[].tracking_number` | string | 否 | 物流单号 |
| `list[].delivered_at` | int64 | 否 | 发货时间，UTC 毫秒时间戳 |
| `list[].package_received` | int | 否 | `0/1`，只有在物流信息完整时，传 `1` 才会生效 |

### 业务规则

- 只有 admin 可调用
- 每条记录独立事务处理
- 如果 SOP 已终止，不允许继续审核
- 当审核通过后，若当前寄样记录满足：
  - 有 `tracking_number`
  - 有 `delivered_at`
  - `package_received = 1` 则会把 SOP 状态从 `1=寄样` 推进到 `2=回收视频`

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "request_id": 101,
      "success": true,
      "request_status": 1,
      "sop_status": 1,
      "package_received": 0
    },
    {
      "request_id": 102,
      "success": false,
      "reason": "驳回时必须填写原因"
    }
  ]
}
```

### 返回字段说明

| 字段               | 说明                             |
| ------------------ | -------------------------------- |
| `request_id`       | 对应请求中的寄样申请 ID          |
| `success`          | 该条是否审核成功                 |
| `reason`           | 失败原因，失败时返回             |
| `request_status`   | 审核后的寄样申请状态，成功时返回 |
| `sop_status`       | 审核后的 SOP 状态，成功时返回    |
| `package_received` | 审核后的收样状态，成功时返回     |
