import { requestClient } from '../request';

export namespace AdminPublicTaskApplicationApi {
  export enum ReviewStatus {
    APPROVED = 1,
    REJECTED = 2,
  }

  export interface ApplicationItem {
    audit_time?: number;
    bd_code: string;
    budget: number;
    commission: number;
    created_at: number;
    id: number;
    main_sku_code?: string;
    main_sku_name?: string;
    product_url?: string;
    reason?: string;
    reviewer_name?: string;
    status: number;
    task_id: number;
    task_status: number;
    task_type: number;
    updated_at: number;
  }

  export interface ListParams {
    bd_code?: string;
    created_at_end?: number;
    created_at_start?: number;
    page: number;
    pageSize: number;
    status?: number;
    task_id?: number;
  }

  export interface ListResult {
    list: ApplicationItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ReviewItem {
    application_id: number;
    commission?: number;
    deadline?: number;
    reason?: string;
    status: number;
    video_num?: number;
  }

  export interface ReviewResultItem {
    application_id: number;
    new_task_id?: number;
    reason?: string;
    success: boolean;
  }

  export interface DispatchParams {
    bd_codes: string[];
    commission?: number;
    deadline?: number;
    public_task_id: number;
    video_num: number;
  }

  export interface DispatchResultItem {
    bd_code: string;
    relation_id: number;
    task_code: string;
    task_id: number;
  }

  export interface DispatchResult {
    items: DispatchResultItem[];
  }
}

/** Admin 查询公开任务申请列表 */
export async function getPublicTaskApplications(
  params: AdminPublicTaskApplicationApi.ListParams,
) {
  return requestClient.get<AdminPublicTaskApplicationApi.ListResult>(
    '/admin/public-task-applications',
    { params },
  );
}

/** Admin 审核公开任务申请（批量通过/驳回） */
export async function reviewPublicTaskApplications(data: {
  list: AdminPublicTaskApplicationApi.ReviewItem[];
}) {
  return requestClient.post<AdminPublicTaskApplicationApi.ReviewResultItem[]>(
    '/admin/public-task-applications/review',
    data,
  );
}

/** Admin 派送公开任务给BD（创建新定制任务） */
export async function dispatchPublicTaskToBD(
  data: AdminPublicTaskApplicationApi.DispatchParams,
) {
  return requestClient.post<AdminPublicTaskApplicationApi.DispatchResult>(
    '/admin/public-tasks/dispatch',
    data,
  );
}
