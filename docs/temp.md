# Admin 端 BD 模块接口文档

适用范围：

- 前端：`vben admin + vue3`
- 角色：`admin`
- 模块：`BD 模块 / SOP / 视频回收 / 汇款审核`

说明：

- 本文档只整理“当前后端已经实现”的 admin 侧接口
- 所有时间戳统一为 `UTC 毫秒时间戳`
- 所有接口都需要登录态，走 `Authorization` / `accessToken`
- 所有接口响应外层统一为：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

---

## 1. 当前已实现接口总览

已实现：

1. `POST /api/v1/admin/kol-prepare/review` 达人筹备审核
2. `POST /api/v1/admin/sop-budget/review` 建联预算审核
3. `POST /api/v1/admin/sop/sample/review` 寄样申请审核
4. `POST /api/v1/admin/sop/remittance/review` 汇款申请审核
5. `GET /api/v1/admin/videos` 视频列表查询
6. `PUT /api/v1/admin/videos/score` 视频批量打分

通用文件接口：

1. `POST /api/v1/file/upload-url`
2. `POST /api/v1/file/register`
3. `POST /api/v1/file/access-url`

当前未实现：

1. admin 侧“达人筹备列表查询”接口
2. admin 侧“预算申请列表/详情查询”接口
3. admin 侧“寄样申请列表/详情查询”接口
4. admin 侧“汇款申请列表/详情查询”接口

也就是说，admin 当前以“审核写接口 + 视频查询接口”为主，很多列表页如果要做，还需要继续补后端。

---

## 2. 通用文件接口

用途：

- admin 审核汇款时，上传“付款截图”
- 先拿上传链接
- 上传到 R2
- 再登记文件，拿到 `r2_file.id`
- 最后把 `r2_file.id` 传给汇款审核接口

### 2.1 获取上传链接

**接口路径**

`POST /api/v1/file/upload-url`

**请求参数**

| 字段           | 类型     | 必填 | 说明                                |
| -------------- | -------- | ---- | ----------------------------------- |
| `biz_type`     | `string` | 是   | 汇款图片固定传：`remittance-images` |
| `file_name`    | `string` | 是   | 原始文件名                          |
| `content_type` | `string` | 是   | 仅支持 `image/jpeg` / `image/png`   |

**请求示例**

```json
{
  "biz_type": "remittance-images",
  "file_name": "payment-1.png",
  "content_type": "image/png"
}
```

**响应参数**

| 字段         | 类型     | 说明               |
| ------------ | -------- | ------------------ |
| `file_key`   | `string` | 后端生成的 R2 key  |
| `file_name`  | `string` | 原始文件名         |
| `method`     | `string` | 一般为 `PUT`       |
| `upload_url` | `string` | 预签名上传地址     |
| `headers`    | `object` | 上传时要带的请求头 |
| `expired_at` | `number` | 链接过期时间       |

### 2.2 登记文件

**接口路径**

`POST /api/v1/file/register`

**请求参数**

| 字段        | 类型     | 必填 | 说明             |
| ----------- | -------- | ---- | ---------------- |
| `file_key`  | `string` | 是   | 上一步返回的 key |
| `file_name` | `string` | 是   | 原始文件名       |

**响应参数**

| 字段        | 类型     | 说明         |
| ----------- | -------- | ------------ |
| `id`        | `number` | `r2_file.id` |
| `file_key`  | `string` | 文件 key     |
| `file_name` | `string` | 文件名       |

### 2.3 获取临时访问链接

**接口路径**

`POST /api/v1/file/access-url`

**请求参数**

| 字段       | 类型     | 必填 | 说明     |
| ---------- | -------- | ---- | -------- |
| `file_key` | `string` | 是   | 文件 key |

**响应参数**

| 字段         | 类型     | 说明                |
| ------------ | -------- | ------------------- |
| `file_key`   | `string` | 文件 key            |
| `file_name`  | `string` | 文件名              |
| `method`     | `string` | 一般为 `GET`        |
| `access_url` | `string` | 临时访问链接        |
| `expired_at` | `number` | 当前固定 1 小时过期 |

---

## 3. 达人筹备审核

### 3.1 批量审核达人筹备

**接口路径**

`POST /api/v1/admin/kol-prepare/review`

**请求参数**

| 字段   | 类型    | 必填 | 说明                |
| ------ | ------- | ---- | ------------------- |
| `list` | `array` | 是   | 审核列表，至少 1 条 |

`list` 子项：

| 字段         | 类型     | 必填 | 说明                                 |
| ------------ | -------- | ---- | ------------------------------------ |
| `prepare_id` | `number` | 是   | 达人筹备记录 ID                      |
| `status`     | `number` | 是   | 仅支持：`2=审核不通过`、`3=审核通过` |
| `reason`     | `string` | 否   | 审核备注                             |

**请求示例**

```json
{
  "list": [
    {
      "prepare_id": 11,
      "status": 3,
      "reason": "通过"
    }
  ]
}
```

**响应参数**

返回数组，每条对应一条审核结果：

| 字段         | 类型             | 说明            |
| ------------ | ---------------- | --------------- |
| `prepare_id` | `number`         | 达人筹备记录 ID |
| `success`    | `boolean`        | 是否成功        |
| `reason`     | `string \| null` | 失败原因        |

**业务说明**

- 审核通过后，后端会自动：
  1. 创建 `task_sop`
  2. 创建 `sop_contact`
  3. SOP 初始状态为 `0=建联`

---

## 4. 建联预算审核

### 4.1 批量审核预算申请

**接口路径**

`POST /api/v1/admin/sop-budget/review`

**请求参数**

| 字段   | 类型    | 必填 | 说明                |
| ------ | ------- | ---- | ------------------- |
| `list` | `array` | 是   | 审核列表，至少 1 条 |

`list` 子项：

| 字段                    | 类型     | 必填 | 说明                            |
| ----------------------- | -------- | ---- | ------------------------------- |
| `budget_application_id` | `number` | 是   | 预算申请 ID                     |
| `status`                | `number` | 是   | `1=审核通过`、`2=驳回`          |
| `reason`                | `string` | 否   | 驳回原因，`status=2` 时建议必传 |

**响应参数**

| 字段                    | 类型             | 说明             |
| ----------------------- | ---------------- | ---------------- |
| `budget_application_id` | `number`         | 预算申请 ID      |
| `success`               | `boolean`        | 是否成功         |
| `reason`                | `string \| null` | 失败原因         |
| `budget_status`         | `number \| null` | 审核后的预算状态 |
| `sop_status`            | `number \| null` | 当前 SOP 状态    |

**业务说明**

- 审核通过后，后端会同步更新：
  - `sop_budget_application.status`
  - `sop_contact.budget_status`
- 如果满足建联阶段进入下一步的条件，后端会自动把：
  - `task_sop.status: 0 -> 1`
  - 即进入 `寄样阶段`

---

## 5. 寄样申请审核

### 5.1 审核/补充寄样申请

**接口路径**

`POST /api/v1/admin/sop/sample/review`

**请求参数**

| 字段   | 类型    | 必填 | 说明                |
| ------ | ------- | ---- | ------------------- |
| `list` | `array` | 是   | 审核列表，至少 1 条 |

`list` 子项：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `request_id` | `number` | 是 | 寄样申请记录 ID |
| `status` | `number` | 否 | `1=通过`、`2=驳回`、`3=废弃`；不传表示只补充信息 |
| `reason` | `string` | 否 | 驳回原因 |
| `address` | `string` | 否 | 可修改地址 |
| `quantity` | `number` | 否 | 可修改样品数量，最小 1 |
| `tracking_number` | `string` | 否 | 快递单号 |
| `delivered_at` | `number` | 否 | 发货时间 |
| `package_received` | `number` | 否 | `0=未收到`、`1=收到` |

**请求示例**

```json
{
  "list": [
    {
      "request_id": 21,
      "status": 1,
      "address": "Bangkok xxx",
      "quantity": 2,
      "tracking_number": "SF123456",
      "delivered_at": 1746350000000,
      "package_received": 0
    }
  ]
}
```

**响应参数**

| 字段               | 类型             | 说明             |
| ------------------ | ---------------- | ---------------- |
| `request_id`       | `number`         | 寄样申请记录 ID  |
| `success`          | `boolean`        | 是否成功         |
| `reason`           | `string \| null` | 失败原因         |
| `request_status`   | `number \| null` | 审核后申请状态   |
| `sop_status`       | `number \| null` | 当前 SOP 状态    |
| `package_received` | `number \| null` | 当前包裹收到状态 |

**业务说明**

- 该接口既能“审核状态”，也能“补充物流信息”
- `status` 可不传
- 若当前生效的寄样记录最终变成：
  - `package_received = 1`
  - 且物流信息完整
- 后端会自动把：
  - `task_sop.status: 1 -> 2`
  - 即进入 `视频回收阶段`

---

## 6. 汇款申请审核

### 6.1 审核/补充汇款申请

**接口路径**

`POST /api/v1/admin/sop/remittance/review`

**请求参数**

| 字段   | 类型    | 必填 | 说明                |
| ------ | ------- | ---- | ------------------- |
| `list` | `array` | 是   | 审核列表，至少 1 条 |

`list` 子项：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `remittance_id` | `number` | 是 | 汇款申请记录 ID |
| `status` | `number` | 否 | `1=通过`、`2=驳回`、`3=废弃`；不传表示只补充信息 |
| `amount` | `number` | 否 | 可修改实际汇款金额，需大于 0 |
| `review_remark` | `string` | 否 | 审核备注 |
| `payment_attachment_file_ids` | `number[]` | 否 | 付款截图对应的 `r2_file.id` 列表 |

**请求示例**

```json
{
  "list": [
    {
      "remittance_id": 31,
      "status": 1,
      "amount": 520,
      "review_remark": "已打款",
      "payment_attachment_file_ids": [101, 102]
    }
  ]
}
```

**响应参数**

| 字段            | 类型             | 说明            |
| --------------- | ---------------- | --------------- |
| `remittance_id` | `number`         | 汇款申请记录 ID |
| `success`       | `boolean`        | 是否成功        |
| `reason`        | `string \| null` | 失败原因        |
| `status`        | `number \| null` | 审核后状态      |

**业务说明**

- `status` 可不传，可只补充：
  - 金额
  - 审核备注
  - 付款截图
- 审核通过时，必须保证该条记录最终存在至少 1 张付款截图
- 如果 `status=1` 但没有付款截图，会返回失败原因：
  - `审核通过时必须上传付款截图`
- 当前该接口不会自动把 SOP 改为结束
- SOP 是否允许结束，由 BD 侧 `PUT /api/v1/bd/sop/complete` 去校验

---

## 7. 视频列表查询

### 7.1 查询视频列表

**接口路径**

`GET /api/v1/admin/videos`

**请求参数**

| 字段                | 类型     | 必填 | 说明               |
| ------------------- | -------- | ---- | ------------------ |
| `kol_id`            | `string` | 否   | 达人 ID            |
| `bd_code`           | `string` | 否   | BD 编码            |
| `upload_time_start` | `number` | 否   | 上传时间开始       |
| `upload_time_end`   | `number` | 否   | 上传时间结束       |
| `score_min`         | `number` | 否   | 最低分，0-100      |
| `score_max`         | `number` | 否   | 最高分，0-100      |
| `play_count_min`    | `number` | 否   | 播放量最小值       |
| `play_count_max`    | `number` | 否   | 播放量最大值       |
| `gmv_min`           | `number` | 否   | GMV 最小值         |
| `gmv_max`           | `number` | 否   | GMV 最大值         |
| `page`              | `number` | 是   | 页码，从 1 开始    |
| `page_size`         | `number` | 是   | 每页数量，最大 200 |

**响应参数**

顶层：

| 字段        | 类型     | 说明     |
| ----------- | -------- | -------- |
| `total`     | `number` | 总数     |
| `page`      | `number` | 当前页   |
| `page_size` | `number` | 每页大小 |
| `list`      | `array`  | 视频列表 |

列表项：

| 字段                 | 类型             | 说明        |
| -------------------- | ---------------- | ----------- |
| `id`                 | `number`         | 视频 ID     |
| `kol_id`             | `string`         | 达人 ID     |
| `sop_id`             | `number`         | SOP ID      |
| `bd_code`            | `string`         | BD 编码     |
| `video_url`          | `string`         | 视频链接    |
| `score`              | `number \| null` | 当前评分    |
| `upload_time`        | `number \| null` | 上传时间    |
| `ads_code`           | `string \| null` | 广告码      |
| `product_listing_id` | `number`         | 产品链接 ID |
| `play_count`         | `number`         | 播放量      |
| `gmv`                | `number`         | GMV         |
| `commission`         | `number`         | 佣金        |
| `created_at`         | `number`         | 创建时间    |
| `updated_at`         | `number`         | 更新时间    |

**请求示例**

```text
GET /api/v1/admin/videos?page=1&page_size=20&bd_code=bd02&score_min=60&score_max=100
```

---

## 8. 视频批量打分

### 8.1 批量更新视频评分

**接口路径**

`PUT /api/v1/admin/videos/score`

**请求参数**

| 字段   | 类型    | 必填 | 说明                |
| ------ | ------- | ---- | ------------------- |
| `list` | `array` | 是   | 打分列表，至少 1 条 |

`list` 子项：

| 字段       | 类型     | 必填 | 说明        |
| ---------- | -------- | ---- | ----------- |
| `video_id` | `number` | 是   | 视频 ID     |
| `score`    | `number` | 是   | 评分，0-100 |

**请求示例**

```json
{
  "list": [
    {
      "video_id": 88,
      "score": 90
    },
    {
      "video_id": 89,
      "score": 75
    }
  ]
}
```

**响应参数**

每条结果：

| 字段       | 类型             | 说明         |
| ---------- | ---------------- | ------------ |
| `video_id` | `number`         | 视频 ID      |
| `success`  | `boolean`        | 是否成功     |
| `reason`   | `string \| null` | 失败原因     |
| `score`    | `number \| null` | 成功后的评分 |

---

## 9. 状态值约定

### 9.1 SOP 状态

| 值  | 含义     |
| --- | -------- |
| `0` | 建联     |
| `1` | 寄样     |
| `2` | 回收视频 |
| `3` | 结束     |
| `4` | 汇款阶段 |
| `5` | 终止     |

### 9.2 达人筹备状态

| 值  | 含义       |
| --- | ---------- |
| `0` | 待审核     |
| `1` | 审核中     |
| `2` | 审核不通过 |
| `3` | 审核通过   |

### 9.3 预算审核状态

| 值  | 含义     |
| --- | -------- |
| `0` | 待审核   |
| `1` | 审核通过 |
| `2` | 驳回     |

### 9.4 寄样申请状态

| 值  | 含义   |
| --- | ------ |
| `0` | 待审核 |
| `1` | 通过   |
| `2` | 驳回   |
| `3` | 废弃   |

### 9.5 汇款申请状态

| 值  | 含义   |
| --- | ------ |
| `0` | 待审核 |
| `1` | 通过   |
| `2` | 驳回   |
| `3` | 废弃   |

---

## 10. 前端实现建议

当前 admin 端如果要开始做页面，建议分两类处理：

1. 可以直接开做：
   - 达人筹备审核弹窗
   - 预算审核弹窗
   - 寄样审核/补物流弹窗
   - 汇款审核/补付款截图弹窗
   - 视频列表页
   - 视频批量打分页

2. 需要注意还缺后端列表接口：
   - 筹备审核列表
   - 预算申请列表
   - 寄样申请列表
   - 汇款申请列表
