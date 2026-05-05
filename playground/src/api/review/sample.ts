import { requestClient } from '../request';

export namespace ReviewSampleApi {
  export enum RequestStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    ABANDONED = 3,
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
    created_time_end?: number;
    created_time_start?: number;
    kol_id?: string;
    page: number;
    page_size: number;
    status?: number;
  }

  export interface ListItem {
    address: string;
    bd_code: string;
    created_at: number;
    delivered_at: null | number;
    kol_id: string;
    package_received: 0 | 1;
    product_listing_id: number;
    product_url: string;
    quantity: number;
    request_id: number;
    review_reason: null | string;
    reviewed_at: null | number;
    reviewer_name: null | string;
    sop_status: SopStatus;
    status: RequestStatus;
    task_bd_id: number;
    task_id: number;
    task_sop_id: number;
    terminate_remark: null | string;
    tracking_number: null | string;
    updated_at: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ReviewItem {
    address?: string;
    delivered_at?: number;
    package_received?: 0 | 1;
    quantity?: number;
    reason?: string;
    request_id: number | string;
    status?: RequestStatus;
    tracking_number?: string;
  }

  export interface ReviewParams {
    list: ReviewItem[];
  }

  export interface ReviewResultItem {
    package_received?: 0 | 1;
    reason?: string;
    request_id: number;
    request_status?: RequestStatus;
    sop_status?: SopStatus;
    success: boolean;
  }
}

/** Admin 查询寄样申请列表 */
export async function getReviewSampleList(params: ReviewSampleApi.ListParams) {
  return requestClient.get<ReviewSampleApi.ListResult>(
    '/admin/sop/sample/requests',
    {
      params,
    },
  );
}

/** Admin 审核寄样申请 */
export async function reviewSample(data: ReviewSampleApi.ReviewParams) {
  return requestClient.post<ReviewSampleApi.ReviewResultItem[]>(
    '/admin/sop/sample/review',
    data,
  );
}
