import { requestClient } from '../request';

export namespace AdminKolPoolApi {
  // --- List ---

  export interface ListParams {
    has_budget?: 0 | 1;
    kol_id?: string;
    page: number;
    page_size: number;
    source_type?: 1 | 2;
  }

  export interface ListItem {
    budget_amount: null | number;
    created_at: number;
    has_budget: 0 | 1;
    id: number;
    kol_id: string;
    kol_url: null | string;
    remark: null | string;
    source_bd_code: null | string;
    source_type: 1 | 2;
    updated_at: number;
    uploader_id: null | number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  // --- Create ---

  export interface CreateParams {
    budget_amount?: null | number;
    has_budget: 0 | 1;
    kol_id: string;
    kol_url?: string;
    remark?: null | string;
  }

  // --- Update ---

  export interface UpdateParams {
    budget_amount?: null | number;
    has_budget?: 0 | 1;
    id: number;
    kol_url?: string;
    remark?: null | string;
  }

  // --- Delete ---

  export interface DeleteResult {
    id: number;
  }
}

/** Admin 查看达人池列表 */
export async function getAdminKolPoolList(params: AdminKolPoolApi.ListParams) {
  return requestClient.get<AdminKolPoolApi.ListResult>('/admin/kol-pool', {
    params,
  });
}

/** Admin 新增达人池记录 */
export async function createKolPoolRecord(data: AdminKolPoolApi.CreateParams) {
  return requestClient.post<null>('/admin/kol-pool', data);
}

/** Admin 编辑达人池记录 */
export async function updateKolPoolRecord(data: AdminKolPoolApi.UpdateParams) {
  return requestClient.put<null>('/admin/kol-pool', data);
}

/** Admin 删除达人池记录（软删除） */
export async function deleteKolPoolRecord(id: number) {
  return requestClient.delete<AdminKolPoolApi.DeleteResult>('/admin/kol-pool', {
    params: { id },
  });
}
