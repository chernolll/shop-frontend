# 模块依赖图

## 层级依赖方向

```
playground (业务层)
    ↓ 依赖
packages/effects/* (效果层)
    ↓ 依赖
packages/@core/* (核心层)
```

## 业务模块间依赖

```
BD-MyTasks → BD-KolPrepare (从任务进入 → 独立筹备页)
BD-KolPool → BD-KolPrepare (认领达人 → 出现在筹备列表)
BD-PublicTasks → BD-MyTasks (申请通过后 → 成为我的任务)
BD-Kols → BD-KolPrepare (从达人候选池中选择 → 筹备表)
BD-Videos ← BD-SOP (SOP 视频阶段产出 → 视频列表)

Review-Budget → BD-SOP-Contact (BD 提交预算 → Admin 审核)
Review-Remittance → BD-SOP-Remittance (BD 提交汇款 → Admin 审核)
Review-PublicTaskApplications → BD-PublicTasks (BD 申请 → Admin 审核)

KOL-Candidate → BD-Kol-Library (Admin 管理候选 → BD 达人库)
KOL-Pool ← Admin-KolPool (Admin 管理达人池 → BD 可查看认领)
Product-SKU → Product-Listing (SKU 录入 → 生成商品链接)
```

## Package 间核心依赖

```
effects/request → @core/base/shared (RequestClient)
effects/access → stores (useAccessStore / useUserStore)
effects/layouts → @core/ui-kit/layout-ui
effects/hooks → @core/composables
stores → effects/request (API 调用)
```

## 数据流方向（单模块内）

```
View Component
    ↓ Props/Events
Child Components
    ↓ 直接调用
API Function (api/)
    ↓ 通过
requestClient (拦截器链)
    ↓ HTTP
Backend API
```

## 禁止的依赖

- ❌ `packages/*` → `playground/*`
- ❌ `@core/base` → `effects`
- ❌ View → View（页面间不能互相 import）
- ❌ API → Store / Component
- ❌ Store → View
