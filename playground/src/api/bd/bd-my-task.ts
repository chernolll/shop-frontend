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
    hasPrepareRecords: number; // 是否提交过达人审核记录
    main_sku_brand?: string;
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
    taskName?: string; // 任务名称
    taskStatus?: TaskStatus;
    taskTags?: string[]; // 任务标签
    totalVideos: number; // 总视频数 task_bd_relation.video_quantity
  }

  export interface BdTasListResult {
    list: BDTaskRow[];
    total: number;
  }
}

export namespace BdPublicTaskApi {
  export interface BdPublicTaskListParams {
    deadlineEnd?: number;
    deadlineStart?: number;
    page: number;
    pageSize: number;
  }

  export interface BdPublicTaskItem {
    bd_count: number;
    commission: number;
    created_at: number;
    deadline: null | number;
    main_sku_brand?: string;
    main_sku_brand?: string;
    main_sku_code?: string;
    main_sku_name?: string;
    main_sku_status?: number;
    name?: string;
    product_listing_id: number;
    product_url: string;
    tags?: string[];
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
    gmv: number;
    kol_id: string;
    kol_name: string;
    rank: number;
  }

  export interface BDSalesRankItem {
    bd_code: string;
    bd_name: string;
    gmv: number;
    rank: number;
  }

  export interface BDAnalyticsResult {
    bd_sales_ranking: BDSalesRankItem[];
    deadline_14days_tasks: number;
    kol_sales_ranking: KOLSalesRankItem[];
    monthly_completed_tasks: number;
    monthly_gmv: number;
    total_kols: number;
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

// --- BD Join Public Task ---

/** BD 直接加入公开任务（无需审核） */
export async function joinPublicTask(data: { task_id: number }) {
  return requestClient.post<{
    bd_code: string;
    created_at: string;
    follow_entry_time: number;
    id: number;
    task_code: string;
    task_id: number;
    updated_at: string;
    video_quantity: number;
  }>('/bd/public-tasks/join', data);
}

// --- BD 有效筹备达人 ---

export namespace BdPrepareKolApi {
  export interface ValidKolItem {
    budget_amount: null | number;
    entry_time: number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_url: null | string;
    remark: null | string;
  }
}

/** BD 查询自己的有效筹备达人列表（去重+状态过滤） */
export async function getValidPrepareKols() {
  return requestClient.get<BdPrepareKolApi.ValidKolItem[]>(
    '/bd/prepare-kols/valid',
  );
}

// --- BD 提交达人参与任务 ---

export namespace BdSubmitKolApi {
  export interface SubmitKolItem {
    budget?: null | number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_note?: string;
    kol_url?: string;
    product_listing_id: number;
    task_id: number;
  }

  export interface SubmitKolResult {
    failed_kol_ids: string[];
    success_count: number;
  }
}

/** BD 提交达人参与任务 → 创建审核记录 */
export async function submitKolsToTask(data: BdSubmitKolApi.SubmitKolItem[]) {
  return requestClient.post<BdSubmitKolApi.SubmitKolResult>(
    '/bd/tasks/submit-kols',
    data,
  );
}
