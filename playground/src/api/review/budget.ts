import { requestClient } from '../request';

export namespace ReviewBudgetApi {
  export enum BudgetStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
  }

  export enum SopStatus {
    CONTACT = 0,
    SAMPLE = 1,
    RECOVER = 2,
    COMPLETED = 3,
    REMITTANCE = 4,
    TERMINATED = 5,
  }

  export interface ListParams {
    bd_code?: string;
    kol_id?: string;
    page: number;
    page_size: number;
    status?: number;
    submit_time_end?: number;
    submit_time_start?: number;
  }

  export interface ListItem {
    amount: number;
    bd_code: string;
    budget_application_id: number;
    budget_status: BudgetStatus;
    contact_information: string;
    kol_id: string;
    product_listing_id: number;
    product_url: string;
    reason: string;
    reviewed_at: null | number;
    reviewer_name: null | string;
    sop_status: SopStatus;
    submit_at: number;
    submitter_name: string;
    task_bd_id: number;
    task_id: number;
    task_sop_id: number;
    terminate_remark: null | string;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ReviewItem {
    budget_application_id: number | string;
    reason?: string;
    status: BudgetStatus.APPROVED | BudgetStatus.REJECTED;
  }

  export interface ReviewParams {
    list: ReviewItem[];
  }

  export interface ReviewResultItem {
    budget_application_id: number;
    budget_status?: BudgetStatus;
    reason?: string;
    sop_status?: SopStatus;
    success: boolean;
  }
}

/** Admin 查询预算申请列表 */
export async function getReviewBudgetList(params: ReviewBudgetApi.ListParams) {
  return requestClient.get<ReviewBudgetApi.ListResult>(
    '/admin/sop-budget/list',
    {
      params,
    },
  );
}

/** Admin 审核预算申请 */
export async function reviewBudget(data: ReviewBudgetApi.ReviewParams) {
  return requestClient.post<ReviewBudgetApi.ReviewResultItem[]>(
    '/admin/sop-budget/review',
    data,
  );
}
