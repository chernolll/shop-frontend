import { requestClient } from '../request';

export namespace KolPrepareApi {
  // --- Validate ---

  export interface ValidateParams {
    kol_ids: string[];
  }

  export interface ValidateResultItem {
    belong_bd_code: null | string;
    can_prepare: boolean;
    entry_time: null | number;
    kol_id: string;
    kol_status: null | number;
    prepared_bd_code: null | string;
    reason_code: number;
    reason_msg: string;
  }

  // --- Create ---

  export interface CreateItem {
    budget_amount?: null | number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_url?: string;
    remark?: null | string;
  }

  export interface CreateParams {
    list: CreateItem[];
  }

  // --- My List ---

  export interface MyListParams {
    kol_id?: string;
    page: number;
    page_size: number;
  }

  export interface MyListItem {
    budget_amount: null | number;
    entry_time: number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_url: null | string;
    prepare_id: number;
    remark: null | string;
  }

  // --- Update ---

  export interface UpdateParams {
    budget_amount?: null | number;
    has_budget: 0 | 1;
    kol_url?: string;
    prepare_id: number;
    remark?: null | string;
  }

  export interface MyListResult {
    list: MyListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  // --- Global List ---

  export interface GlobalListParams {
    entry_time_end?: number;
    entry_time_start?: number;
    has_budget?: 0 | 1;
    kol_id?: string;
    page: number;
    page_size: number;
  }

  export interface GlobalListItem {
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

  export interface GlobalListResult {
    list: GlobalListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  // --- Delete ---

  export interface DeleteParams {
    prepare_id: number;
  }

  export interface DeleteResult {
    prepare_id: number;
  }
}

/** 预校验达人是否可筹备 */
export async function validateKolPrepare(data: KolPrepareApi.ValidateParams) {
  return requestClient.post<KolPrepareApi.ValidateResultItem[]>(
    '/bd/validate-kol-prepare',
    data,
  );
}

/** BD 批量提交达人筹备记录 */
export async function createKolPrepare(data: KolPrepareApi.CreateParams) {
  return requestClient.post<null>('/bd/kol-prepare', data);
}

/** BD 查询自己的达人筹备记录 */
export async function getMyKolPrepareList(params: KolPrepareApi.MyListParams) {
  return requestClient.get<KolPrepareApi.MyListResult>('/bd/kol-prepare', {
    params,
  });
}

/** BD 查询全局达人筹备记录 */
export async function getGlobalKolPrepareList(
  params: KolPrepareApi.GlobalListParams,
) {
  return requestClient.get<KolPrepareApi.GlobalListResult>(
    '/bd/kol-prepare/list',
    { params },
  );
}

/** BD 更新达人筹备记录 */
export async function updateKolPrepare(data: KolPrepareApi.UpdateParams) {
  return requestClient.put<{ prepare_id: number }>('/bd/kol-prepare', data);
}

/** BD 删除达人筹备记录 */
export async function deleteKolPrepare(data: KolPrepareApi.DeleteParams) {
  return requestClient.put<KolPrepareApi.DeleteResult>(
    '/bd/kol-prepare/delete',
    data,
  );
}
