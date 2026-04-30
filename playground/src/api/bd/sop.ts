import { requestClient } from '../request';

export namespace BDSopApi {
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
