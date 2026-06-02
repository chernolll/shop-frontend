import { requestClient } from '../request';

export namespace KolApi {
  export interface ValidKolStateParams {
    /** task_bd_relation.id */
    kol_ids: string[];
    task_id: number;
  }

  export interface ValidKolStateResult {
    belong_bd_code?: string;
    can_prepare: boolean;
    entry_time: number;
    kol_id: string;
    kol_status: number;
    prepare_status: number;
    prepared_bd_code?: string;
    reason_code: number;
    reason_msg: string;
  }
}

export namespace BdKolListApi {
  export interface ListParams {
    kol_id?: string;
    page: number;
    page_size: number;
    prepared_bd_code?: string;
  }

  export interface ListItem {
    bd_code: string;
    created_at: number;
    entry_time: number;
    has_belong_bd: 0 | 1;
    id: number;
    is_duplicate: 0 | 1;
    kol_contact_info?: null | string;
    kol_cooperation_fee?: null | number;
    kol_followers?: null | number;
    kol_id: string;
    kol_is_paid?: null | number;
    kol_link: null | string;
    kol_score?: null | number;
    kol_status?: null | number;
    prepared_bd_code: null | string;
    prepared_bd_name: null | string;
    updated_at: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface CreateParams {
    items: { kol_id: string; kol_link: string }[];
  }

  export interface CreateResultItem {
    is_duplicate: 0 | 1;
    kol_id: string;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface DeleteResult {
    id: number;
  }

  export interface UnbindResult {
    belong_bd_code: null | string;
    kol_id: string;
  }
}

/** 校验达人是否可加入当前任务筹备表 */
export async function queryKolPrepareState(data: KolApi.ValidKolStateParams) {
  return requestClient.post<KolApi.ValidKolStateResult[]>(
    '/bd/validate-kol-prepare',
    data,
  );
}

/** BD 查询达人列表（来自候选表） */
export async function getBdKolList(params: BdKolListApi.ListParams) {
  return requestClient.get<BdKolListApi.ListResult>('/bd/kols', {
    params,
  });
}

/** BD 新增候选达人 */
export async function createKolCandidate(data: BdKolListApi.CreateParams) {
  return requestClient.post<BdKolListApi.CreateResultItem[]>(
    '/bd/kol-candidate/create',
    data,
  );
}

/** BD 删除候选达人 */
export async function deleteKolCandidate(data: BdKolListApi.DeleteParams) {
  return requestClient.put<BdKolListApi.DeleteResult>(
    '/bd/kol-candidate/delete',
    data,
  );
}

/** BD 解绑达人（已废弃，保留接口兼容） */
export async function unbindBdKol(data: BdKolListApi.DeleteParams) {
  return requestClient.put<BdKolListApi.UnbindResult>('/bd/kols/unbind', data);
}

export namespace BdKolLibraryApi {
  export interface ListParams {
    kol_id?: string;
    page: number;
    page_size: number;
  }

  export interface ListItem {
    kol_id: string;
    kol_link: null | string;
    followers: number;
    is_paid: number;
    cooperation_fee: number;
    contact_info: null | string;
    belong_bd_code: null | string;
    participated_task_count: number;
    completed_task_count: number;
    status: number;
    score: number;
    notes: null | string;
    entry_time: number;
    created_at: number;
    updated_at: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }
}

/** BD 查询达人库（自己的正常达人，来自 kol 表） */
export async function getBdKolLibraryList(
  params: BdKolLibraryApi.ListParams,
) {
  return requestClient.get<BdKolLibraryApi.ListResult>('/bd/kol-library', {
    params,
  });
}
