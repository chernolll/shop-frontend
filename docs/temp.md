# 前端 AI Prompt：BD 用户「寄样申请环节」

你现在在一个 **Vben Admin + Vue3** 前端项目中工作。  
请基于现有项目代码风格、组件体系、请求封装、路由组织、国际化方式，完成 **BD 用户在 SOP 寄样阶段** 的页面 UI 和交互功能。

注意：

- 这次 **只实现 BD 用户相关页面和功能**
- **不要实现 ADMIN 页面**
- 优先复用现有项目中的：
  - `Api` 请求层
  - `useTable / useForm / Modal / Drawer / Page` 等模式
  - 状态 Tag、Message、Confirm、Loading、Empty、Skeleton
  - 路由和权限控制
  - 国际化

---

## 一、功能目标

为 BD 用户完成「寄样申请环节」前端功能，至少包含：

1. 查询寄样阶段当前详情
2. 查看寄样申请提交记录列表
3. 提交新的寄样申请
4. 放弃一条“待审核”的寄样申请记录
5. 基于返回的 `sop_status` 做前端阶段跳转/状态更新

---

## 二、后端接口

### 1. 查询寄样阶段详情

```http
GET /api/v1/bd/sop/sample?task_sop_id=:task_sop_id
```

说明：

- 请求参数使用 `task_bd_id`
- 查询成功后，响应里会返回 `task_sop_id`
- 后续“提交申请 / 查询申请记录 / 放弃申请”都要使用这个 `task_sop_id`

成功响应示例：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "task_sop_id": 35,
    "sop_status": 1,
    "product_url": "https://shop.tiktok.com/xxx",
    "address": "上海市浦东新区xxx路xxx号",
    "quantity": 2,
    "tracking_number": "SF1234567890",
    "delivered_at": 1777362600000,
    "package_received": 0
  }
}
```

字段说明：

- `delivered_at`：**UTC 毫秒时间戳**
- `package_received`
  - `0` 未收到
  - `1` 已收到
- `sop_status`
  - `0` 建联
  - `1` 寄样
  - `2` 回收视频
  - `3` 结束
  - `4` 汇款阶段
  - `5` 终止

空数据规则：

- 如果 `sample_application` 当前没有有效记录，后端仍然返回成功
- 此时大致会返回：
  - `address = ""`
  - `quantity = 0`
  - `tracking_number = null`
  - `delivered_at = null`
  - `package_received = 0`

错误：

- `400 common.bad_request`
- `401 auth.token_invalid`
- `403 bd.not_bd_person`
- `400 bd.task_relation_not_found`
- `400 sop.not_found`
- `500 common.internal_error`

---

### 2. 查询寄样申请提交记录

```http
GET /api/v1/bd/sop/sample/requests?task_sop_id=:taskSopId
```

成功响应示例：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [
      {
        "request_id": 101,
        "task_sop_id": 35,
        "product_listing_id": 12,
        "address": "上海市浦东新区xxx路xxx号",
        "quantity": 2,
        "status": 0,
        "review_reason": null,
        "reviewed_at": null,
        "created_at": 1777350000000,
        "updated_at": 1777350000000
      }
    ]
  }
}
```

状态说明：

- `0` 待审核
- `1` 审核通过
- `2` 驳回
- `3` 废弃

前端重要规则：

- **只有 `status = 0` 的记录允许 BD 点击“废弃”**
- `1 / 2 / 3` 都不要给“废弃”操作

时间字段：

- `reviewed_at / created_at / updated_at` 都是 **UTC 毫秒时间戳**

---

### 3. 提交寄样申请

```http
POST /api/v1/bd/sop/sample/request
Content-Type: application/json
```

请求体：

```json
{
  "task_sop_id": 35,
  "address": "上海市浦东新区xxx路xxx号",
  "quantity": 2,
  "package_received": 0
}
```

说明：

- `task_sop_id`：必填
- `address`：必填
- `quantity`：必填，最小 1
- `package_received`：可选，只能传 `0` 或 `1`
- **前端不需要传 `product_listing_id`**
- 后端会自动使用 `task_sop.product_id`

成功响应示例：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "request_id": 101,
    "sop_status": 1,
    "package_received": 0
  }
}
```

特别说明：

- 当前 BD 侧没有填写物流单号、发货时间的能力
- 所以即使 BD 传了 `package_received = 1`
- 如果当前主记录没有有效的：
  - `tracking_number`
  - `delivered_at`
- 后端也不会把包裹状态真的更新为已收到
- 因此前端 **建议当前先不要把“包裹是否收到”做成可编辑主操作**
- 更推荐：
  - 展示为只读状态
  - 或暂时隐藏编辑入口

错误：

- `400 common.bad_request`
- `401 auth.token_invalid`
- `403 bd.not_bd_person`
- `400 sop.not_found`
- `400 sop.sample_stage_only`
- `500 common.internal_error`

---

### 4. 放弃一条寄样申请

```http
PUT /api/v1/bd/sop/sample/request/abandon
Content-Type: application/json
```

请求体：

```json
{
  "task_sop_id": 35,
  "request_id": 101
}
```

成功响应示例：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "request_id": 101,
    "status": 3,
    "sop_status": 1
  }
}
```

规则：

- BD **只能把“待审核(0)”记录改成“废弃(3)”**
- 已通过、已驳回、已废弃都不可放弃

错误：

- `400 common.bad_request`
- `401 auth.token_invalid`
- `403 bd.not_bd_person`
- `400 sop.not_found`
- `400 sop.sample_stage_only`
- `400 sample.request_not_found`
- `400 sample.request_cannot_abandon`
- `500 common.internal_error`

---

## 三、后端业务语义

前端必须按这些语义理解：

### 1. `sample_application` 不是“最后一次提交”

它表示：

- `sample_application_request` 中
- **最后一条 `status != 3`（非废弃）**
- 的当前快照

所以：

- 待审核、通过、驳回，都可能成为当前主数据
- 只有废弃不会成为当前主数据

### 2. 如果全部记录都废弃了

或者根本没提交过：

- 查询详情接口仍然成功
- 但寄样信息为空

### 3. `sop_status` 很重要

前端需要用它决定：

- 当前是否还在寄样阶段
- 是否需要跳转到下一阶段页面
- 是否刷新当前 SOP 行状态

### 4. 包裹收到会推进阶段

只要后端最终把：

- `sample_application.package_received = 1`

写成功，就会自动把：

- `task_sop.status`
- 从 `1（寄样）`
- 推进到 `2（回收视频）`

所以前端任何保存成功后，都要关注接口返回里的 `sop_status` 是否变化。

---

## 四、前端页面建议

建议做成一个“寄样申请阶段页面 / 详情页”，包含两个区域：

### 区域 A：当前寄样详情

展示：

- `product_url`
- `address`
- `quantity`
- `tracking_number`
- `delivered_at`
- `package_received`
- `sop_status`

其中：

- `tracking_number`
- `delivered_at`
- `package_received`

当前在 BD 侧更适合做成 **只读展示**。

### 区域 B：寄样申请记录列表

列表字段建议：

- 提交时间 `created_at`
- 地址 `address`
- 数量 `quantity`
- 状态 `status`
- 审核意见 `review_reason`
- 审核时间 `reviewed_at`
- 操作列

操作列：

- 若 `status === 0`，显示“废弃”
- 其他状态不显示“废弃”

---

## 五、交互建议

### 1. 页面进入方式

建议从 SOP 列表某一行进入寄样页面时，先拿到：

- `task_bd_id`

然后：

1. 调 `GET /api/v1/bd/sop/sample?task_bd_id=...`
2. 取返回中的 `task_sop_id`
3. 再调 `GET /api/v1/bd/sop/sample/requests?task_sop_id=...`

### 2. 提交新申请

建议用弹窗或抽屉表单：

- 收样地址 `address`
- 样品数量 `quantity`

`package_received` 当前不建议作为主要可编辑项暴露给 BD。

提交成功后：

1. 刷新当前详情
2. 刷新申请记录列表
3. 如果返回的 `sop_status` 已经不是当前阶段，做阶段跳转或状态刷新

### 3. 放弃申请

点击“废弃”时：

- 先二次确认
- 成功后刷新：
  - 当前详情
  - 申请记录列表

---

## 六、前端实现要求

请按 **Vben Admin + Vue3** 项目现有风格实现，不要重新发明一套结构。

要求：

1. 补 API 文件和 TypeScript 类型
2. 补页面或页面内模块
3. 处理 loading / empty / error / submit pending
4. 使用现有国际化体系，不要硬编码大量中文
5. 对状态值做前端映射：
   - `0` 待审核
   - `1` 审核通过
   - `2` 驳回
   - `3` 废弃
6. 对时间戳统一用项目里的时间格式化工具展示
7. 如果 `sop_status !== 1`
   - 页面要能感知当前阶段已经变化
   - 不要继续表现得像还能正常提交寄样申请

---

## 七、交付内容

请直接修改前端代码并完成实现。最终告诉我：

1. 改了哪些页面/组件/API 文件
2. 页面入口在哪里
3. 提交申请和废弃申请分别怎么操作
4. 哪些状态下按钮会禁用/隐藏
5. 当前有哪些后端限制需要前端配合规避
