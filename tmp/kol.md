# KOL 模块 — 前端 API 文档

> 涵盖 BD 达人筹备（解绑 + 达人池）和 Admin 达人池管理的全部接口。

---

## 1. 通用约定

| 项目     | 说明                                                    |
| -------- | ------------------------------------------------------- |
| Base URL | `/api/v1`                                               |
| 鉴权     | JWT（Header: `Authorization: Bearer <token>`）          |
| 语言     | Header: `X-Language` 可选 `zh` / `en` / `th`，默认 `zh` |
| 时间格式 | 所有时间字段为 **毫秒 Unix 时间戳** (int64)             |
| 响应格式 | `{ "code": 0, "msg": "OK", "data": ... }`               |
| 分页     | `page` 从 1 开始                                        |

---

## 2. BD 端接口

### 2.1 达人筹备预校验

验证 kol_id 列表，返回每个 ID 的状态和可入库原因码。

```
POST /api/v1/bd/validate-kol-prepare
```

**Request Body (JSON):**

```json
{
  "kol_ids": ["kol_001", "kol_002"]
}
```

| 字段    | 类型     | 必填 | 说明                |
| ------- | -------- | ---- | ------------------- |
| kol_ids | string[] | 是   | 达人 ID 列表，min=1 |

**Response `data`:**

```json
{
  "results": [
    {
      "kol_id": "kol_001",
      "is_valid": true,
      "reason_code": 0
    },
    {
      "kol_id": "kol_002",
      "is_valid": false,
      "reason_code": 2
    }
  ]
}
```

| 字段                  | 类型   | 说明             |
| --------------------- | ------ | ---------------- |
| results               | array  | 校验结果列表     |
| results[].kol_id      | string | 达人 ID          |
| results[].is_valid    | bool   | 是否可入库       |
| results[].reason_code | int    | 原因码（见下表） |

**reason_code 含义：**

| code | i18n key         | 含义                 |
| ---- | ---------------- | -------------------- |
| 0    | prepare.reason_0 | 可筹备               |
| 1    | prepare.reason_1 | 任务内重复提交       |
| 2    | prepare.reason_2 | 达人已有所属 BD      |
| 3    | prepare.reason_3 | 达人已被其他 BD 筹备 |
| 4    | prepare.reason_4 | 达人已删除           |
| 5    | prepare.reason_5 | 达人状态异常         |

---

### 2.2 达人筹备入库

将达人加入当前 BD 的筹备列表。

```
POST /api/v1/bd/kol-prepare
```

**Request Body (JSON):**

```json
{
  "list": [
    {
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.0,
      "remark": "优质达人"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| list | array | 是 | 筹备项列表，min=1 |
| list[].kol_id | string | 是 | 达人 ID |
| list[].kol_url | string | 否 | 达人主页链接 |
| list[].has_budget | int | 是 | 有无预算：0-无, 1-有 |
| list[].budget_amount | float64\|null | 否 | 预算金额（has_budget=1 时填写） |
| list[].remark | string\|null | 否 | 备注 |

**Response `data`:** `null`

**业务规则：**

- 入库时自动同步到 `kol_candidate`（如果尚不存在且不在 `kol` 主表）
- 如果 kol_id 已在当前 BD 的筹备列表中，自动跳过

---

### 2.3 达人筹备列表（我的）

查询当前 BD 自己的筹备记录。

```
GET /api/v1/bd/kol-prepare
```

**Query Parameters:**

| 参数      | 类型   | 必填 | 说明                     |
| --------- | ------ | ---- | ------------------------ |
| kol_id    | string | 否   | 达人 ID 筛选（模糊匹配） |
| page      | int    | 是   | 页码，min=1              |
| page_size | int    | 是   | 每页条数，min=1, max=200 |

**Response `data`:**

```json
{
  "list": [
    {
      "prepare_id": 123,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.0,
      "remark": "优质达人",
      "entry_time": 1715678900000
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| list | array | 筹备记录列表 |
| list[].prepare_id | int64 | 筹备记录 ID（即 `kol_bd_prepare.id`，用于更新/删除） |
| list[].kol_id | string | 达人 ID |
| list[].kol_url | string\|null | 达人主页链接 |
| list[].has_budget | int | 有无预算：0-无, 1-有 |
| list[].budget_amount | float64\|null | 预算金额 |
| list[].remark | string\|null | 备注 |
| list[].entry_time | int64 | 录入时间（ms 时间戳） |
| total | int | 总数 |
| page | int | 当前页码 |
| page_size | int | 每页条数 |

---

### 2.4 编辑达人筹备（更新）

BD 更新自己筹备记录中的预算、备注等信息。

```
PUT /api/v1/bd/kol-prepare
```

**Request Body (JSON):**

```json
{
  "prepare_id": 123,
  "kol_url": "https://example.com/kol1",
  "has_budget": 1,
  "budget_amount": 8000.0,
  "remark": "提高预算"
}
```

| 字段          | 类型          | 必填 | 说明                            |
| ------------- | ------------- | ---- | ------------------------------- |
| prepare_id    | int64         | 是   | 筹备记录 ID                     |
| kol_url       | string\|null  | 否   | 达人主页链接                    |
| has_budget    | int           | 是   | 有无预算：0-无, 1-有            |
| budget_amount | float64\|null | 否   | 预算金额（has_budget=1 时填写） |
| remark        | string\|null  | 否   | 备注                            |

**Response `data`:** `{"prepare_id": 123}`

**业务规则：**

- 只能更新属于当前 BD 自己的筹备记录
- 已软删除的记录不可更新

**Error codes:**

| i18n key                 | HTTP | 说明                          |
| ------------------------ | ---- | ----------------------------- |
| bd.prepare.not_found     | 400  | 筹备记录不存在或不属于当前 BD |
| bd.prepare.update_failed | 400  | 更新失败                      |
| bd.not_bd_person         | 403  | 非 BD 用户                    |

---

### 2.5 达人筹备列表（全局）

查询所有 BD 的筹备记录（含 BD 代号、任务参与数、SOP 状态等扩展字段）。

```
GET /api/v1/bd/kol-prepare/list
```

**Query Parameters:**

| 参数             | 类型   | 必填 | 说明                      |
| ---------------- | ------ | ---- | ------------------------- |
| kol_id           | string | 否   | 达人 ID 筛选（模糊匹配）  |
| has_budget       | int    | 否   | 有无预算筛选：0/1         |
| entry_time_start | int64  | 否   | 录入起始时间（ms 时间戳） |
| entry_time_end   | int64  | 否   | 录入结束时间（ms 时间戳） |
| page             | int    | 是   | 页码，min=1               |
| page_size        | int    | 是   | 每页条数，min=1, max=200  |

**Response `data`:**

```json
{
  "list": [
    {
      "prepare_id": 123,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.0,
      "remark": "优质达人",
      "participated_task_count": 3,
      "entry_time": 1715678900000,
      "sop_id": 456
    }
  ],
  "total": 200,
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| list[].prepare_id | int64 | 筹备记录 ID |
| list[].kol_id | string | 达人 ID |
| list[].kol_url | string\|null | 达人主页链接 |
| list[].has_budget | int | 有无预算 |
| list[].budget_amount | float64\|null | 预算金额 |
| list[].remark | string\|null | 备注 |
| list[].participated_task_count | int | 该达人参与过的任务数量 |
| list[].entry_time | int64 | 录入时间（ms 时间戳） |
| list[].sop_id | int64\|null | 关联的 SOP ID（有进行中 SOP 时有值） |

---

### 2.6 删除达人筹备记录

BD 删除自己的一条筹备记录（软删除）。

```
DELETE /api/v1/bd/kol-prepare
```

**Query Parameters:**

| 参数       | 类型  | 必填 | 说明        |
| ---------- | ----- | ---- | ----------- |
| prepare_id | int64 | 是   | 筹备记录 ID |

**Response `data`:** `{"prepare_id": 123}`

**业务规则：**

- 只能删除属于当前 BD 自己的筹备记录
- 已软删除或已进入 SOP 流程的不可删除

**Error codes:**

| i18n key                      | HTTP | 说明                          |
| ----------------------------- | ---- | ----------------------------- |
| bd.prepare.not_found          | 400  | 筹备记录不存在或不属于当前 BD |
| bd.prepare.delete_not_allowed | 400  | 当前筹备记录不可删除          |

---

### 2.7 达人池列表

查看可供认领的达人池记录。

```
GET /api/v1/bd/kol-pool
```

**Query Parameters:**

| 参数        | 类型   | 必填 | 说明                                |
| ----------- | ------ | ---- | ----------------------------------- |
| kol_id      | string | 否   | 达人 ID 筛选（模糊匹配）            |
| source_type | int    | 否   | 来源类型：1-离职BD释放, 2-Admin上传 |
| has_budget  | int    | 否   | 有无预算筛选：0/1                   |
| page        | int    | 是   | 页码，min=1                         |
| page_size   | int    | 是   | 每页条数，min=1, max=200            |

**Response `data`:**

```json
{
  "list": [
    {
      "id": 2,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.0,
      "remark": "离职释放",
      "source_type": 1,
      "source_bd_code": "BD001",
      "created_at": 1715678900000
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

| 字段                  | 类型          | 说明                            |
| --------------------- | ------------- | ------------------------------- |
| list[].id             | int64         | 达人池记录 ID                   |
| list[].kol_id         | string        | 达人 ID                         |
| list[].kol_url        | string\|null  | 达人主页链接                    |
| list[].has_budget     | int           | 有无预算                        |
| list[].budget_amount  | float64\|null | 预算金额                        |
| list[].remark         | string\|null  | 备注                            |
| list[].source_type    | int           | 来源：1-离职BD释放, 2-Admin上传 |
| list[].source_bd_code | string        | 来源 BD 代号                    |
| list[].created_at     | int64         | 入池时间（ms 时间戳）           |

---

### 2.8 从达人池认领达人

BD 从达人池认领一条记录到自己的筹备列表（事务操作：软删除池记录 + 创建筹备记录）。

```
POST /api/v1/bd/kol-pool/claim
```

**Request Body (JSON):**

```json
{
  "pool_id": 2
}
```

| 字段    | 类型  | 必填 | 说明          |
| ------- | ----- | ---- | ------------- |
| pool_id | int64 | 是   | 达人池记录 ID |

**Response `data`:** `{"pool_id": 2}`

**业务规则：**

- 认领时校验该 kol_id 是否已在当前 BD 筹备列表中，重复则拒绝
- 并发认领同一 pool_id 时，先到先得，后到的返回"不存在"
- 事务保证原子性：池记录软删除 + 筹备记录创建

**Error codes:**

| i18n key | HTTP | 说明 |
| --- | --- | --- |
| bd.kol_pool.not_found | 400 | 达人池记录不存在（已被认领或已删除） |
| bd.kol_pool.kol_already_prepared | 400 | 该达人已在当前 BD 筹备列表中 |
| bd.kol_pool.claim_failed | 400 | 认领失败（DB 写入错误） |
| bd.not_bd_person | 403 | 非 BD 用户 |

---

## 3. Admin 端接口

### 3.1 Admin 达人筹备列表（全局）

```
GET /api/v1/admin/kol-prepare
```

**Query Parameters:** 同 [2.5 达人筹备列表（全局）](#25-达人筹备列表全局)

**Response `data`:** 同 [2.5 达人筹备列表（全局）](#25-达人筹备列表全局)，额外包含 `bd_code` 字段。

---

### 3.2 Admin 编辑达人筹备

Admin 更新任意一条筹备记录的预算、备注等信息。

```
PUT /api/v1/admin/kol-prepare
```

**Request Body (JSON):**

```json
{
  "prepare_id": 123,
  "kol_url": "https://example.com/kol1",
  "has_budget": 1,
  "budget_amount": 8000.0,
  "remark": "提高预算"
}
```

| 字段          | 类型          | 必填 | 说明                 |
| ------------- | ------------- | ---- | -------------------- |
| prepare_id    | int64         | 是   | 筹备记录 ID          |
| kol_url       | string\|null  | 否   | 达人主页链接         |
| has_budget    | int           | 是   | 有无预算：0-无, 1-有 |
| budget_amount | float64\|null | 否   | 预算金额             |
| remark        | string\|null  | 否   | 备注                 |

**Response `data`:** `{"prepare_id": 123}`

**业务规则：**

- Admin 可以更新任意 BD 的筹备记录
- 已软删除的记录不可更新

**Error codes:**

| i18n key                    | HTTP | 说明           |
| --------------------------- | ---- | -------------- |
| admin.prepare.not_found     | 400  | 筹备记录不存在 |
| admin.prepare.update_failed | 400  | 更新失败       |
| admin.not_admin             | 403  | 非 Admin 用户  |

---

### 3.3 Admin 达人池列表

```
GET /api/v1/admin/kol-pool
```

**Query Parameters** 和 **Response** 同 [2.7 达人池列表](#27-达人池列表)。

---

### 3.4 Admin 新增达人池记录

```
POST /api/v1/admin/kol-pool
```

**Request Body (JSON):**

```json
{
  "kol_id": "kol_001",
  "kol_url": "https://example.com/kol1",
  "has_budget": 1,
  "budget_amount": 5000.0,
  "remark": "手动入库"
}
```

| 字段          | 类型          | 必填 | 说明                 |
| ------------- | ------------- | ---- | -------------------- |
| kol_id        | string        | 是   | 达人 ID              |
| kol_url       | string        | 否   | 达人主页链接         |
| has_budget    | int           | 是   | 有无预算：0-无, 1-有 |
| budget_amount | float64\|null | 否   | 预算金额             |
| remark        | string\|null  | 否   | 备注                 |

**Response `data`:** 返回创建的池记录对象。

**Error codes:**

| i18n key                     | HTTP | 说明                             |
| ---------------------------- | ---- | -------------------------------- |
| admin.kol_pool.kol_id_exists | 400  | 该 kol_id 已在达人池中（未删除） |
| admin.not_admin              | 403  | 非 Admin 用户                    |

---

### 3.5 Admin 编辑达人池记录

```
PUT /api/v1/admin/kol-pool
```

**Request Body (JSON):**

```json
{
  "id": 2,
  "kol_url": "https://example.com/kol1",
  "has_budget": 0,
  "budget_amount": null,
  "remark": "更新备注"
}
```

| 字段          | 类型          | 必填 | 说明                 |
| ------------- | ------------- | ---- | -------------------- |
| id            | int64         | 是   | 达人池记录 ID        |
| kol_url       | string\|null  | 否   | 达人主页链接         |
| has_budget    | int           | 否   | 有无预算：0-无, 1-有 |
| budget_amount | float64\|null | 否   | 预算金额             |
| remark        | string\|null  | 否   | 备注                 |

**Response `data`:** 返回更新后的池记录对象。

**Error codes:**

| i18n key                 | HTTP | 说明             |
| ------------------------ | ---- | ---------------- |
| admin.kol_pool.not_found | 400  | 达人池记录不存在 |
| admin.not_admin          | 403  | 非 Admin 用户    |

---

### 3.6 Admin 删除达人池记录

软删除一条达人池记录。

```
DELETE /api/v1/admin/kol-pool
```

**Query Parameters:**

| 参数 | 类型  | 必填 | 说明          |
| ---- | ----- | ---- | ------------- |
| id   | int64 | 是   | 达人池记录 ID |

**Response `data`:** `null`

**Error codes:**

| i18n key                 | HTTP | 说明             |
| ------------------------ | ---- | ---------------- |
| admin.kol_pool.not_found | 400  | 达人池记录不存在 |
| admin.not_admin          | 403  | 非 Admin 用户    |

---

## 4. 前端适配要点

### BD 筹备编辑

| 字段 | 说明 |
| --- | --- |
| 列表取 `prepare_id` | `GET /bd/kol-prepare` 返回了 `prepare_id`，用于调用更新/删除 |
| 可编辑字段 | `has_budget` / `budget_amount` / `remark` / `kol_url` |
| 编辑接口 | `PUT /bd/kol-prepare`，传 `prepare_id` + 全部字段 |
| 删除接口 | `DELETE /bd/kol-prepare?prepare_id=xxx` |

### Admin 筹备编辑

| 字段 | 说明 |
| --- | --- |
| 可编辑字段 | `has_budget` / `budget_amount` / `remark` / `kol_url`（与 BD 相同） |
| 编辑接口 | `PUT /admin/kol-prepare`，传 `prepare_id` + 全部字段 |
| 权限不同 | Admin 可以编辑任意 BD 的筹备记录 |
