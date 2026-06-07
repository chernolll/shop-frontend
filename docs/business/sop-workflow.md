# SOP 工作流

## 业务目的

SOP（Standard Operating Procedure）是 BD 与达人合作的标准化流程，每个 KOL 在任务中的合作过程被拆分为顺序阶段，确保运营规范化。

## 状态流转

```
CONTACT(0) → SAMPLE(1) → RECOVER(2) → COMPLETED(3) / REMITTANCE(4)
     ↓              ↓            ↓
TERMINATED(5)  TERMINATED(5)  TERMINATED(5)
```

> 任一步骤均可被终止（TERMINATED）

## 各阶段核心动作

### CONTACT（建联阶段）

- BD 填写建联信息（预算、联系方式）
- 有预算(has_budget=1): → 提交预算审核 → Admin 通过后 → SAMPLE
- 无预算(has_budget=0): 直接 → SAMPLE
- API: `updateBDSopContact()` / `getBDSopContactDetail()`

### SAMPLE（送样阶段）

- BD 提交送样申请（收货地址、数量）
- Admin 审核送样申请
- BD 确认收货
- API: `createBDSopSampleRequest()` / `getBDSopSampleDetail()` / `confirmBDSopSampleReceived()`

### RECOVER（回收阶段）

- 回收样品（当前版本为衔接阶段）

### REMITTANCE（汇款阶段）— 仅 has_budget=1 走此流程

- BD 提交汇款申请（金额、收款人、银行信息、附件）
- Admin 审核
- API: `createBDSopRemittance()` / `getBDSopRemittanceList()` / `getBDSopRemittanceDetail()`

### COMPLETED（完成）

- 无预算流程：BD 手动标记完成 → `completeBDSop()`
- 有预算流程：汇款审核通过后自动完成

## 核心约束

- SOP 一旦终止不可恢复
- 前一阶段未完成不能进入下一阶段
- 送样申请和汇款申请可被 BD 自行废弃（仅限待审核状态）
- 有预算流程的预算需 Admin 审核；无预算流程跳过预算和汇款

## 上下游关系

```
Admin 创建任务 → 任务分配给 BD → BD 提交达人筹备 → Admin 审核筹备
    → BD 对每个 KOL 启动 SOP → 建联 → 送样 → 回收 → 视频 → 汇款 → 完成
    → Admin 在 Review 模块审核各个环节
```

## 关联模块

- [[docs/modules/bd|BD 模块]] — SOP 执行端
- [[docs/modules/review|审核模块]] — 预算审核 + 汇款审核
- [[docs/business/task-lifecycle|任务生命周期]] — SOP 是任务内对单个 KOL 的执行流程
