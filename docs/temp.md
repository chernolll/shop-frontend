## Admin 预算审核所需接口

只列前端做 admin 预算审核功能需要的接口。

所有接口基于：

- Base URL：`/api/v1`
- 鉴权：需要 JWT
- 语言 Header：`X-Language: zh`

---

## 1. 预算申请列表

### 接口

`GET /api/v1/admin/sop-budget/list`

### Query 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | int | 否 | 预算申请状态：`0=待审核`，`1=审核通过`，`2=审核驳回` |
| `task_sop_id` | int64 | 否 | SOP ID |
| `task_bd_id` | int64 | 否 | `task_bd_relation.id` |
| `task_id` | int64 | 否 | `task_main.id` |
| `product_listing_id` | int64 | 否 | 商品链接 ID |
| `bd_code` | string | 否 | BD 编码 |
| `kol_id` | string | 否 | 达人 ID |
| `submit_time_start` | int64 | 否 | 提交开始时间，UTC 毫秒时间戳 |
| `submit_time_end` | int64 | 否 | 提交结束时间，UTC 毫秒时间戳 |
| `page` | int | 是 | 页码，最小 `1` |
| `page_size` | int | 是 | 每页条数，范围 `1-200` |

### 请求示例

```http
GET /api/v1/admin/sop-budget/list?status=0&page=1&page_size=20
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
        "budget_application_id": 101,
        "task_sop_id": 201,
        "task_bd_id": 11,
        "task_id": 301,
        "product_listing_id": 401,
        "product_url": "https://shop.example.com/products/1",
        "bd_code": "BD001",
        "kol_id": "kol_001",
        "contact_information": "wechat: abc123",
        "amount": 500,
        "budget_status": 0,
        "sop_status": 0,
        "terminate_remark": null,
        "submitter_name": "BD A",
        "reviewer_name": null,
        "submit_at": 1715000000000,
        "reviewed_at": null,
        "reason": "BD提交预算申请"
      }
    ]
  }
}
```

### 返回字段说明

| 字段 | 说明 |
| --- | --- |
| `budget_application_id` | 预算申请 ID，审核接口使用这个字段 |
| `task_sop_id` | SOP ID |
| `task_bd_id` | `task_bd_relation.id` |
| `task_id` | `task_main.id` |
| `product_listing_id` | 商品链接 ID，可直接请求 brief 链接 |
| `product_url` | 商品链接 |
| `bd_code` | BD 编码 |
| `kol_id` | 达人 ID |
| `contact_information` | 建联信息 |
| `amount` | 申请预算金额 |
| `budget_status` | 预算申请状态：`0=待审核`，`1=审核通过`，`2=审核驳回` |
| `sop_status` | SOP 状态：`0=建联`，`1=寄样`，`2=回收视频`，`3=结束`，`4=汇款阶段`，`5=终止` |
| `terminate_remark` | 当 SOP 已终止时返回终止原因，否则为 `null` |
| `submitter_name` | 提交人名称 |
| `reviewer_name` | 最新审核人名称；待审核时为 `null` |
| `submit_at` | 提交时间，UTC 毫秒时间戳 |
| `reviewed_at` | 最新审核时间，UTC 毫秒时间戳；待审核时为 `null` |
| `reason` | 最新审核原因/备注；待审核时通常为 `BD提交预算申请` |

---

## 2. 审核预算申请

### 接口

`POST /api/v1/admin/sop-budget/review`

### 说明

按条独立审核预算申请，一条失败不影响其他条。

### 请求体

```json
{
  "list": [
    {
      "budget_application_id": 101,
      "status": 1,
      "reason": ""
    },
    {
      "budget_application_id": 102,
      "status": 2,
      "reason": "预算不合理"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `list` | array | 是 | 至少 1 条 |
| `list[].budget_application_id` | int64 | 是 | 预算申请 ID |
| `list[].status` | int | 是 | 目标状态：`1=审核通过`，`2=审核驳回` |
| `list[].reason` | string | 否 | 审核原因；当 `status=2` 时必须传 |

### 业务规则

- 只有 admin 可调用
- 每条记录独立事务处理
- 当前申请必须存在，且当前状态必须是 `0=待审核`
- 如果 SOP 已终止，不允许继续审核
- 会写入 `sop_budget_audit`
- 会更新：
  - `sop_budget_application.status`
  - `sop_budget_application.latest_audit_id`
  - `sop_contact.budget_status`
- 当审核通过且满足建联阶段流转条件时，会自动把 `task_sop.status` 从 `0=建联` 推进到 `1=寄样`

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "budget_application_id": 101,
      "success": true,
      "budget_status": 1,
      "sop_status": 1
    },
    {
      "budget_application_id": 102,
      "success": false,
      "reason": "预算驳回时必须填写原因"
    }
  ]
}
```

### 返回字段说明

| 字段                    | 说明                          |
| ----------------------- | ----------------------------- |
| `budget_application_id` | 对应请求中的预算申请 ID       |
| `success`               | 该条是否审核成功              |
| `reason`                | 失败原因，失败时返回          |
| `budget_status`         | 审核后的预算状态，成功时返回  |
| `sop_status`            | 审核后的 SOP 状态，成功时返回 |
