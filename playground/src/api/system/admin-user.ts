import { requestClient } from '#/api/request';

export namespace AdminUserApi {
  // --- List ---

  export interface ListParams {
    employee_id?: string;
    page: number;
    page_size: number;
    real_name?: string;
    role_code?: string;
    status?: 0 | 1;
    username?: string;
  }

  export interface ListItem {
    created_at: number;
    employee_id: number;
    id: number;
    last_login_at: null | number;
    real_name: string;
    remark: null | string;
    role_code: string;
    role_name: string;
    status: 0 | 1;
    username: string;
  }

  export interface ListResult {
    list: ListItem[];
    total: number;
  }

  // --- Create ---

  export interface CreateParams {
    employee_id?: null | number;
    password: string;
    real_name?: string;
    remark?: string;
    role_code: string;
    username: string;
  }

  // --- Update ---

  export interface UpdateParams {
    employee_id?: null | number;
    id: number;
    real_name?: string;
    remark?: string;
    role_code?: string;
    status?: 0 | 1;
  }

  export interface UserResult {
    id: number;
    username: string;
  }

  // --- Reset Password ---

  export interface ResetPasswordParams {
    id: number;
    password: string;
  }

  // --- Toggle Status ---

  export interface StatusParams {
    id: number;
    status: 0 | 1;
  }

  // --- Delete ---

  export interface DeleteParams {
    id: number;
  }

  // --- Role Select ---

  export interface RoleOption {
    role_code: string;
    role_name: string;
  }
}

/** Admin 查询账号列表 */
export async function getAdminUserList(params: AdminUserApi.ListParams) {
  return requestClient.get<AdminUserApi.ListResult>('/admin/users', { params });
}

/** Admin 新增账号 */
export async function createAdminUser(data: AdminUserApi.CreateParams) {
  return requestClient.post<AdminUserApi.UserResult>('/admin/users', data);
}

/** Admin 编辑账号 */
export async function updateAdminUser(data: AdminUserApi.UpdateParams) {
  return requestClient.put<AdminUserApi.UserResult>(
    `/admin/users/${data.id}`,
    data,
  );
}

/** Admin 重置账号密码 */
export async function resetAdminUserPassword(
  data: AdminUserApi.ResetPasswordParams,
) {
  return requestClient.post(`/admin/users/${data.id}/reset-password`, {
    password: data.password,
  });
}

/** Admin 启用/禁用账号 */
export async function toggleAdminUserStatus(data: AdminUserApi.StatusParams) {
  return requestClient.post(`/admin/users/${data.id}/status`, {
    status: data.status,
  });
}

/** Admin 删除账号（软删除） */
export async function deleteAdminUser(params: AdminUserApi.DeleteParams) {
  return requestClient.delete(`/admin/users/${params.id}`);
}

/** Admin 获取角色下拉选项 */
export async function getAdminRoleOptions() {
  return requestClient.get<AdminUserApi.RoleOption[]>('/admin/roles');
}
