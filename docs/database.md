# 🗄️ 数据结构（Database）

> 来源于 db.sql（Postgres），总结表结构、关系和数据流。

## 一、表分类总览

### 1.1 组织架构（3 张）

| 表名         | 说明   | 关键字段                                             |
| ------------ | ------ | ---------------------------------------------------- |
| `department` | 部门表 | code(唯一), name                                     |
| `post`       | 岗位表 | name                                                 |
| `employee`   | 员工表 | employee_no(唯一), dept_id, post_id, country, status |

### 1.2 业务核心（12 张）

| 表名 | 说明 | 关键字段 |
| --- | --- | --- |
| `bd_person` | BD 人员表 | bd_code(唯一，如 BD001), employee_id(一对一) |
| `shop` | 店铺表 | platform(1-TikTok/2-Shopee/3-Lazada), shop_type(1-跨境/2-本土), platform_shop_id(唯一) |
| `product_sku` | SKU 表 | sku_code(唯一), sku_type(0-单/1-组合), retail_price, cost_price |
| `sku_bundle` | 组合SKU明细 | bundle_sku_id → child_sku_id + quantity |
| `product_listing` | 商品链接（铺货） | shop_id, platform_product_id, main_sku_id, commission_public/private |
| `kol` | 达人表 | kol_id(唯一), belong_bd_code, followers, status(1-正常/2-流失/3-黑名单) |
| `task_main` | 任务总表 | product_listing_id, commission, video_num, deadline, type(0-定制/1-公开) |
| `task_bd_relation` | 任务-BD关联 | task_id + bd_code(唯一), video_quantity |
| `kol_bd_prepare` | 达人筹备表 | task_id + kol_id + bd_code(唯一), status(0-待审核/1-审核中/2-审核不通过/3-审核通过) |
| `kol_bd_prepare_audit` | 筹备审核记录 | prepare_id, from_status → to_status, reviewer_id(→sys_user), reason |
| `task_sop` | SOP进度表 | task_id + bd_code + kol_id(唯一), status(0-建联/1-送样/2-回收视频/3-结束/4-汇款阶段/5-终止) |
| `video` | 视频表 | kol_id, sop_id, video_url, score, play_count, gmv, commission |

### 1.3 SOP 子表（5 张）

| 表名 | 说明 | 关键字段 |
| --- | --- | --- |
| `sop_contact` | 建联明细 | task_sop_id(1:1), budget, budget_status(0-待审/1-通过/2-驳回) |
| `sop_budget_application` | 预算申请 | task_sop_id, amount, status, latest_audit_id, submitter_id |
| `sop_budget_audit` | 预算审核记录 | application_id, from_status → to_status, auditor_id(→sys_user), reason |
| `sample_application` | 样品申请 | task_sop_id(1:1), product_listing_id, address, tracking_number |
| `sample_application_request` | 样品申请记录 | task_sop_id, product_listing_id, address, quantity, status, reviewer_id |
| `sop_remittance` | 汇款申请 | task_sop_id(1:1), amount, status, latest_audit_id, submitter_id |
| `sop_remittance_attachment` | 汇款附件 | remittance_id, attachment_type(chat/remittance), url |
| `sop_remittance_audit` | 汇款审核记录 | remittance_id, from_status → to_status, auditor_id(→sys_user), reason |

### 1.4 权限系统（5 张）

| 表名 | 说明 | 关键字段 |
| --- | --- | --- |
| `sys_user` | 系统用户 | username(唯一), password_hash(bcrypt), employee_id(1:1) |
| `sys_role` | 角色表 | role_code(唯一，如 ADMIN/BD), is_system |
| `sys_permission` | 权限/菜单表 | parent_id(树形), perm_code(唯一), perm_type(1-菜单/2-按钮/3-接口) |
| `sys_user_role` | 用户-角色关联 | user_id + role_id (联合主键) |
| `sys_role_permission` | 角色-权限关联 | role_id + perm_id (联合主键) |

## 二、核心关系图（ER 简要）

```
department ──┐
post ────────┼── employee ────── bd_person (1:1)
             │       │
             │       └── shop (owner_user_id)
             │              └── product_listing
             │                    └── task_main
             │                          ├── task_bd_relation (bd_code)
             │                          │     └── task_sop
             │                          │           ├── sop_contact (1:1)
             │                          │           ├── sample_application (1:1)
             │                          │           ├── sop_remittance (1:1)
             │                          │           └── video (1:N)
             │                          └── kol_bd_prepare
             │                                ├── kol (kol_id)
             │                                └── kol_bd_prepare_audit (1:N 审核记录)
             │
             └── sys_user (employee_id)
                    └── sys_user_role ── sys_role ── sys_role_permission ── sys_permission

product_sku ────── sku_bundle (组合SKU)
product_sku ────── product_listing (main_sku_id)
```

## 三、关键数据流

### 3.1 任务创建 → 视频产出

```
shop ── product_listing ── task_main
                               │
                    ┌──────────┴──────────┐
                    │                     │
              task_bd_relation      kol_bd_prepare
              (分配BD+配额)          (达人筹备+审核)
                    │                     │
                    └─────────┬───────────┘
                              │
                          task_sop
                    (bd_code + kol_id)
                              │
                    ┌─────────┼─────────┐
                    │         │         │          │
              sop_contact   sample_         video     sop_remittance
              (建联)   application+request (回收视频)    (汇款)
                         (送样)
```

### 3.2 权限链路

```
sys_user ── sys_user_role ── sys_role ── sys_role_permission ── sys_permission
                                                                  (树形菜单)
```

## 四、通用约定

- **软删除**：所有业务表含 `deleted_at` 字段，NULL 表示未删除
- **唯一约束**：均通过 `WHERE deleted_at IS NULL` 的部分索引实现软删除下的唯一性
- **时间戳**：统一使用 `timestamptz`（带时区）
- **主键**：统一使用 `bigint GENERATED BY DEFAULT AS IDENTITY`
- **金额**：统一使用 `decimal`，避免浮点精度问题
- **BD 代号**：格式为 BD + 数字（如 BD001），在 bd_person 表中全局唯一
