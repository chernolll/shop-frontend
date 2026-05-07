import { requestClient } from '../request';

export namespace AdminTaskApi {
  export enum ProductListingStatus {
    OFF_SHELF = 0,
    ON_SALE = 1,
  }

  export interface ProductListingListParams {
    page: number;
    page_size: number;
    product_listing_id?: number;
    product_url?: string;
    shop_id?: number;
    status?: ProductListingStatus;
  }

  export interface ProductListingListItem {
    commission_private: number;
    commission_public: number;
    country: string;
    created_at: number;
    id: number;
    product_url: string;
    shop_id: number;
    shop_name: string;
    status: ProductListingStatus;
    updated_at: number;
  }

  export interface ProductListingListResult {
    list: ProductListingListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export enum BdStatus {
    ACTIVE = 1,
    LEFT = 2,
  }

  export interface BdListParams {
    bd_code?: string;
    page: number;
    page_size: number;
    status?: BdStatus;
  }

  export interface BdListItem {
    bd_code: string;
    employee_id: number;
    employee_name: null | string;
    employee_no: string;
    leave_time: null | number;
    status: BdStatus;
  }

  export interface BdListResult {
    list: BdListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export enum BudgetFlag {
    NO = 0,
    YES = 1,
  }

  export enum Status {
    NORMAL = 0,
    ABANDONED = 1,
  }

  export enum TaskType {
    CUSTOM = 0,
    PUBLIC = 1,
  }

  export interface CreateParams {
    bd_codes: string[];
    budget: BudgetFlag;
    commission: number;
    deadline?: number;
    product_listing_id: number | string;
    type: TaskType;
    video_num: number;
  }

  export interface CreateRelationItem {
    bd_code: string;
    follow_entry_time: number;
    relation_id: number;
    video_quantity: number;
  }

  export interface CreateResult {
    bd_relations: CreateRelationItem[];
    budget: BudgetFlag;
    commission: number;
    created_at: number;
    deadline: null | number;
    product_listing_id: number;
    status: Status;
    task_id: number;
    type: TaskType;
    updated_at: number;
    video_num: number;
  }

  export interface ListParams {
    budget?: BudgetFlag;
    deadline_end?: number;
    deadline_start?: number;
    page: number;
    page_size: number;
    product_listing_id?: number;
    status?: Status;
    task_id?: number;
    type?: TaskType;
  }

  export interface ListItem {
    bd_count: number;
    budget: BudgetFlag;
    commission: number;
    created_at: number;
    deadline: number;
    main_sku_code: string;
    main_sku_id: number;
    main_sku_name: string;
    main_sku_status: number;
    product_listing_id: number;
    product_status: number;
    product_url: string;
    status: Status;
    task_code: string;
    task_id: number;
    type: TaskType;
    updated_at: number;
    video_num: number;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface RelationsParams {
    task_id: number | string;
  }

  export interface RelationItem {
    bd_code: string;
    follow_entry_time: number;
    relation_id: number;
    video_quantity: number;
  }

  export interface RelationsResult {
    relations: RelationItem[];
    status: Status;
    task_id: number;
    video_num: number;
  }

  export interface AbandonParams {
    task_id: number | string;
  }

  export interface AbandonResult {
    status: Status;
    task_id: number;
    terminated_sop_count: number;
  }
}

/** Admin 创建总任务 */
export async function createAdminTask(data: AdminTaskApi.CreateParams) {
  return requestClient.post<AdminTaskApi.CreateResult>('/admin/tasks', data);
}

/** Admin 查询商品链接列表 */
export async function getAdminProductListingList(
  params: AdminTaskApi.ProductListingListParams,
) {
  return requestClient.get<AdminTaskApi.ProductListingListResult>(
    '/admin/product-listings',
    {
      params,
    },
  );
}

/** Admin 查询 BD 列表 */
export async function getAdminBdList(params: AdminTaskApi.BdListParams) {
  return requestClient.get<AdminTaskApi.BdListResult>('/admin/bds', {
    params,
  });
}

/** Admin 查询总任务列表 */
export async function getAdminTaskList(params: AdminTaskApi.ListParams) {
  return requestClient.get<AdminTaskApi.ListResult>('/admin/tasks', {
    params,
  });
}

/** Admin 查询总任务下的 BD 分配 */
export async function getAdminTaskRelations(
  params: AdminTaskApi.RelationsParams,
) {
  return requestClient.get<AdminTaskApi.RelationsResult>(
    '/admin/tasks/relations',
    {
      params,
    },
  );
}

/** Admin 废弃总任务 */
export async function abandonAdminTask(data: AdminTaskApi.AbandonParams) {
  return requestClient.put<AdminTaskApi.AbandonResult>(
    '/admin/tasks/abandon',
    data,
  );
}
