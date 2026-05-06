# Admin 人事基础模块接口文档

本文档仅描述当前后端已实现的 admin 人事基础模块接口，供前端使用。

统一约定：

- 所有时间戳字段均为 UTC 毫秒时间戳
- 删除接口均为软删除
- 所有接口都需要登录且当前用户必须是 admin

---

## 1. 部门模块

### 1.1 查询部门列表

`GET /api/v1/admin/departments`

查询参数：

| 参数        | 类型   | 必填 | 说明               |
| ----------- | ------ | ---- | ------------------ |
| `id`        | int64  | 否   | 部门 ID            |
| `name`      | string | 否   | 部门名称，模糊查询 |
| `code`      | string | 否   | 部门编码，前缀匹配 |
| `page`      | int    | 是   | 页码，从 1 开始    |
| `page_size` | int    | 是   | 每页条数，最大 200 |

成功响应：

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "id": 1,
      "name": "技术部",
      "code": "TECH",
      "employee_count": 5,
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    }
  ]
}
```

### 1.2 创建部门

`POST /api/v1/admin/departments`

请求体：

```json
{
  "name": "法务部",
  "code": "LEGAL"
}
```

业务规则：

- `name` 必填
- `code` 必填
- `code` 会按大写保存
- `code` 不能与现有未删除部门重复

成功响应：

```json
{
  "id": 4,
  "name": "法务部",
  "code": "LEGAL",
  "employee_count": 0,
  "created_at": 1775000000000,
  "updated_at": 1775000000000
}
```

### 1.3 编辑部门

`PUT /api/v1/admin/departments`

请求体：

```json
{
  "id": 1,
  "name": "技术研发部",
  "code": "TECH"
}
```

业务规则：

- `id/name/code` 必填
- `code` 不能与其他未删除部门重复

成功响应结构与“创建部门”一致。

### 1.4 删除部门

`DELETE /api/v1/admin/departments?id=...`

业务规则：

- 若仍有员工引用该部门，不允许删除

成功响应：

```json
{
  "id": 1
}
```

---

## 2. 岗位模块

当前仅实现岗位列表接口，主要用于员工表单选择。

### 2.1 查询岗位列表

`GET /api/v1/admin/posts`

查询参数：

| 参数        | 类型   | 必填 | 说明               |
| ----------- | ------ | ---- | ------------------ |
| `id`        | int64  | 否   | 岗位 ID            |
| `name`      | string | 否   | 岗位名称，模糊查询 |
| `page`      | int    | 是   | 页码，从 1 开始    |
| `page_size` | int    | 是   | 每页条数，最大 200 |

成功响应：

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "id": 1,
      "name": "系统管理员",
      "employee_count": 2,
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    }
  ]
}
```

---

## 3. 员工模块

### 3.1 查询员工列表

`GET /api/v1/admin/employees`

查询参数：

| 参数          | 类型   | 必填 | 说明                                 |
| ------------- | ------ | ---- | ------------------------------------ |
| `id`          | int64  | 否   | 员工 ID                              |
| `employee_no` | string | 否   | 员工编号，前缀匹配                   |
| `name`        | string | 否   | 姓名，匹配 `name_cn/name_th/name_en` |
| `dept_id`     | int64  | 否   | 部门 ID                              |
| `post_id`     | int64  | 否   | 岗位 ID                              |
| `status`      | int    | 否   | 员工状态：`1=在职`，`2=离职`         |
| `country`     | string | 否   | 国家代码，如 `CN`、`TH`              |
| `is_bd`       | int    | 否   | 是否已绑定 BD：`0=否`，`1=是`        |
| `page`        | int    | 是   | 页码，从 1 开始                      |
| `page_size`   | int    | 是   | 每页条数，最大 200                   |

成功响应：

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "id": 1,
      "employee_no": "EMP001",
      "post_id": 2,
      "post_name": "BD专员",
      "dept_id": 3,
      "dept_name": "销售部",
      "name_cn": "张三",
      "name_th": null,
      "name_en": "Zhang San",
      "display_name": "张三",
      "country": "CN",
      "phone": "13800000000",
      "emergency_contact": "李四",
      "emergency_phone": "13900000000",
      "status": 1,
      "entry_time": 1775000000000,
      "leave_time": null,
      "id_card": "110101...",
      "gender": 1,
      "avatar": "https://example.com/avatar.png",
      "salary": 10000,
      "performance_bonus": 2000,
      "subsidy": 500,
      "lark_id": "ou_xxx",
      "remark": "核心成员",
      "bd_code": "BD001",
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    }
  ]
}
```

### 3.2 查询员工详情

`GET /api/v1/admin/employees/detail?id=...`

查询参数：

| 参数 | 类型  | 必填 | 说明    |
| ---- | ----- | ---- | ------- |
| `id` | int64 | 是   | 员工 ID |

成功响应结构与“员工列表”的单条记录一致。

### 3.3 创建员工

`POST /api/v1/admin/employees`

请求体：

```json
{
  "employee_no": "EMP001",
  "post_id": 2,
  "dept_id": 3,
  "name_cn": "张三",
  "name_th": null,
  "name_en": "Zhang San",
  "country": "CN",
  "phone": "13800000000",
  "emergency_contact": "李四",
  "emergency_phone": "13900000000",
  "status": 1,
  "entry_time": 1775000000000,
  "leave_time": null,
  "id_card": "110101...",
  "gender": 1,
  "avatar": "https://example.com/avatar.png",
  "salary": 10000,
  "performance_bonus": 2000,
  "subsidy": 500,
  "lark_id": "ou_xxx",
  "remark": "核心成员"
}
```

字段说明：

| 字段                | 类型   | 必填 | 说明                     |
| ------------------- | ------ | ---- | ------------------------ |
| `employee_no`       | string | 是   | 员工编号，唯一           |
| `post_id`           | int64  | 否   | 岗位 ID                  |
| `dept_id`           | int64  | 否   | 部门 ID                  |
| `name_cn`           | string | 否   | 中文名                   |
| `name_th`           | string | 否   | 泰文名                   |
| `name_en`           | string | 否   | 英文名                   |
| `country`           | string | 是   | 国家代码                 |
| `phone`             | string | 否   | 联系电话                 |
| `emergency_contact` | string | 否   | 紧急联系人               |
| `emergency_phone`   | string | 否   | 紧急联系电话             |
| `status`            | int    | 是   | `1=在职`，`2=离职`       |
| `entry_time`        | int64  | 是   | 入职时间                 |
| `leave_time`        | int64  | 否   | 离职时间                 |
| `id_card`           | string | 否   | 身份证号                 |
| `gender`            | int    | 否   | `0=未知`，`1=男`，`2=女` |
| `avatar`            | string | 是   | 头像链接                 |
| `salary`            | number | 是   | 月薪，`>= 0`             |
| `performance_bonus` | number | 是   | 绩效，`>= 0`             |
| `subsidy`           | number | 是   | 补贴，`>= 0`             |
| `lark_id`           | string | 否   | Lark 用户 ID             |
| `remark`            | string | 否   | 备注                     |

业务规则：

- `employee_no` 唯一
- `post_id`、`dept_id` 如果传了，必须存在
- 三个姓名字段至少传一个非空值
- `country=CN` 时，`name_cn` 必须有值
- `country=TH` 时，`name_th` 必须有值
- `status=2` 时，必须传 `leave_time`
- `status=1` 时，后端会忽略 `leave_time`

成功响应：

- 返回创建后的完整员工详情，结构与“员工列表”的单条记录一致

### 3.4 编辑员工

`PUT /api/v1/admin/employees`

请求体：

```json
{
  "id": 1,
  "employee_no": "EMP001",
  "post_id": 2,
  "dept_id": 3,
  "name_cn": "张三",
  "name_th": null,
  "name_en": "Zhang San",
  "country": "CN",
  "phone": "13800000000",
  "emergency_contact": "李四",
  "emergency_phone": "13900000000",
  "status": 1,
  "entry_time": 1775000000000,
  "leave_time": null,
  "id_card": "110101...",
  "gender": 1,
  "avatar": "https://example.com/avatar.png",
  "salary": 10000,
  "performance_bonus": 2000,
  "subsidy": 500,
  "lark_id": "ou_xxx",
  "remark": "核心成员"
}
```

业务规则：

- `PUT` 为完整更新，除可空字段外，建议按创建结构完整提交
- 其余校验规则与“创建员工”一致

成功响应：

- 返回更新后的完整员工详情

### 3.5 删除员工

`DELETE /api/v1/admin/employees?id=...`

业务规则：

- 若该员工仍被以下数据引用，则不允许删除：
  - `sys_user.employee_id`
  - `bd_person.employee_id`
  - `shop.owner_user_id`

成功响应：

```json
{
  "id": 1
}
```

---

## 4. BD 绑定模块

### 4.1 查询 BD 绑定列表

`GET /api/v1/admin/bd-persons`

查询参数：

| 参数              | 类型   | 必填 | 说明                         |
| ----------------- | ------ | ---- | ---------------------------- |
| `id`              | int64  | 否   | 绑定 ID                      |
| `bd_code`         | string | 否   | BD 编码，前缀匹配            |
| `employee_id`     | int64  | 否   | 员工 ID                      |
| `employee_no`     | string | 否   | 员工编号，前缀匹配           |
| `employee_status` | int    | 否   | 员工状态：`1=在职`，`2=离职` |
| `dept_id`         | int64  | 否   | 部门 ID                      |
| `page`            | int    | 是   | 页码，从 1 开始              |
| `page_size`       | int    | 是   | 每页条数，最大 200           |

成功响应：

```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "list": [
    {
      "id": 1,
      "bd_code": "BD001",
      "employee_id": 1,
      "employee_no": "EMP001",
      "employee_name": "张三",
      "employee_status": 1,
      "dept_id": 3,
      "dept_name": "销售部",
      "post_id": 2,
      "post_name": "BD专员",
      "leave_time": null,
      "created_at": 1775000000000,
      "updated_at": 1775000000000
    }
  ]
}
```

### 4.2 创建 BD 绑定

`POST /api/v1/admin/bd-persons`

请求体：

```json
{
  "bd_code": "BD001",
  "employee_id": 1
}
```

业务规则：

- `bd_code` 必填，按大写保存
- `employee_id` 必填
- 员工必须存在
- 员工必须是在职状态
- `bd_code` 不能重复
- 一个员工只能绑定一个 BD

成功响应：

- 返回创建后的绑定详情，结构与“BD 绑定列表”的单条记录一致

### 4.3 编辑 BD 绑定

`PUT /api/v1/admin/bd-persons`

请求体：

```json
{
  "id": 1,
  "bd_code": "BD001",
  "employee_id": 2
}
```

业务规则：

- `id/bd_code/employee_id` 必填
- 新员工必须存在且为在职状态
- 若修改 `bd_code`，且旧 `bd_code` 已存在业务引用，则不允许修改
- 一个员工只能绑定一个 BD
- `bd_code` 不能与其他绑定重复

业务引用检查范围：

- `task_bd_relation.bd_code`
- `kol_bd_prepare.bd_code`
- `task_sop.bd_code`

成功响应：

- 返回更新后的绑定详情

### 4.4 删除 BD 绑定

`DELETE /api/v1/admin/bd-persons?id=...`

业务规则：

- 若当前 `bd_code` 已存在业务引用，则不允许删除

成功响应：

```json
{
  "id": 1
}
```
