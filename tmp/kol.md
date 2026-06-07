# 达人模块重构 — 前端接口文档

## 1. 重构概览

本次重构核心变化：**达人筹备（`kol_bd_prepare`）与任务（`task_bd_relation`）完全解绑**，并新增**达人池（`kol_pool`）**功能。

| 模块 | 变化 |
|------|------|
| 达人筹备 `kol_bd_prepare` | 移除 `task_id` 字段，BD 可独立管理自己的达人筹备记录，不再依赖任务 |
| 达人池 `kol_pool` | 全新模块，无主 BD 的公共达人资源池（离职 BD 释放 / Admin 上传），BD 可查看并认领 |

---

## 2. BD 端接口（需登录 + BD 身份）

Base: `/api/v1/bd`

### 2.1 达人筹备预校验

检测一批 kol_id 是否可筹备，返回每个 ID 的校验结果。

```
POST /api/v1/bd/validate-kol-prepare
```

**Request Body (JSON):**
```json
{
  "kol_ids": ["kol_001", "kol_002"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_ids | string[] | 是 | 达人 ID 列表，min=1 |

**Response `data`:**
```json
[
  {
    "kol_id": "kol_001",
    "can_prepare": true,
    "reason_code": 0,
    "reason_msg": "可筹备",
    "belong_bd_code": null,
    "prepared_bd_code": null,
    "kol_status": 1,
    "entry_time": null
  }
]
```

| 字段 | 类型 | 说明 |
|------|------|------|
| kol_id | string | 达人 ID |
| can_prepare | bool | 是否可筹备 |
| reason_code | int | 原因码，见下表 |
| reason_msg | string | 原因文案（i18n，随 X-Language 变化） |
| belong_bd_code | string\|null | 达人当前所属 BD（有归属时不可筹备） |
| prepared_bd_code | string\|null | 正在筹备该达人的 BD 代号 |
| kol_status | int\|null | 达人状态：1-正常, 2-停用, 3-已删除 |
| entry_time | int64\|null | 达人入库时间（ms 时间戳） |

**reason_code 枚举：**

| code | i18n key | 含义 |
|------|----------|------|
| 0 | prepare.reason_0 | 可筹备 |
| 1 | prepare.reason_1 | 已在当前 BD 筹备列表中重复提交 |
| 2 | prepare.reason_2 | 达人已有所属 BD |
| 3 | prepare.reason_3 | 达人已被其他 BD 筹备占用 |
| 4 | prepare.reason_4 | 达人已删除 |
| 5 | prepare.reason_5 | 达人状态异常（停用等） |

---

### 2.2 达人筹备入库

批量提交达人筹备记录。

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
      "budget_amount": 5000.00,
      "remark": "优质达人"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| list | array | 是 | 筹备项列表，min=1 |
| list[].kol_id | string | 是 | 达人 ID |
| list[].kol_url | string | 否 | 达人主页链接 |
| list[].has_budget | int | 是 | 有无预算：0-无, 1-有 |
| list[].budget_amount | float64\|null | 否 | 预算金额（has_budget=1 时填写） |
| list[].remark | string\|null | 否 | 备注 |

**Response:** 成功时 `data` 为 null，错误时返回对应 i18n 文案。

**业务规则：**
- 入库时自动将达人同步写入 `kol_candidate` 表（如果该达人尚不存在于 `kol_candidate` 且不在 `kol` 主表）
- 如果 kol_id 已在当前 BD 的筹备列表中，服务端自动跳过

---

### 2.3 达人筹备列表（我的）

查询当前 BD 自己的筹备记录。

```
GET /api/v1/bd/kol-prepare
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_id | string | 否 | 达人 ID 筛选（模糊匹配） |
| page | int | 是 | 页码，min=1 |
| page_size | int | 是 | 每页条数，min=1, max=200 |

**Response `data`:**
```json
{
  "list": [
    {
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.00,
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
|------|------|------|
| list | array | 筹备记录列表 |
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

### 2.4 达人筹备列表（全局）

查询所有 BD 的筹备记录（含 BD 代号、任务参与数、SOP 状态等扩展字段）。

```
GET /api/v1/bd/kol-prepare/list
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_id | string | 否 | 达人 ID 筛选（模糊匹配） |
| has_budget | int | 否 | 有无预算筛选：0/1 |
| entry_time_start | int64 | 否 | 录入起始时间（ms 时间戳） |
| entry_time_end | int64 | 否 | 录入结束时间（ms 时间戳） |
| page | int | 是 | 页码，min=1 |
| page_size | int | 是 | 每页条数，min=1, max=200 |

**Response `data`:**
```json
{
  "list": [
    {
      "prepare_id": 123,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.00,
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
|------|------|------|
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

### 2.5 删除达人筹备记录

```
PUT /api/v1/bd/kol-prepare/delete
```

**Request Body (JSON):**
```json
{
  "prepare_id": 123
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prepare_id | int64 | 是 | 筹备记录 ID |

**Response:** 成功返回 `{"prepare_id": 123}`

---

### 2.6 达人池列表

查看公共达人池中的达人。

```
GET /api/v1/bd/kol-pool
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_id | string | 否 | 达人 ID 筛选（模糊匹配） |
| source_type | int | 否 | 来源筛选：1-离职BD释放, 2-Admin上传 |
| has_budget | int | 否 | 有无预算筛选：0/1 |
| page | int | 是 | 页码，min=1 |
| page_size | int | 是 | 每页条数，min=1, max=200 |

**Response `data`:**
```json
{
  "list": [
    {
      "id": 1,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.00,
      "remark": "备注内容",
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

| 字段 | 类型 | 说明 |
|------|------|------|
| list[].id | int64 | 池记录 ID（认领时使用） |
| list[].kol_id | string | 达人 ID |
| list[].kol_url | string\|null | 达人主页链接 |
| list[].has_budget | int | 有无预算 |
| list[].budget_amount | float64\|null | 预算金额 |
| list[].remark | string\|null | 备注 |
| list[].source_type | int | 来源：1-离职BD释放, 2-Admin上传 |
| list[].source_bd_code | string\|null | 来源 BD 代号（source_type=1 时有值） |
| list[].created_at | int64 | 创建时间（ms 时间戳） |

---

### 2.7 从达人池认领达人

BD 从公共池认领一个达人到自己的筹备列表中。该操作在一个事务中完成：①软删除池记录 → ②创建 `kol_bd_prepare` 记录。

```
POST /api/v1/bd/kol-pool/claim
```

**Request Body (JSON):**
```json
{
  "pool_id": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pool_id | int64 | 是 | 达人池记录 ID |

**Response:** 成功返回 `{"pool_id": 1}`

**可能的错误：**

| i18n key | 说明 |
|----------|------|
| bd.kol_pool.not_found | 达人池记录不存在或已被认领 |
| bd.kol_pool.kol_already_prepared | 该达人已在你的筹备列表中 |
| bd.kol_pool.claim_failed | 认领失败（事务错误） |

---

## 3. Admin 端接口（需登录 + Admin 角色）

Base: `/api/v1/admin`

### 3.1 达人池列表（Admin）

```
GET /api/v1/admin/kol-pool
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_id | string | 否 | 达人 ID 筛选（模糊匹配） |
| source_type | int | 否 | 来源筛选：1/2 |
| has_budget | int | 否 | 有无预算筛选：0/1 |
| page | int | 是 | 页码，min=1 |
| page_size | int | 是 | 每页条数，min=1, max=200 |

**Response `data`：** 同 BD 达人池列表，额外包含 `uploader_id` 和 `updated_at` 字段：

```json
{
  "list": [
    {
      "id": 1,
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.00,
      "remark": "备注内容",
      "source_type": 2,
      "source_bd_code": null,
      "uploader_id": 10,
      "created_at": 1715678900000,
      "updated_at": 1715678900000
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

| 新增字段 | 类型 | 说明 |
|----------|------|------|
| uploader_id | int64\|null | 上传人用户 ID（source_type=2 时有值） |
| updated_at | int64 | 最后更新时间（ms 时间戳） |

---

### 3.2 新增达人池记录

Admin 手动上传达人至公共池。

```
POST /api/v1/admin/kol-pool
```

**Request Body (JSON):**
```json
{
  "kol_id": "kol_new",
  "kol_url": "https://example.com/kol_new",
  "has_budget": 1,
  "budget_amount": 8000.00,
  "remark": "手动上传"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kol_id | string | 是 | 达人 ID |
| kol_url | string | 否 | 达人主页链接 |
| has_budget | int | 是 | 有无预算：0-无, 1-有 |
| budget_amount | float64\|null | 否 | 预算金额（has_budget=1 时填写） |
| remark | string\|null | 否 | 备注 |

**校验规则：**
- `kol_id` 不能为空
- `has_budget` 必须是 0 或 1
- `has_budget=1` 时 `budget_amount` 必填
- `has_budget=0` 时 `budget_amount` 必须为空
- 同一 kol_id 不能重复存在于达人池（唯一约束）

**可能的错误：**

| i18n key | 说明 |
|----------|------|
| admin.kol_pool.kol_id_exists | 该达人 ID 已在达人池中存在 |
| admin.not_admin | 当前用户不是管理员 |

---

### 3.3 编辑达人池记录

```
PUT /api/v1/admin/kol-pool
```

**Request Body (JSON):**
```json
{
  "id": 1,
  "kol_url": "https://example.com/updated",
  "has_budget": 0,
  "budget_amount": null,
  "remark": "更新备注"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int64 | 是 | 池记录 ID |
| kol_url | string | 否 | 达人主页链接 |
| has_budget | int | 否 | 有无预算：0/1（传了才更新） |
| budget_amount | float64\|null | 否 | 预算金额 |
| remark | string\|null | 否 | 备注 |

**注意：** `kol_id` 不可修改（不在请求参数中），仅部分字段支持更新。

**校验规则：**
- `has_budget` 传了必须是 0 或 1
- `has_budget=1` 时 `budget_amount` 必填
- `has_budget=0` 时 `budget_amount` 必须为空

---

### 3.4 删除达人池记录

软删除（设置 `deleted_at`）。

```
DELETE /api/v1/admin/kol-pool?id=1
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int64 | 是 | 池记录 ID（query param） |

**Response:** 成功返回 `{"id": 1}`

---

### 3.5 达人筹备列表（Admin）

查询全局 BD 的达人筹备记录。

```
GET /api/v1/admin/kol-prepare
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| bd_code | string | 否 | BD 代号筛选（模糊匹配） |
| kol_id | string | 否 | 达人 ID 筛选（模糊匹配） |
| has_budget | int | 否 | 有无预算筛选：0/1 |
| entry_time_start | int64 | 否 | 录入起始时间（ms 时间戳） |
| entry_time_end | int64 | 否 | 录入结束时间（ms 时间戳） |
| page | int | 是 | 页码，min=1 |
| page_size | int | 是 | 每页条数，min=1, max=200 |

**Response `data`:**
```json
{
  "list": [
    {
      "prepare_id": 123,
      "bd_code": "BD001",
      "kol_id": "kol_001",
      "kol_url": "https://example.com/kol1",
      "has_budget": 1,
      "budget_amount": 5000.00,
      "remark": "优质达人",
      "participated_task_count": 3,
      "entry_time": 1715678900000,
      "sop_id": 456
    }
  ],
  "total": 500,
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| list[].prepare_id | int64 | 筹备记录 ID |
| list[].bd_code | string | BD 代号 |
| list[].kol_id | string | 达人 ID |
| list[].kol_url | string\|null | 达人主页链接 |
| list[].has_budget | int | 有无预算 |
| list[].budget_amount | float64\|null | 预算金额 |
| list[].remark | string\|null | 备注 |
| list[].participated_task_count | int | 该达人参与过的任务数量 |
| list[].entry_time | int64 | 录入时间（ms 时间戳） |
| list[].sop_id | int64\|null | 关联的 SOP ID |

> **重构变化：** 此接口不再包含任务字段（`task_bd_id`/`task_id`/`status`）和审核状态字段，筛选参数也已简化。

---

## 4. 通用约定

### 4.1 认证
- 所有上述接口需要登录，Header: `Authorization: Bearer <token>`
- BD 接口额外校验当前用户是否 BD 身份
- Admin 接口额外校验当前用户是否 Admin 角色

### 4.2 国际化
- Header: `X-Language`，支持 `zh` / `en` / `th`，默认 `zh`
- 所有错误和提示文案通过 i18n key 返回前端自行映射，或者后端 `reason_msg` 字段直接返回对应语言文案

### 4.3 统一响应格式
```json
{
  "code": 0,
  "message": "成功",
  "data": { ... }
}
```

### 4.4 时间格式
所有时间字段均为 **毫秒级 Unix 时间戳**（int64）。

### 4.5 文本筛选
所有列表接口中的文本筛选字段（如 `kol_id`、`bd_code`）均使用模糊匹配（ILIKE + `%keyword%`），大小写不敏感。

### 4.6 软删除
`kol_bd_prepare` 和 `kol_pool` 均使用软删除（`deleted_at` 字段），删除后不可恢复，列表查询自动过滤已删除记录。

---

## 5. 数据模型参考

### kol_bd_prepare（BD 达人筹备表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int64 | 主键 |
| kol_id | string | 达人 ID |
| kol_url | string\|null | 达人主页链接 |
| bd_code | string | BD 代号 |
| has_budget | int | 有无预算：0/1 |
| budget_amount | float64\|null | 预算金额 |
| remark | string\|null | 备注 |
| entry_time | timestamptz | 录入时间 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| deleted_at | timestamptz\|null | 软删除标记 |

### kol_pool（达人池表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int64 | 主键 |
| kol_id | string | 达人 ID |
| kol_url | string\|null | 达人主页链接 |
| has_budget | int | 有无预算：0/1 |
| budget_amount | float64\|null | 预算金额 |
| remark | string\|null | 备注 |
| source_type | int | 来源：1-离职BD释放, 2-Admin上传 |
| source_bd_code | string\|null | 来源 BD（source_type=1 时） |
| uploader_id | int64\|null | 上传人 ID（source_type=2 时） |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| deleted_at | timestamptz\|null | 软删除标记 |

---

## 6. 前端适配要点

### 6.1 筹备与任务解绑
- **创建筹备不再需要 `task_id` 参数**。旧版前端如果有"从任务中筹备达人"的流程，现在直接调用 `POST /bd/kol-prepare` 即可。
- **筹备列表不再展示任务信息**。如果之前列表有"所属任务"列，请移除。
- **不再有筹备审核状态**。`POST /admin/kol-prepare/review` 已移除，筹备记录无 `status` 字段，无需展示审核流程。

### 6.2 达人池为新模块
- 需要新建"达人池"页面或 tab，展示 `GET /bd/kol-pool` 列表。
- "认领"按钮调用 `POST /bd/kol-pool/claim`，成功后该达人自动出现在 BD 自己的筹备列表。
- Admin 端达人池页面支持完整 CRUD。

### 6.3 预校验取代前置判断
- 提交筹备前，先调用 `POST /bd/validate-kol-prepare` 批量校验。
- 按 `can_prepare` 和 `reason_msg` 向用户展示哪些达人可筹备、哪些不可及原因。
- `belong_bd_code` / `prepared_bd_code` 可用于展示"已被 X 占用"类提示。
