import { requestClient } from '../request';

export namespace BdTaskApi {
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
}

/** BD 用户获取自己任务信息 */
export async function getBdTaskList(params: BdTaskApi.BdTaskListParams) {
  return requestClient.get<BdTaskApi.BdTasListResult>('/bd/tasks', { params });
}
