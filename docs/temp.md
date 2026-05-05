# Admin KOL 达人模块需求文档

本文档仅描述当前后端已实现的 admin 达人模块接口，供前端使用。

---

## 1. 达人列表

`GET /api/v1/admin/kols`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `kol_id` | string | 否 | 达人 ID，前缀匹配 |
| `status` | int | 否 | 达人状态：`1=正常`，`2=流失`，`3=黑名单` |
| `belong_bd_code` | string | 否 | 所属 BD 编码，精确匹配 |
| `current_prepare_bd_code` | string | 否 | 当前筹备占用 BD 编码，精确匹配 |
| `is_paid` | int | 否 | 是否付费：`0=否`，`1=是` |
| `followers_min` | int64 | 否 | 粉丝数下限 |
| `followers_max` | int64 | 否 | 粉丝数上限 |
| `score_min` | number | 否 | 权重分下限 |
| `score_max` | number | 否 | 权重分上限 |
| `entry_time_start` | int64 | 否 | 录入时间起，UTC 毫秒时间戳 |
| `entry_time_end` | int64 | 否 | 录入时间止，UTC 毫秒时间戳 |
| `page` | int | 是 | 页码，从 1 开始 |
| `page_size` | int | 是 | 每页条数，最大 200 |

### 成功响应

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "kol_id": "KOL001",
      "kol_link": "https://example.com/kol/1",
      "followers": 120000,
      "is_paid": 1,
      "cooperation_fee": 300,
      "contact_info": "telegram:xxx",
      "belong_bd_code": "BD001",
      "belong_bd_name": "张三",
      "current_prepare_bd_code": "BD001",
      "current_prepare_bd_name": "张三",
      "status": 1,
      "score": 88.5,
      "notes": "高意向达人",
      "entry_time": 1775000000000,
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    }
  ]
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `kol_id` | string | 达人 ID |
| `kol_link` | string \| null | 达人主页链接 |
| `followers` | int64 | 粉丝数 |
| `is_paid` | int | 是否付费：`0=否`，`1=是` |
| `cooperation_fee` | number | 合作费 |
| `contact_info` | string \| null | 联系方式 |
| `belong_bd_code` | string \| null | 所属 BD 编码 |
| `belong_bd_name` | string \| null | 所属 BD 名称 |
| `current_prepare_bd_code` | string \| null | 当前筹备占用 BD 编码 |
| `current_prepare_bd_name` | string \| null | 当前筹备占用 BD 名称 |
| `status` | int | 达人状态：`1=正常`，`2=流失`，`3=黑名单` |
| `score` | number | 权重分 |
| `notes` | string \| null | 备注 |
| `entry_time` | int64 | 录入时间，UTC 毫秒时间戳 |
| `created_at` | int64 | 创建时间，UTC 毫秒时间戳 |
| `updated_at` | int64 | 更新时间，UTC 毫秒时间戳 |

---

## 2. 达人详情

`GET /api/v1/admin/kols/detail?kol_id=...`

### 查询参数

| 参数     | 类型   | 必填 | 说明              |
| -------- | ------ | ---- | ----------------- |
| `kol_id` | string | 是   | 达人 ID，精确匹配 |

### 成功响应

```json
{
  "kol_id": "KOL001",
  "kol_link": "https://example.com/kol/1",
  "followers": 120000,
  "is_paid": 1,
  "cooperation_fee": 300,
  "contact_info": "telegram:xxx",
  "belong_bd_code": "BD001",
  "belong_bd_name": "张三",
  "current_prepare_bd_code": "BD001",
  "current_prepare_bd_name": "张三",
  "status": 1,
  "score": 88.5,
  "notes": "高意向达人",
  "entry_time": 1775000000000,
  "created_at": 1775000000000,
  "updated_at": 1775000000000,
  "prepare_pending_count": 1,
  "sop_total_count": 3,
  "sop_active_count": 2,
  "video_count": 5
}
```

### 统计字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `prepare_pending_count` | int | 待审核/审核中的筹备记录数，统计 `status in (0,1)` |
| `sop_total_count` | int | 该达人关联 SOP 总数 |
| `sop_active_count` | int | 进行中的 SOP 数，统计 `status in (0,1,2,4)` |
| `video_count` | int | 视频总数 |

---

## 3. 编辑达人

`PUT /api/v1/admin/kols`

### 请求体

```json
{
  "kol_id": "KOL001",
  "status": 1,
  "score": 90,
  "notes": "重点维护",
  "belong_bd_code": "BD001",
  "followers": 150000,
  "cooperation_fee": 500,
  "contact_info": "telegram:new",
  "is_paid": 1,
  "kol_link": "https://example.com/kol/1"
}
```

### 请求字段说明

| 字段              | 类型   | 必填 | 说明                                     |
| ----------------- | ------ | ---- | ---------------------------------------- |
| `kol_id`          | string | 是   | 达人 ID                                  |
| `status`          | int    | 否   | 达人状态：`1=正常`，`2=流失`，`3=黑名单` |
| `score`           | number | 否   | 权重分，`>= 0`                           |
| `notes`           | string | 否   | 备注，传空字符串表示清空                 |
| `belong_bd_code`  | string | 否   | 所属 BD 编码，传空字符串表示清空归属     |
| `followers`       | int64  | 否   | 粉丝数，`>= 0`                           |
| `cooperation_fee` | number | 否   | 合作费，`>= 0`                           |
| `contact_info`    | string | 否   | 联系方式，传空字符串表示清空             |
| `is_paid`         | int    | 否   | 是否付费：`0=否`，`1=是`                 |
| `kol_link`        | string | 否   | 达人主页链接，传空字符串表示清空         |

### 业务规则

1. 除 `kol_id` 外，至少传一个可编辑字段。
2. 如果传了 `belong_bd_code`：
   - BD 必须存在
   - BD 必须是在职状态
3. 修改 `belong_bd_code` 时，会同时清空 `current_prepare_bd_code`。
4. 如果达人存在进行中的筹备记录或 SOP，则不允许修改 `belong_bd_code`。

### 成功响应

返回更新后的完整达人详情，结构与“达人详情”接口一致。

---

## 4. 删除达人

`DELETE /api/v1/admin/kols?kol_id=...`

### 查询参数

| 参数     | 类型   | 必填 | 说明    |
| -------- | ------ | ---- | ------- |
| `kol_id` | string | 是   | 达人 ID |

### 业务规则

1. 仅做软删除。
2. 如果达人存在进行中的筹备记录或 SOP，不允许删除。

### 成功响应

```json
{
  "kol_id": "KOL001"
}
```

---

## 5. 相关辅助接口

### 5.1 查询 BD 列表

`GET /api/v1/admin/bds`

用于编辑达人归属、创建总任务时选择 BD。

### 5.2 查询商品链接列表

`GET /api/v1/admin/product-listings`

用于创建总任务时选择商品链接。
