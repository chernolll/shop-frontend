import { requestClient } from '../request';

export namespace AdminKolApi {
  export interface TagItem {
    id: number;
    name: string;
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
    belong_bd_code?: string;
    current_prepare_bd_code?: string;
    entry_time_end?: number;
    entry_time_start?: number;
    followers_max?: number;
    followers_min?: number;
    is_paid?: PaidStatus;
    kol_id?: string;
    page: number;
    page_size: number;
    score_max?: number;
    score_min?: number;
    status?: KolStatus;
    tags?: string;
  }

  export interface ListItem {
    belong_bd_code: null | string;
    belong_bd_name: null | string;
    completed_task_count: number;
    contact_info: null | string;
    cooperation_fee: number;
    created_at: number;
    current_month_gmv: number;
    current_month_video_count: number;
    current_prepare_bd_code: null | string;
    current_prepare_bd_name: null | string;
    entry_time: number;
    followers: number;
    is_paid: PaidStatus;
    kol_id: string;
    kol_link: null | string;
    notes: null | string;
    participated_task_codes: null | string;
    participated_task_count: number;
    recent_two_month_gmv: number;
    recent_two_month_video_count: number;
    score: number;
    status: KolStatus;
    tags: TagItem[];
    updated_at: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface DetailParams {
    kol_id: string;
  }

  export interface DetailResult extends ListItem {
    prepare_pending_count: number;
    sop_active_count: number;
    sop_total_count: number;
    video_count: number;
  }

  export interface UpdateParams {
    belong_bd_code?: string;
    contact_info?: string;
    cooperation_fee?: number;
    followers?: number;
    is_paid?: PaidStatus;
    kol_id: string;
    kol_link?: string;
    notes?: string;
    score?: number;
    status?: KolStatus;
    tag_names?: string[];
  }

  export interface DeleteParams {
    kol_id: string;
  }

  export interface DeleteResult {
    kol_id: string;
  }

  export interface UnbindParams {
    kol_id: string;
  }

  export interface UnbindResult {
    belong_bd_code: null | string;
    kol_id: string;
  }

  export interface CreateParams {
    belong_bd_code?: string;
    contact_info?: string;
    cooperation_fee?: number;
    entry_time?: number;
    followers?: number;
    is_paid?: PaidStatus;
    kol_id: string;
    kol_link?: string;
    notes?: string;
    score?: number;
    status?: KolStatus;
    tag_names?: string[];
  }

  export interface TagListResult {
    list: TagItem[];
  }
}

/** Admin 查询达人列表 */
export async function getAdminKolList(params: AdminKolApi.ListParams) {
  return requestClient.get<AdminKolApi.ListResult>('/admin/kols', {
    params,
  });
}

/** Admin 查询达人详情 */
export async function getAdminKolDetail(params: AdminKolApi.DetailParams) {
  return requestClient.get<AdminKolApi.DetailResult>('/admin/kols/detail', {
    params,
  });
}

/** Admin 查询达人标签列表 */
export async function getAdminKolTagList() {
  return requestClient.get<AdminKolApi.TagListResult>('/admin/kol-tags');
}

/** Admin 编辑达人 */
export async function updateAdminKol(data: AdminKolApi.UpdateParams) {
  return requestClient.put<AdminKolApi.DetailResult>('/admin/kols', data);
}

/** Admin 删除达人 */
export async function deleteAdminKol(params: AdminKolApi.DeleteParams) {
  return requestClient.delete<AdminKolApi.DeleteResult>('/admin/kols', {
    params,
  });
}

/** Admin 解绑达人 */
export async function unbindAdminKol(data: AdminKolApi.UnbindParams) {
  return requestClient.put<AdminKolApi.UnbindResult>(
    '/admin/kols/unbind',
    data,
  );
}

/** Admin 新增达人 */
export async function createAdminKol(data: AdminKolApi.CreateParams) {
  return requestClient.post<AdminKolApi.DetailResult>(
    '/admin/kols/create',
    data,
  );
}

export namespace AdminKolCandidateApi {
  export interface ListParams {
    bd_code?: string;
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
}

/** Admin 查询达人筹备表 */
export async function getAdminKolCandidateList(
  params: AdminKolCandidateApi.ListParams,
) {
  return requestClient.get<AdminKolCandidateApi.ListResult>(
    '/admin/kol-candidates',
    { params },
  );
}
