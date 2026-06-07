/** 达人筹备-校验原因码（对应后端 reason_code） */
export enum KolPrepareReasonCode {
  CAN_PREPARE = 0, // 可筹备
  TASK_DUPLICATE = 1, // 任务内重复提交
  HAS_BD = 2, // 已有所属BD
  PREPARED_BY_OTHER = 3, // 被其他BD筹备
  KOL_DELETED = 4, // 达人已删除
  KOL_ABNORMAL = 5, // 达人状态异常
}
