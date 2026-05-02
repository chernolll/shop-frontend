import { requestClient } from '../request';

export namespace BDSopApi {
  export enum BudgetReviewStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
  }

  export enum SampleRequestStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    ABANDONED = 3,
  }

  export enum Status {
    CONTACT = 0,
    SAMPLE = 1,
    RECOVER = 2,
    COMPLETED = 3,
    REMITTANCE = 4,
    TERMINATED = 5,
  }

  export interface ListParams {
    end_date?: number;
    page: number;
    page_size: number;
    sop_status?: number;
    start_date?: number;
  }

  export interface Item {
    bd_code: string;
    brief_url: null | string;
    id: number;
    kol_id: string;
    product_id: number;
    product_url: null | string;
    status: number;
    task_bd_id: number;
    task_budget: number;
    task_commission: number;
    task_created_at: number;
    task_deadline: null | number;
    task_id: number;
    task_type: number;
    terminate_remark: null | string;
  }

  export interface ContactRecord {
    budget: number;
    budget_status?: BudgetReviewStatus;
    contact_information: string;
    created_at: number;
    id: number;
    task_sop_id: number;
    updated_at: number;
  }

  export interface ContactDetail {
    bd_code: string;
    brief_url: null | string;
    contact: ContactRecord | null;
    kol_id: string;
    product_id: number;
    product_url: null | string;
    remittance_status?: BudgetReviewStatus;
    sop_status: Status;
    task_bd_id: number;
    task_budget: number;
    task_commission: number;
    task_created_at: number;
    task_deadline: null | number;
    task_id: number;
    task_type: number;
    terminate_remark: null | string;
  }

  export interface ContactDetailParams {
    task_sop_id: number;
  }

  export interface UpdateContactParams {
    budget: number;
    contact_information: string;
    task_sop_id: number | string;
  }

  export interface UpdateContactResult {
    sop_status: Status;
  }

  export interface SampleDetail {
    address: string;
    delivered_at: null | number;
    package_received: 0 | 1;
    product_url: null | string;
    quantity: number;
    sop_status: Status;
    task_sop_id: number;
    terminate_remark: null | string;
    tracking_number: null | string;
  }

  export interface SampleDetailParams {
    task_sop_id: number | string;
  }

  export interface SampleRequestItem {
    address: string;
    created_at: number;
    product_listing_id: number;
    quantity: number;
    request_id: number;
    review_reason: null | string;
    reviewed_at: null | number;
    status: SampleRequestStatus;
    task_sop_id: number;
    updated_at: number;
  }

  export interface SampleRequestListResult {
    list: SampleRequestItem[];
  }

  export interface SampleRequestListParams {
    task_sop_id: number | string;
  }

  export interface CreateSampleRequestParams {
    address: string;
    package_received?: 0 | 1;
    quantity: number;
    task_sop_id: number | string;
  }

  export interface CreateSampleRequestResult {
    package_received: 0 | 1;
    request_id: number;
    sop_status: Status;
  }

  export interface AbandonSampleRequestParams {
    request_id: number | string;
    task_sop_id: number | string;
  }

  export interface AbandonSampleRequestResult {
    request_id: number;
    sop_status: Status;
    status: SampleRequestStatus;
  }

  export interface ConfirmSampleReceivedParams {
    task_sop_id: number | string;
  }

  export interface ConfirmSampleReceivedResult {
    package_received?: 0 | 1;
    sop_status: Status;
  }

  export interface VideoDetail {
    ads_code: null | string;
    sop_status: Status;
    task_sop_id: number;
    terminate_remark: null | string;
    upload_time: null | number;
    video_url: string;
  }

  export interface VideoDetailParams {
    task_sop_id: number | string;
  }

  export interface UpdateVideoParams {
    ads_code?: null | string;
    task_sop_id: number | string;
    upload_time: number;
    video_url: string;
  }

  export interface UpdateVideoResult {
    ads_code: null | string;
    sop_status: Status;
    upload_time: number;
    video_url: string;
  }

  export interface TerminateSopParams {
    remark?: string;
    task_sop_id: number | string;
  }

  export interface TerminateSopResult {
    sop_status: Status;
  }

  export interface ListResult {
    list: Item[];
    page: number;
    page_size: number;
    total: number;
  }
}

/** BD 用户获取自己的 SOP 列表 */
export async function getBDSopList(params: BDSopApi.ListParams) {
  return requestClient.get<BDSopApi.ListResult>('/bd/sop', { params });
}

/** BD 用户获取某条 SOP 的建联详情 */
export async function getBDSopContactDetail(
  params: BDSopApi.ContactDetailParams,
) {
  return requestClient.get<BDSopApi.ContactDetail>('/bd/sop/contact', {
    params,
  });
}

/** BD 用户编辑某条 SOP 的建联信息 */
export async function updateBDSopContact(data: BDSopApi.UpdateContactParams) {
  return requestClient.put<BDSopApi.UpdateContactResult>(
    '/bd/sop/contact',
    data,
  );
}

/** BD 用户获取某条 SOP 的送样详情 */
export async function getBDSopSampleDetail(
  params: BDSopApi.SampleDetailParams,
) {
  return requestClient.get<BDSopApi.SampleDetail>('/bd/sop/sample', {
    params,
  });
}

/** BD 用户获取某条 SOP 的送样申请记录 */
export async function getBDSopSampleRequests(
  params: BDSopApi.SampleRequestListParams,
) {
  return requestClient.get<BDSopApi.SampleRequestListResult>(
    '/bd/sop/sample/requests',
    {
      params,
    },
  );
}

/** BD 用户提交一条送样申请 */
export async function createBDSopSampleRequest(
  data: BDSopApi.CreateSampleRequestParams,
) {
  return requestClient.post<BDSopApi.CreateSampleRequestResult>(
    '/bd/sop/sample/request',
    data,
  );
}

/** BD 用户废弃一条待审核送样申请 */
export async function abandonBDSopSampleRequest(
  data: BDSopApi.AbandonSampleRequestParams,
) {
  return requestClient.put<BDSopApi.AbandonSampleRequestResult>(
    '/bd/sop/sample/request/abandon',
    data,
  );
}

/** BD 用户确认包裹已收到 */
export async function confirmBDSopSampleReceived(
  data: BDSopApi.ConfirmSampleReceivedParams,
) {
  return requestClient.put<BDSopApi.ConfirmSampleReceivedResult>(
    '/bd/sop/sample/received',
    data,
  );
}

/** BD 用户获取某条 SOP 的视频阶段详情 */
export async function getBDSopVideoDetail(params: BDSopApi.VideoDetailParams) {
  return requestClient.get<BDSopApi.VideoDetail>('/bd/sop/video', {
    params,
  });
}

/** BD 用户提交某条 SOP 的视频信息 */
export async function updateBDSopVideo(data: BDSopApi.UpdateVideoParams) {
  return requestClient.put<BDSopApi.UpdateVideoResult>('/bd/sop/video', data);
}

/** BD 用户终止一条 SOP */
export async function terminateBDSop(data: BDSopApi.TerminateSopParams) {
  return requestClient.put<BDSopApi.TerminateSopResult>(
    '/bd/sop/terminate',
    data,
  );
}
