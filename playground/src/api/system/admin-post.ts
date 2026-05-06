import { requestClient } from '#/api/request';

export namespace AdminPostApi {
  export interface ListParams {
    id?: number;
    name?: string;
    page: number;
    page_size: number;
  }

  export interface PostItem {
    created_at: number;
    employee_count: number;
    id: number;
    name: string;
    updated_at: number;
  }

  export interface ListResult {
    list: PostItem[];
    page: number;
    page_size: number;
    total: number;
  }
}

export async function getAdminPostList(params: AdminPostApi.ListParams) {
  return requestClient.get<AdminPostApi.ListResult>('/admin/posts', {
    params,
  });
}
