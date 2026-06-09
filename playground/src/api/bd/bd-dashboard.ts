import { requestClient } from '../request';

export namespace BdDashboardApi {
  export interface DashboardOverview {
    /** 所选时间范围内 BD 完成的 SOP 数量 */
    completed_task_count: number;
    /** 14天内到期的任务数 */
    deadline_14days: number;
    /** BD 名下达人总数（不受时间筛选影响） */
    kol_total: number;
    /** 所选时间范围内 BD 名下视频的 GMV 总和 */
    month_gmv: number;
    /** 历史视频回收率(%) */
    recycle_rate: number;
    /** 所选时间范围内 BD 的寄样申请总数 */
    shipment_count: number;
    /** 所选时间范围内 BD 的待签收包裹数 */
    shipment_wait_receive: number;
    /** 已完成的 SOP 数量（不受时间筛选影响） */
    sop_completed: number;
    /** 进行中的 SOP 数量（不受时间筛选影响） */
    sop_running: number;
    /** 已终止的 SOP 数量（不受时间筛选影响） */
    sop_terminated: number;
    /** sop_running + sop_completed + sop_terminated（前端计算值） */
    sop_total: number;
    /** BD 当前参与的有效任务总数（不受时间筛选影响） */
    total_task_count: number;
    /** 需要回收视频的总数（不受时间筛选影响） */
    video_total_recycle: number;
    /** 待回收视频数（不受时间筛选影响） */
    video_wait_recycle: number;
  }

  export interface KolRankItem {
    gmv: number;
    kol_id: string;
    kol_name: string;
    rank: number;
  }

  export interface BdRankItem {
    bd_code: string;
    bd_name: string;
    gmv: number;
    rank: number;
  }

  export interface DashboardResult {
    bd_rank: BdRankItem[];
    kol_rank: KolRankItem[];
    overview: DashboardOverview;
  }

  export interface DashboardParams {
    end_time?: number;
    start_time?: number;
    time_range?: 'custom' | 'this_month' | 'this_week' | 'today';
  }
}

/** BD 用户获取新版数据面板 */
export async function getBdDashboard(params?: BdDashboardApi.DashboardParams) {
  return requestClient.get<BdDashboardApi.DashboardResult>('/bd/dashboard', {
    params,
  });
}
