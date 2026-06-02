import { requestClient } from '../request';

export namespace ReviewRemittanceApi {
  export enum RemittanceStatus {
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
    bd_code?: string | string[];
    kol_id?: string;
    page: number;
    page_size: number;
    product_listing_id?: number;
    status?: number;
    submit_time_end?: number;
    submit_time_start?: number;
    task_bd_id?: number;
    task_id?: number;
    task_sop_id?: number;
  }

  export interface ListItem {
    amount: number;
    bank_card_no: string;
    bank_name: string;
    bd_code: string;
    chat_attachment_count: number;
    chat_attachments: AttachmentItem[];
    created_at: number;
    default_amount: null | number;
    has_budget: 0 | 1;
    influencer_fee: number;
    kol_id: string;
    kol_link: null | string;
    payee_name: string;
    payment_attachment_count: number;
    payment_attachments: AttachmentItem[];
    product_listing_id: number;
    product_url: string;
    remark: null | string;
    remittance_id: number;
    review_remark: null | string;
    reviewed_at: null | number;
    reviewer_name: null | string;
    sop_status: SopStatus;
    status: RemittanceStatus;
    submit_at: number;
    submitter_name: string;
    task_bd_id: number;
    task_code: null | string;
    task_id: number;
    task_sop_id: number;
    video_ads_code: null | string;
    video_url: null | string;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface AttachmentItem {
    access_url: string;
    access_url_expired_at: number;
    file_key: string;
    file_name: string;
    r2_file_id: number;
    sort: number;
  }

  export interface DetailParams {
    remittance_id: number | string;
  }

  export interface DetailResult {
    amount: number;
    bank_card_no: string;
    bank_name: string;
    bd_code: string;
    chat_attachments: AttachmentItem[];
    default_amount: null | number;
    has_budget: 0 | 1;
    kol_id: string;
    payee_name: string;
    payment_attachments: AttachmentItem[];
    product_listing_id: number;
    product_url: string;
    remittance_id: number;
    review_remark: null | string;
    reviewed_at: null | number;
    reviewer_id: null | number;
    reviewer_name: null | string;
    sop_status: SopStatus;
    status: RemittanceStatus;
    submit_at: number;
    submitter_id: number;
    submitter_name: string;
    task_bd_id: number;
    task_id: number;
    task_sop_id: number;
    terminate_remark: null | string;
  }

  export interface ReviewItem {
    amount?: number;
    payment_attachment_file_ids?: number[];
    remittance_id: number | string;
    review_remark?: string;
    status?:
      | RemittanceStatus.ABANDONED
      | RemittanceStatus.APPROVED
      | RemittanceStatus.REJECTED;
  }

  export interface ReviewParams {
    list: ReviewItem[];
  }

  export interface ReviewResultItem {
    reason?: string;
    remittance_id: number;
    status?: RemittanceStatus;
    success: boolean;
  }
}

/** Admin 查询汇款申请列表 */
export async function getReviewRemittanceList(
  params: ReviewRemittanceApi.ListParams,
) {
  return requestClient.get<ReviewRemittanceApi.ListResult>(
    '/admin/sop/remittance/list',
    {
      params,
    },
  );
}

/** Admin 查询汇款申请详情 */
export async function getReviewRemittanceDetail(
  params: ReviewRemittanceApi.DetailParams,
) {
  return requestClient.get<ReviewRemittanceApi.DetailResult>(
    '/admin/sop/remittance/detail',
    {
      params,
    },
  );
}

/** Admin 审核汇款申请 */
export async function reviewRemittance(data: ReviewRemittanceApi.ReviewParams) {
  return requestClient.post<ReviewRemittanceApi.ReviewResultItem[]>(
    '/admin/sop/remittance/review',
    data,
  );
}
