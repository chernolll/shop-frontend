import { requestClient } from '#/api/request';

export namespace AdminEmployeeApi {
  export enum Status {
    ACTIVE = 1,
    LEFT = 2,
  }

  export enum Gender {
    UNKNOWN = 0,
    MALE = 1,
    FEMALE = 2,
  }

  export enum BdFlag {
    NO = 0,
    YES = 1,
  }

  export interface ListParams {
    country?: string;
    dept_id?: number;
    employee_no?: string;
    id?: number;
    is_bd?: BdFlag;
    name?: string;
    page: number;
    page_size: number;
    post_id?: number;
    status?: Status;
  }

  export interface EmployeeItem {
    avatar: string;
    avatar_file_key?: string;
    bd_code: null | string;
    country: string;
    created_at: number;
    dept_id: null | number;
    dept_name: null | string;
    display_name: string;
    emergency_contact: null | string;
    emergency_phone: null | string;
    employee_no: string;
    entry_time: number;
    gender: Gender;
    id: number;
    id_card: null | string;
    lark_id: null | string;
    leave_time: null | number;
    name_cn: null | string;
    name_en: null | string;
    name_th: null | string;
    performance_bonus: number;
    phone: null | string;
    post_id: null | number;
    post_name: null | string;
    remark: null | string;
    salary: number;
    status: Status;
    subsidy: number;
    updated_at: number;
  }

  export interface ListResult {
    list: EmployeeItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface DetailParams {
    id: number;
  }

  export interface CreateParams {
    avatar?: string;
    avatar_file_key?: string;
    country: string;
    dept_id?: null | number;
    emergency_contact?: string;
    emergency_phone?: string;
    entry_time: number;
    gender?: Gender;
    id_card?: string;
    lark_id?: string;
    leave_time?: null | number;
    name_cn?: null | string;
    name_en?: null | string;
    name_th?: null | string;
    performance_bonus: number;
    phone?: string;
    post_id?: null | number;
    remark?: string;
    salary: number;
    status: Status;
    subsidy: number;
  }

  export interface UpdateParams extends CreateParams {
    employee_no: string;
    id: number;
  }

  export interface DeleteParams {
    id: number;
  }

  export interface DeleteResult {
    id: number;
  }
}

export async function getAdminEmployeeList(
  params: AdminEmployeeApi.ListParams,
) {
  return requestClient.get<AdminEmployeeApi.ListResult>('/admin/employees', {
    params,
  });
}

export async function getAdminEmployeeDetail(
  params: AdminEmployeeApi.DetailParams,
) {
  return requestClient.get<AdminEmployeeApi.EmployeeItem>(
    '/admin/employees/detail',
    {
      params,
    },
  );
}

export async function createAdminEmployee(data: AdminEmployeeApi.CreateParams) {
  return requestClient.post<AdminEmployeeApi.EmployeeItem>(
    '/admin/employees',
    data,
  );
}

export async function updateAdminEmployee(data: AdminEmployeeApi.UpdateParams) {
  return requestClient.put<AdminEmployeeApi.EmployeeItem>(
    '/admin/employees',
    data,
  );
}

export async function deleteAdminEmployee(
  params: AdminEmployeeApi.DeleteParams,
) {
  return requestClient.delete<AdminEmployeeApi.DeleteResult>(
    '/admin/employees',
    {
      params,
    },
  );
}
