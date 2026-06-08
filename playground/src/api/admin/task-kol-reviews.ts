import { requestClient } from '../request';

export namespace AdminTaskKolReviewApi {
  export enum ReviewStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
  }

  export interface ListParams {
    bd_codes?: string;
    page: number;
    page_size: number;
    review_status?: number;
    task_name?: string;
  }

  export interface ListItem {
    brand: null | string;
    budget: null | number;
    commission_private: null | number;
    commission_public: null | number;
    cost_price: null | number;
    currency: null | string;
    has_budget: number;
    // task_kol_review
    id: number;
    kol_contact_info: null | string;
    kol_cooperation_fee: null | number;
    // kol
    kol_followers: null | number;
    kol_id: string;
    kol_is_paid: null | number;
    kol_note: null | string;
    kol_notes: null | string;
    kol_score: null | number;
    kol_status: null | number;
    kol_url: null | string;
    // product_listing
    main_sku_id: null | number;
    offline_margin: null | number;
    online_margin: null | number;
    // kol_bd_prepare
    prepare_bd_code: null | string;
    product_listing_status: null | number;
    product_url: null | string;
    retail_price: null | number;
    review_note: null | string;
    review_status: number;
    // product_sku
    sku_code: null | string;
    sku_name: null | string;
    sku_status: null | number;
    sku_type: null | number;
    // task_main
    task_name: null | string;
  }

  export interface ListResult {
    list: ListItem[];
    total: number;
  }

  export interface ReviewItem {
    budget?: null | number;
    has_budget?: number;
    id: number;
    note?: string;
    pass: boolean;
  }

  export interface ReviewResultItem {
    id: number;
    reason: null | string;
    success: boolean;
  }
}

/** Admin 查询任务-达人审核列表 */
export async function getAdminTaskKolReviewList(
  params: AdminTaskKolReviewApi.ListParams,
) {
  return requestClient.get<AdminTaskKolReviewApi.ListResult>(
    '/admin/task-kol-reviews',
    { params },
  );
}

/** Admin 批量审核任务-达人提交 */
export async function reviewTaskKol(data: AdminTaskKolReviewApi.ReviewItem[]) {
  return requestClient.post<AdminTaskKolReviewApi.ReviewResultItem[]>(
    '/admin/task-kol-reviews/review',
    data,
  );
}
