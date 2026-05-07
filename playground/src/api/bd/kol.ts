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
  export enum ViewType {
    MY_KOLS = 1,
    UNASSIGNED_KOLS = 2,
  }

  export enum KolStatus {
    NORMAL = 1,
    LOST = 2,
    BLACKLIST = 3,
  }

  export enum PaidStatus {
    NO = 0,
    YES = 1,
  }

  export interface ListParams {
    kol_id?: string;
    page: number;
    page_size: number;
    status?: KolStatus;
    view_type: ViewType;
  }

  export interface ListItem {
    belong_bd_code: null | string;
    can_claim: 0 | 1;
    claim_block_reason: null | string;
    completed_task_count: number;
    contact_info: null | string;
    cooperation_fee: number;
    created_at: number;
    entry_time: number;
    followers: number;
    is_paid: PaidStatus;
    kol_id: string;
    kol_link: null | string;
    notes: null | string;
    participated_task_count: number;
    score: number;
    status: KolStatus;
    updated_at: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ClaimParams {
    kol_id: string;
  }

  export interface ClaimResult {
    belong_bd_code: string;
    kol_id: string;
  }

  export interface UnbindParams {
    kol_id: string;
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

/** BD 查询达人列表 */
export async function getBdKolList(params: BdKolListApi.ListParams) {
  return requestClient.get<BdKolListApi.ListResult>('/bd/kols', {
    params,
  });
}

/** BD 认领达人 */
export async function claimBdKol(data: BdKolListApi.ClaimParams) {
  return requestClient.put<BdKolListApi.ClaimResult>('/bd/kols/claim', data);
}

/** BD 解绑达人 */
export async function unbindBdKol(data: BdKolListApi.UnbindParams) {
  return requestClient.put<BdKolListApi.UnbindResult>('/bd/kols/unbind', data);
}
