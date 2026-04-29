/** 达人筹备表，每条记录的审核状态 */
export enum KoaPrepareAuditStatus {
  PENDING = 1, // 审核中
  REJECT = 2, // 审核不通过
  PASS = 3, // 审核通过
}
/** 达人筹备表-达人状态 */
export enum KoaPrepareKolStatus {
  NORMAL, // 正常，可使用
  TASK_REPEAT, // 同一条任务，达人重复
  HAS_BD, // 已有所属BD
  PREPARED, // 已被筹备
  REJECT, // 审核不通过
}
