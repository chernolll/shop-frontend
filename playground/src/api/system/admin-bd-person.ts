import type { AdminEmployeeApi } from './admin-employee';

import { requestClient } from '#/api/request';

export namespace AdminBdPersonApi {
  export interface ListParams {
    bd_code?: string;
    dept_id?: number;
    employee_id?: number;
    employee_no?: string;
    employee_status?: AdminEmployeeApi.Status;
    id?: number;
    page: number;
    page_size: number;
  }

  export interface BdPersonItem {
    bd_code: string;
    created_at: number;
    dept_id: null | number;
    dept_name: null | string;
    employee_id: number;
    employee_name: string;
    employee_no: string;
    employee_status: AdminEmployeeApi.Status;
    id: number;
    leave_time: null | number;
    post_id: null | number;
    post_name: null | string;
    prepare_kol_count: number;
    total_gmv: number;
    total_kol_count: number;
    total_video_count: number;
    updated_at: number;
  }

  export interface ListResult {
    list: BdPersonItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface CreateParams {
    employee_id: number;
  }

  export interface UpdateParams extends CreateParams {
    bd_code: string;
    id: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface DeleteResult {
    id: number;
  }

  // --- Release Departed BD's KOLs ---

  export interface ReleaseDepartedBDParams {
    bd_code: string;
  }

  export interface ReleaseDepartedBDResult {
    bd_code: string;
    released_count: number;
    skipped_count: number;
    total_kols: number;
  }
}

export async function getAdminBdPersonList(
  params: AdminBdPersonApi.ListParams,
) {
  return requestClient.get<AdminBdPersonApi.ListResult>('/admin/bd-persons', {
    params,
  });
}

export async function createAdminBdPerson(data: AdminBdPersonApi.CreateParams) {
  return requestClient.post<AdminBdPersonApi.BdPersonItem>(
    '/admin/bd-persons',
    data,
  );
}

export async function updateAdminBdPerson(data: AdminBdPersonApi.UpdateParams) {
  return requestClient.put<AdminBdPersonApi.BdPersonItem>(
    '/admin/bd-persons',
    data,
  );
}

export async function deleteAdminBdPerson(
  params: AdminBdPersonApi.DeleteParams,
) {
  return requestClient.delete<AdminBdPersonApi.DeleteResult>(
    '/admin/bd-persons',
    {
      params,
    },
  );
}

/** Admin 释放离职BD的筹备达人到达人池 */
export async function releaseDepartedBDKOLs(
  data: AdminBdPersonApi.ReleaseDepartedBDParams,
) {
  return requestClient.post<AdminBdPersonApi.ReleaseDepartedBDResult>(
    '/admin/kols/release-departed-bd',
    data,
  );
}
