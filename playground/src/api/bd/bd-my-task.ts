import { requestClient } from '../request';

export namespace BdTaskApi {
  // 查看BD任务参数
  export interface BdTaskListParams {
    hasBudget?: boolean; // 是否有预算
    page: number;
    pageSize: number;
  }
  export interface BDTaskRow {
    briefUrl: string;
    commission: number; // 佣金
    deadline: number; // 截止日期 单位毫秒
    hasBudget: 0 | 1; // 是否有预算 1:有
    productUrl: string;
    relationId: number; // task_bd_relation.id
    taskId: number; // task_main.id
    totalVideos: number; // 总视频数 task_bd_relation.video_quantity
  }

  export interface BdTasListResult {
    list: BDTaskRow[];
    total: number;
  }

  export interface BdKolPrepareParams {
    list: KolRow[]; // 达人筹备数据
    task_id: number; // 所属任务ID
  }
  export interface KolRow {
    kol_id: string;
    kol_link: string;
  }

  // BD查询某条任务的达人筹备提交记录
  export interface QueryKolPrepareParams {
    page: number;
    page_size: number;
    status?: number;
    task_id: number;
  }

  export interface QueryKolPrepareResult {
    list: PrepareDataRow[];
    page: number;
    page_size: number;
    total: number;
  }
  export interface PrepareDataRow {
    audit_time?: number;
    entry_time: number;
    kol_id: string;
    kol_link: string;
    reason?: string;
    reviewer_name?: string;
    status: number;
  }
}

/** BD 用户获取自己任务信息 */
export async function getBdTaskList(params: BdTaskApi.BdTaskListParams) {
  return requestClient.get<BdTaskApi.BdTasListResult>('/bd/tasks', { params });
}

/** BD用户，上传某条任务的达人筹备表 */
export async function uploadKolPrepareData(data: BdTaskApi.BdKolPrepareParams) {
  return requestClient.post<null>('bd/kol-prepare', data);
}
/** BD用户，查询某条任务提交达人筹备的记录 */
export async function queryKolPrepareData(
  params: BdTaskApi.QueryKolPrepareParams,
) {
  return requestClient.get<BdTaskApi.QueryKolPrepareResult>('bd/kol-prepare', {
    params,
  });
}
