import { requestClient } from '../request';

export namespace BdTaskApi {
  export enum TaskStatus {
    NORMAL = 0,
    ABANDONED = 1,
  }

  // 查看BD任务参数
  export interface BdTaskListParams {
    deadlineEnd?: number; // 截止时间结束
    deadlineStart?: number; // 截止时间开始
    hasBudget?: 0 | 1; // 是否有预算
    page: number;
    pageSize: number;
    task_code?: string; // 任务代码
    taskCode?: string; // 任务代码
    taskStatus?: TaskStatus; // 任务状态
  }
  export interface BDTaskRow {
    briefUrl: string;
    commission: number; // 佣金
    completedVideos: number; // 已完成视频数
    deadline: number; // 截止日期 单位毫秒
    hasBudget: 0 | 1; // 是否有预算 1:有
    hasPrepareRecords: number; // 是否提交过达人审核记录
    main_sku_code?: string;
    main_sku_name?: string;
    main_sku_status?: number;
    prepareApprovedCount: number; // 达人审核通过数量
    preparePendingCount: number; // 达人审核中/待审核数量
    prepareRejectedCount: number; // 达人审核驳回数量
    prepareTotalCount: number; // 达人审核提交总数
    product_listing_id?: number;
    productListingId?: number;
    productUrl: string;
    relationId: number; // task_bd_relation.id
    task_code?: string;
    task_status?: TaskStatus;
    taskCode?: string;
    taskId: number; // task_main.id
    taskStatus?: TaskStatus;
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

export namespace BdPublicTaskApi {
  export interface BdPublicTaskListParams {
    deadlineEnd?: number;
    deadlineStart?: number;
    hasBudget?: boolean;
    page: number;
    pageSize: number;
  }

  export interface BdPublicTaskItem {
    bd_count: number;
    budget: 0 | 1;
    commission: number;
    created_at: number;
    deadline: null | number;
    main_sku_brand?: string;
    main_sku_code?: string;
    main_sku_name?: string;
    main_sku_status?: number;
    product_listing_id: number;
    product_url: string;
    task_id: number;
    video_num: number;
  }

  export interface BdPublicTaskListResult {
    list: BdPublicTaskItem[];
    total: number;
  }
}

export namespace BdAnalyticsApi {
  export interface KOLSalesRankItem {
    kol_id: string;
    kol_name: string;
    gmv: number;
    rank: number;
  }

  export interface BDSalesRankItem {
    bd_code: string;
    bd_name: string;
    gmv: number;
    rank: number;
  }

  export interface BDAnalyticsResult {
    monthly_gmv: number;
    monthly_completed_tasks: number;
    deadline_14days_tasks: number;
    total_kols: number;
    kol_sales_ranking: KOLSalesRankItem[];
    bd_sales_ranking: BDSalesRankItem[];
  }
}

/** BD 用户获取数据面板 */
export async function getBDAnalytics() {
  return requestClient.get<BdAnalyticsApi.BDAnalyticsResult>('/bd/analytics');
}

/** BD 用户获取公开任务列表 */
export async function getBDPublicTaskList(
  params: BdPublicTaskApi.BdPublicTaskListParams,
) {
  return requestClient.get<BdPublicTaskApi.BdPublicTaskListResult>(
    '/bd/public-tasks',
    { params },
  );
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
