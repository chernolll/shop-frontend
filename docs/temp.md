# BD 用户汇款阶段前端对接文档

适用范围：

- 前端：`vben admin + vue3`
- 角色：`BD` 用户
- 模块：`SOP -> 汇款阶段`

说明：

- 本文档只整理 BD 用户需要调用的接口
- `admin` 审核接口不在本文档内
- 图片上传走通用文件接口，汇款业务接口只接收 `r2_file_id`

---

## 1. 模块实现流程

### 1.1 页面进入流程

1. 前端已有一条 `task_sop` 记录
2. 进入“汇款阶段”页面时，先调用“汇款申请记录列表”
3. 用户点击某条记录时，再调用“汇款申请详情”
4. 用户新提交汇款申请时：
   - 先上传聊天记录截图
   - 上传成功后拿到 `r2_file_id`
   - 再调用“提交汇款申请”
5. 如果 admin 已审核并补了付款截图，用户在“汇款申请详情”里可以看到付款截图访问链接
6. 当所有未废弃汇款申请都审核通过且资料完整后，BD 才可以点击“完成 SOP”
7. 提交时，需要用户二次确认

---

## 2. 通用文件上传接口

### 2.1 获取上传链接

**接口路径**

`POST /api/v1/file/upload-url`

**请求参数**

| 字段           | 类型     | 必填 | 说明                                     |
| -------------- | -------- | ---- | ---------------------------------------- |
| `biz_type`     | `string` | 是   | 固定传：`remittance-images`              |
| `file_name`    | `string` | 是   | 原始文件名，例：`chat-1.png`             |
| `content_type` | `string` | 是   | 文件 MIME，例：`image/png`、`image/jpeg` |

**请求示例**

```json
{
  "biz_type": "remittance-images",
  "file_name": "chat-1.png",
  "content_type": "image/png"
}
```

**响应参数**

| 字段         | 类型     | 说明                                          |
| ------------ | -------- | --------------------------------------------- |
| `file_key`   | `string` | 后端生成的 R2 对象 key                        |
| `file_name`  | `string` | 原始文件名                                    |
| `method`     | `string` | 上传方法，一般为 `PUT`                        |
| `upload_url` | `string` | R2 预签名上传地址                             |
| `headers`    | `object` | 上传时要带的请求头，当前至少有 `Content-Type` |
| `expired_at` | `number` | UTC 毫秒时间戳，上传链接过期时间              |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "file_key": "shopsystem/remittance-images/2026/05/04/1746350000000_xxx.png",
    "file_name": "chat-1.png",
    "method": "PUT",
    "upload_url": "https://xxx",
    "headers": {
      "Content-Type": "image/png"
    },
    "expired_at": 1746350900000
  }
}
```

### 2.2 登记文件

**接口路径**

`POST /api/v1/file/register`

**请求参数**

| 字段        | 类型     | 必填 | 说明                    |
| ----------- | -------- | ---- | ----------------------- |
| `file_key`  | `string` | 是   | 上一步返回的 `file_key` |
| `file_name` | `string` | 是   | 原始文件名              |

**请求示例**

```json
{
  "file_key": "shopsystem/remittance-images/2026/05/04/1746350000000_xxx.png",
  "file_name": "chat-1.png"
}
```

**响应参数**

| 字段        | 类型     | 说明                               |
| ----------- | -------- | ---------------------------------- |
| `id`        | `number` | `r2_file.id`，后续业务接口要传这个 |
| `file_key`  | `string` | 文件 key                           |
| `file_name` | `string` | 文件名                             |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12,
    "file_key": "shopsystem/remittance-images/2026/05/04/1746350000000_xxx.png",
    "file_name": "chat-1.png"
  }
}
```

---

## 3. 汇款申请记录列表

### 3.1 查询汇款申请记录列表

**接口路径**

`GET /api/v1/bd/sop/remittance/list?task_sop_id=:taskSopId`

**请求参数**

| 字段          | 类型     | 必填 | 说明        |
| ------------- | -------- | ---- | ----------- |
| `task_sop_id` | `number` | 是   | 当前 SOP ID |

**响应参数**

顶层：

| 字段               | 类型             | 说明                         |
| ------------------ | ---------------- | ---------------------------- |
| `task_sop_id`      | `number`         | 当前 SOP ID                  |
| `has_budget`       | `number`         | 是否有预算，`0/1`            |
| `default_amount`   | `number \| null` | 默认汇款金额，来源于建联预算 |
| `sop_status`       | `number`         | 当前 SOP 状态                |
| `terminate_remark` | `string \| null` | 若 SOP 已终止，返回终止原因  |
| `list`             | `array`          | 汇款申请记录列表             |

列表项：

| 字段          | 类型             | 说明                                     |
| ------------- | ---------------- | ---------------------------------------- |
| `id`          | `number`         | 汇款申请记录 ID                          |
| `amount`      | `number`         | 当前记录汇款金额                         |
| `payee_name`  | `string`         | 收款人姓名                               |
| `bank_name`   | `string`         | 银行名称                                 |
| `status`      | `number`         | 状态：`0-待审核，1-通过，2-驳回，3-废弃` |
| `submit_at`   | `number`         | UTC 毫秒时间戳                           |
| `reviewed_at` | `number \| null` | UTC 毫秒时间戳                           |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_sop_id": 35,
    "has_budget": 1,
    "default_amount": 500,
    "sop_status": 4,
    "terminate_remark": null,
    "list": [
      {
        "id": 101,
        "amount": 500,
        "payee_name": "张三",
        "bank_name": "ABC Bank",
        "status": 0,
        "submit_at": 1746350000000,
        "reviewed_at": null
      }
    ]
  }
}
```

前端建议：

- 这个接口只用于列表展示
- 不返回图片访问链接
- 点击某条记录后，再调用详情接口

---

## 4. 汇款申请详情

### 4.1 查询单条汇款申请详情

**接口路径**

`GET /api/v1/bd/sop/remittance/detail?id=:remittanceId`

**请求参数**

| 字段 | 类型     | 必填 | 说明            |
| ---- | -------- | ---- | --------------- |
| `id` | `number` | 是   | 汇款申请记录 ID |

**响应参数**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 汇款申请记录 ID |
| `task_sop_id` | `number` | 当前 SOP ID |
| `has_budget` | `number` | 是否有预算，`0/1` |
| `default_amount` | `number \| null` | 建联预算默认金额 |
| `sop_status` | `number` | 当前 SOP 状态 |
| `terminate_remark` | `string \| null` | 若终止则返回 |
| `amount` | `number` | 汇款金额 |
| `payee_name` | `string` | 收款人姓名 |
| `bank_name` | `string` | 银行名称 |
| `bank_card_no` | `string` | 银行卡号 |
| `status` | `number` | 状态：`0-待审核，1-通过，2-驳回，3-废弃` |
| `review_remark` | `string \| null` | 审核备注 |
| `submit_at` | `number` | UTC 毫秒时间戳 |
| `reviewed_at` | `number \| null` | UTC 毫秒时间戳 |
| `chat_attachments` | `array` | 聊天记录截图 |
| `payment_attachments` | `array` | 付款截图 |

附件项字段：

| 字段                    | 类型     | 说明                                |
| ----------------------- | -------- | ----------------------------------- |
| `r2_file_id`            | `number` | 文件 ID                             |
| `file_key`              | `string` | 文件 key                            |
| `file_name`             | `string` | 文件名                              |
| `access_url`            | `string` | 临时访问链接                        |
| `access_url_expired_at` | `number` | UTC 毫秒时间戳，当前固定 1 小时过期 |
| `sort`                  | `number` | 排序                                |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 101,
    "task_sop_id": 35,
    "has_budget": 1,
    "default_amount": 500,
    "sop_status": 4,
    "terminate_remark": null,
    "amount": 500,
    "payee_name": "张三",
    "bank_name": "ABC Bank",
    "bank_card_no": "123456789",
    "status": 1,
    "review_remark": "已处理",
    "submit_at": 1746350000000,
    "reviewed_at": 1746353600000,
    "chat_attachments": [
      {
        "r2_file_id": 12,
        "file_key": "shopsystem/remittance-images/2026/05/04/1746350000000_xxx.png",
        "file_name": "chat-1.png",
        "access_url": "https://xxx",
        "access_url_expired_at": 1746357200000,
        "sort": 0
      }
    ],
    "payment_attachments": [
      {
        "r2_file_id": 15,
        "file_key": "shopsystem/remittance-images/2026/05/04/1746351000000_yyy.png",
        "file_name": "payment-1.png",
        "access_url": "https://yyy",
        "access_url_expired_at": 1746357200000,
        "sort": 0
      }
    ]
  }
}
```

前端建议：

- `access_url` 可在 1 小时内复用
- 若图片加载失败或过期，再重新请求详情接口

---

## 5. 提交汇款申请

### 5.1 BD 提交一条新的汇款申请

**接口路径**

`POST /api/v1/bd/sop/remittance`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `task_sop_id` | `number` | 是 | 当前 SOP ID |
| `amount` | `number` | 是 | 汇款金额，建议前端默认带建联预算 |
| `payee_name` | `string` | 是 | 收款人姓名 |
| `bank_name` | `string` | 是 | 银行名称 |
| `bank_card_no` | `string` | 是 | 银行卡号 |
| `chat_attachment_file_ids` | `number[]` | 是 | 聊天记录截图的 `r2_file_id` 列表，至少 1 张 |

**请求示例**

```json
{
  "task_sop_id": 35,
  "amount": 500,
  "payee_name": "张三",
  "bank_name": "ABC Bank",
  "bank_card_no": "123456789",
  "chat_attachment_file_ids": [12, 13]
}
```

**响应参数**

| 字段     | 类型     | 说明                        |
| -------- | -------- | --------------------------- |
| `id`     | `number` | 新建的汇款申请记录 ID       |
| `status` | `number` | 当前状态，固定为 `0=待审核` |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 101,
    "status": 0
  }
}
```

业务说明：

- 每次提交都会新建一条记录
- 不会覆盖之前的汇款申请
- BD 不传付款截图，付款截图由 admin 审核时补

---

## 6. 废弃汇款申请

### 6.1 BD 废弃自己的待审核汇款申请

**接口路径**

`PUT /api/v1/bd/sop/remittance/abandon`

**请求参数**

| 字段            | 类型     | 必填 | 说明                    |
| --------------- | -------- | ---- | ----------------------- |
| `task_sop_id`   | `number` | 是   | 当前 SOP ID             |
| `remittance_id` | `number` | 是   | 要废弃的汇款申请记录 ID |

**请求示例**

```json
{
  "task_sop_id": 35,
  "remittance_id": 101
}
```

**响应参数**

| 字段     | 类型     | 说明                   |
| -------- | -------- | ---------------------- |
| `id`     | `number` | 汇款申请记录 ID        |
| `status` | `number` | 废弃后状态，固定为 `3` |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 101,
    "status": 3
  }
}
```

业务说明：

- 仅允许废弃“当前 BD 自己提交”的记录
- 仅允许废弃 `status=0` 的待审核记录

---

## 7. 完成 SOP

### 7.1 BD 手动完成 SOP

**接口路径**

`PUT /api/v1/bd/sop/complete`

**请求参数**

| 字段          | 类型     | 必填 | 说明        |
| ------------- | -------- | ---- | ----------- |
| `task_sop_id` | `number` | 是   | 当前 SOP ID |

**请求示例**

```json
{
  "task_sop_id": 35
}
```

**响应参数**

| 字段         | 类型     | 说明                          |
| ------------ | -------- | ----------------------------- |
| `sop_status` | `number` | 完成后状态，成功时为 `3=结束` |

**响应示例**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sop_status": 3
  }
}
```

有预算时，后端放行完成的条件：

- 当前 `task_sop.status = 4`（汇款阶段）
- 至少存在 1 条未废弃汇款申请
- 所有未废弃汇款申请都必须是 `审核通过`
- 每条未废弃汇款申请都必须：
  - 主信息完整
  - 至少 1 张聊天记录截图
  - 至少 1 张付款截图

如果不满足，后端会返回失败，前端应提示用户不能完成。

---

## 8. 前端建议实现顺序

### 8.1 提交新汇款申请

1. 调用 `GET /api/v1/bd/sop/remittance/list`
2. 读取：
   - `has_budget`
   - `default_amount`
   - `sop_status`
3. 用户选择聊天记录图片
4. 每张图依次执行：
   - `POST /api/v1/file/upload-url`
   - 直接上传到 `upload_url`
   - `POST /api/v1/file/register`
   - 收集返回的 `r2_file.id`
5. 调用 `POST /api/v1/bd/sop/remittance`
6. 提交成功后刷新列表

### 8.2 查看某条申请详情

1. 列表页点击某条记录
2. 调用 `GET /api/v1/bd/sop/remittance/detail?id=...`
3. 渲染主信息、聊天记录截图、付款截图、审核状态、审核备注
4. 图片过期时重新请求详情接口

### 8.3 废弃待审核申请

1. 仅当 `status=0` 时显示“废弃”按钮
2. 调用 `PUT /api/v1/bd/sop/remittance/abandon`
3. 成功后刷新列表

### 8.4 完成 SOP

1. 用户点击“完成”
2. 调用 `PUT /api/v1/bd/sop/complete`
3. 如果返回成功：
   - 更新当前 SOP 状态为 `3`
   - 跳转或刷新页面
4. 如果返回失败：
   - 提示用户还有未通过或未补全的汇款申请

---

## 9. 状态值约定

### 9.1 SOP 状态

| 值  | 含义     |
| --- | -------- |
| `0` | 建联     |
| `1` | 送样     |
| `2` | 回收视频 |
| `3` | 结束     |
| `4` | 汇款阶段 |
| `5` | 终止     |

### 9.2 汇款申请状态

| 值  | 含义     |
| --- | -------- |
| `0` | 待审核   |
| `1` | 审核通过 |
| `2` | 审核驳回 |
| `3` | 废弃     |

### 9.3 汇款附件类型

| 值  | 含义         |
| --- | ------------ |
| `1` | 聊天记录截图 |
| `2` | 付款截图     |
