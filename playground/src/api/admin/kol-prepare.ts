import { requestClient } from '../request';

export namespace AdminKolPrepareApi {
  export interface ListParams {
    bd_code?: string;
    entry_time_end?: number;
    entry_time_start?: number;
    has_budget?: 0 | 1;
    kol_id?: string;
    page: number;
    page_size: number;
  }

  export interface ListItem {
    bd_code: string;
    budget_amount: null | number;
    entry_time: number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_url: null | string;
    participated_task_count: number;
    prepare_id: number;
    remark: null | string;
    sop_id: null | number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }
}

/** Admin 查询全局达人筹备记录 */
export async function getAdminKolPrepareList(
  params: AdminKolPrepareApi.ListParams,
) {
  return requestClient.get<AdminKolPrepareApi.ListResult>(
    '/admin/kol-prepare',
    { params },
  );
}
