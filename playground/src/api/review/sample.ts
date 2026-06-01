import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '../request';

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
    city: null | string;
    contact_name: null | string;
    contact_phone: null | string;
    created_at: number;
    delivered_at: null | number;
    detail_address: null | string;
    district: null | string;
    kol_id: string;
    order_number: null | string;
    package_received: 0 | 1;
    postcode: null | string;
    product_listing_id: number;
    product_url: string;
    province: null | string;
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
    city?: string;
    contact_name?: string;
    contact_phone?: string;
    delivered_at?: number;
    detail_address?: string;
    district?: string;
    package_received?: 0 | 1;
    postcode?: string;
    province?: string;
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

/** Admin 导出订单表格（返回 Excel 文件 blob，绕过 JSON 拦截器） */
export async function exportSampleOrders(): Promise<Blob> {
  const accessStore = useAccessStore();
  const response = await baseRequestClient.get(
    '/admin/sop/sample/export-orders',
    {
      headers: {
        Authorization: accessStore.accessToken
          ? `Bearer ${accessStore.accessToken}`
          : undefined,
      },
      responseType: 'blob',
    },
  );
  return response.data as Blob;
}

/** 同步物流单号结果项 */
export interface SyncTrackingItem {
  logistics_name: string;
  order_number: string;
  tracking_number: string;
}

/** 同步物流单号结果 */
export interface SyncTrackingResult {
  errors: string[];
  matched: SyncTrackingItem[];
  total: number;
  unmatched: string[];
}

/** Admin 同步物流单号（从 ERP 系统获取物流号并更新） */
export async function syncTracking(): Promise<SyncTrackingResult> {
  return requestClient.post('/admin/sop/sample/sync-tracking');
}
