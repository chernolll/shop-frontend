import { requestClient } from '../request';

export namespace ReviewKolPrepareApi {
  export enum Status {
    WAITING = 0,
    PENDING = 1,
    REJECTED = 2,
    APPROVED = 3,
  }

  export interface ListParams {
    bd_code?: string;
    entry_time_end?: number;
    entry_time_start?: number;
    kol_id?: string;
    page: number;
    page_size: number;
    status?: number;
    task_bd_id?: number;
    task_id?: number;
  }

  export interface ListItem {
    audit_time: null | number;
    bd_code: string;
    entry_time: number;
    kol_id: string;
    kol_link: string;
    prepare_id: number;
    product_listing_id: number;
    product_url: null | string;
    reason: null | string;
    reviewer_name: null | string;
    sop_id: null | number;
    status: Status;
    task_bd_id: number;
    task_id: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ReviewItem {
    prepare_id: number;
    reason?: string;
    status: Status.APPROVED | Status.REJECTED;
  }

  export interface ReviewParams {
    list: ReviewItem[];
  }

  export interface ReviewResultItem {
    prepare_id: number;
    reason?: string;
    success: boolean;
  }
}

/** Admin 查询达人筹备审核列表 */
export async function getReviewKolPrepareList(
  params: ReviewKolPrepareApi.ListParams,
) {
  return requestClient.get<ReviewKolPrepareApi.ListResult>(
    '/admin/kol-prepare',
    {
      params,
    },
  );
}

/** Admin 批量审核达人筹备记录 */
export async function reviewKolPrepare(data: ReviewKolPrepareApi.ReviewParams) {
  return requestClient.post<ReviewKolPrepareApi.ReviewResultItem[]>(
    '/admin/kol-prepare/review',
    data,
  );
}
