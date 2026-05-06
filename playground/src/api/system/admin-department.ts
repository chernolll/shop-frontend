import { requestClient } from '#/api/request';

export namespace AdminDepartmentApi {
  export interface ListParams {
    code?: string;
    name?: string;
    page: number;
    page_size: number;
  }

  export interface DepartmentItem {
    code: string;
    created_at: number;
    employee_count: number;
    id: number;
    name: string;
    updated_at: number;
  }

  export interface ListResult {
    list: DepartmentItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface CreateParams {
    code: string;
    name: string;
  }

  export interface UpdateParams extends CreateParams {
    id: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface DeleteResult {
    id: number;
  }
}

export async function getAdminDepartmentList(
  params: AdminDepartmentApi.ListParams,
) {
  return requestClient.get<AdminDepartmentApi.ListResult>(
    '/admin/departments',
    {
      params,
    },
  );
}

export async function createAdminDepartment(
  data: AdminDepartmentApi.CreateParams,
) {
  return requestClient.post<AdminDepartmentApi.DepartmentItem>(
    '/admin/departments',
    data,
  );
}

export async function updateAdminDepartment(
  data: AdminDepartmentApi.UpdateParams,
) {
  return requestClient.put<AdminDepartmentApi.DepartmentItem>(
    '/admin/departments',
    data,
  );
}

export async function deleteAdminDepartment(
  params: AdminDepartmentApi.DeleteParams,
) {
  return requestClient.delete<AdminDepartmentApi.DeleteResult>(
    '/admin/departments',
    {
      params,
    },
  );
}
