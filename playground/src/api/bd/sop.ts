import { requestClient } from '../request';

export namespace BDSopApi {
  export enum BudgetReviewStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
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
