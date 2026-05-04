## Admin 汇款审核所需接口

只列前端做 admin 汇款审核功能需要的接口。

所有接口基于：

- Base URL：`/api/v1`
- 鉴权：需要 JWT
- 语言 Header：`X-Language: zh`

---

## 1. 汇款申请列表

### 接口

`GET /api/v1/admin/sop/remittance/list`

### Query 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | int | 否 | 汇款状态：`0=待审核`，`1=审核通过`，`2=驳回`，`3=废弃` |
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
GET /api/v1/admin/sop/remittance/list?status=0&page=1&page_size=20
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
        "remittance_id": 101,
        "task_sop_id": 201,
        "task_bd_id": 11,
        "task_id": 301,
        "product_listing_id": 401,
        "product_url": "https://shop.example.com/products/1",
        "bd_code": "BD001",
        "kol_id": "kol_001",
        "has_budget": 1,
        "default_amount": 500,
        "sop_status": 4,
        "amount": 500,
        "payee_name": "张三",
        "bank_name": "ABC Bank",
        "status": 0,
        "review_remark": null,
        "submitter_name": "BD A",
        "reviewer_name": null,
        "submit_at": 1715000000000,
        "reviewed_at": null,
        "chat_attachment_count": 2,
        "payment_attachment_count": 0
      }
    ]
  }
}
```

### 返回字段说明

| 字段 | 说明 |
| --- | --- |
| `remittance_id` | 汇款申请 ID，审核接口和详情接口使用这个字段 |
| `task_sop_id` | SOP ID |
| `task_bd_id` | `task_bd_relation.id` |
| `task_id` | `task_main.id` |
| `product_listing_id` | 商品链接 ID |
| `product_url` | 商品链接 |
| `bd_code` | BD 编码 |
| `kol_id` | 达人 ID |
| `has_budget` | 是否有预算，`0/1` |
| `default_amount` | 默认预算金额，没有则为 `null` |
| `sop_status` | SOP 状态：`0=建联`，`1=寄样`，`2=回收视频`，`3=结束`，`4=汇款阶段`，`5=终止` |
| `amount` | 汇款金额 |
| `payee_name` | 收款人 |
| `bank_name` | 银行名称 |
| `status` | 汇款申请状态 |
| `review_remark` | 审核备注 |
| `submitter_name` | 提交人名称 |
| `reviewer_name` | 审核人名称 |
| `submit_at` | 提交时间，UTC 毫秒时间戳 |
| `reviewed_at` | 审核时间，UTC 毫秒时间戳，没有则为 `null` |
| `chat_attachment_count` | 聊天截图数量 |
| `payment_attachment_count` | 付款截图数量 |

---

## 2. 汇款申请详情

### 接口

`GET /api/v1/admin/sop/remittance/detail`

### Query 参数

| 字段            | 类型  | 必填 | 说明        |
| --------------- | ----- | ---- | ----------- |
| `remittance_id` | int64 | 是   | 汇款申请 ID |

### 请求示例

```http
GET /api/v1/admin/sop/remittance/detail?remittance_id=101
```

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "remittance_id": 101,
    "task_sop_id": 201,
    "task_bd_id": 11,
    "task_id": 301,
    "product_listing_id": 401,
    "product_url": "https://shop.example.com/products/1",
    "bd_code": "BD001",
    "kol_id": "kol_001",
    "has_budget": 1,
    "default_amount": 500,
    "sop_status": 4,
    "terminate_remark": null,
    "amount": 500,
    "payee_name": "张三",
    "bank_name": "ABC Bank",
    "bank_card_no": "622200******1234",
    "status": 0,
    "review_remark": null,
    "submitter_id": 10,
    "reviewer_id": null,
    "submitter_name": "BD A",
    "reviewer_name": null,
    "submit_at": 1715000000000,
    "reviewed_at": null,
    "chat_attachments": [
      {
        "r2_file_id": 9001,
        "file_key": "shopsystem/remittance-images/xxx.png",
        "file_name": "chat-1.png",
        "access_url": "https://example.com/presigned",
        "access_url_expired_at": 1715003600000,
        "sort": 0
      }
    ],
    "payment_attachments": []
  }
}
```

### 返回字段说明

| 字段                  | 说明                                       |
| --------------------- | ------------------------------------------ |
| `bank_card_no`        | 银行卡号                                   |
| `terminate_remark`    | 当 SOP 已终止时返回终止原因，否则为 `null` |
| `chat_attachments`    | BD 上传的聊天截图                          |
| `payment_attachments` | Admin 上传的付款截图                       |

附件字段：

| 字段                    | 说明                                    |
| ----------------------- | --------------------------------------- |
| `r2_file_id`            | 文件 ID，后续若要替换付款截图可继续使用 |
| `file_key`              | R2 文件 key                             |
| `file_name`             | 文件名                                  |
| `access_url`            | 已签名访问链接，可直接预览/打开         |
| `access_url_expired_at` | 访问链接过期时间，UTC 毫秒时间戳        |
| `sort`                  | 排序                                    |

---

## 3. 审核汇款申请

### 接口

`POST /api/v1/admin/sop/remittance/review`

### 说明

支持两种用法：

1. 审核申请
2. 审核通过后，后续单独补付款截图

付款截图不是审核通过时强制必须上传，可以后补。

### 请求体

```json
{
  "list": [
    {
      "remittance_id": 101,
      "status": 1,
      "amount": 500,
      "review_remark": "先审核通过，付款截图稍后补",
      "payment_attachment_file_ids": []
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `list` | array | 是 | 至少 1 条 |
| `list[].remittance_id` | int64 | 是 | 汇款申请 ID |
| `list[].status` | int | 否 | 目标状态：`1=审核通过`，`2=驳回`，`3=废弃` |
| `list[].amount` | float64 | 否 | 可修改汇款金额，必须大于 0 |
| `list[].review_remark` | string | 否 | 审核备注；传空字符串会清空 |
| `list[].payment_attachment_file_ids` | int64[] | 否 | 付款截图文件 ID 列表；传了会覆盖旧的付款截图 |

### 场景 1：审核通过但暂时不上传付款截图

```json
{
  "list": [
    {
      "remittance_id": 101,
      "status": 1,
      "review_remark": "先通过，待打款后补付款截图",
      "payment_attachment_file_ids": []
    }
  ]
}
```

### 场景 2：后续补付款截图，不改状态

```json
{
  "list": [
    {
      "remittance_id": 101,
      "payment_attachment_file_ids": [9002, 9003]
    }
  ]
}
```

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "remittance_id": 101,
      "success": true,
      "status": 1
    }
  ]
}
```

### 返回字段说明

| 字段            | 说明                     |
| --------------- | ------------------------ |
| `remittance_id` | 对应的汇款申请 ID        |
| `success`       | 该条是否处理成功         |
| `status`        | 当前汇款状态，成功时返回 |
| `reason`        | 失败原因，失败时返回     |

---

## 4. 上传付款截图：生成上传链接

### 接口

`POST /api/v1/file/upload-url`

### 说明

Admin 上传付款截图前，先获取 R2 上传签名链接。

汇款图片仅支持：

- `jpg`
- `jpeg`
- `png`

### 请求体

```json
{
  "biz_type": "remittance-images",
  "file_name": "payment-1.png",
  "content_type": "image/png"
}
```

### 字段说明

| 字段           | 类型   | 必填 | 说明                        |
| -------------- | ------ | ---- | --------------------------- |
| `biz_type`     | string | 是   | 固定传 `remittance-images`  |
| `file_name`    | string | 是   | 原始文件名                  |
| `content_type` | string | 是   | 文件 MIME，例如 `image/png` |

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "file_key": "shopsystem/remittance-images/xxx.png",
    "file_name": "payment-1.png",
    "method": "PUT",
    "upload_url": "https://example.com/presigned-upload",
    "headers": {
      "Content-Type": "image/png"
    },
    "expired_at": 1715001800000
  }
}
```

### 前端上传步骤

1. 调这个接口拿 `upload_url`
2. 前端直接把文件 PUT 到 `upload_url`
3. 上传成功后，再调用“登记文件元数据”接口

---

## 5. 上传付款截图：登记文件元数据

### 接口

`POST /api/v1/file/register`

### 说明

上传到 R2 成功后，登记文件，拿到 `r2_file_id`。  
后续 `payment_attachment_file_ids` 传的就是这里返回的 `id`。

### 请求体

```json
{
  "file_key": "shopsystem/remittance-images/xxx.png",
  "file_name": "payment-1.png"
}
```

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": 9002,
    "file_key": "shopsystem/remittance-images/xxx.png",
    "file_name": "payment-1.png"
  }
}
```

### 返回字段说明

| 字段 | 说明 |
| --- | --- |
| `id` | `r2_file.id`，审核接口里作为 `payment_attachment_file_ids` 使用 |
| `file_key` | R2 文件 key |
| `file_name` | 文件名 |
