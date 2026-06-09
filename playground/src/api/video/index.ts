import { requestClient } from '../request';

export namespace AdminVideoApi {
  export interface ListParams {
    bd_code?: string;
    gmv_max?: number;
    gmv_min?: number;
    has_ads_code?: number;
    kol_id?: string;
    page: number;
    page_size: number;
    play_count_max?: number;
    play_count_min?: number;
    score_max?: number;
    score_min?: number;
    upload_time_end?: number;
    upload_time_start?: number;
  }

  export interface ListItem {
    ads_code?: string;
    bd_code: string;
    commission: number;
    created_at: number;
    gmv: number;
    id: number;
    kol_id: string;
    play_count: number;
    product_listing_id: number;
    score: null | number;
    sop_id: number;
    updated_at: number;
    upload_time?: number;
    video_url: string;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface UpdateItem {
    gmv?: number;
    play_count?: number;
    score: number;
    video_id: number;
  }

  export interface UpdateParams {
    list: UpdateItem[];
  }

  export interface UpdateResultItem {
    gmv?: number;
    play_count?: number;
    reason: null | string;
    score: null | number;
    success: boolean;
    video_id: number;
  }
}

export async function getAdminVideoList(params: AdminVideoApi.ListParams) {
  return requestClient.get<AdminVideoApi.ListResult>('/admin/videos', {
    params,
  });
}

export async function updateAdminVideos(data: AdminVideoApi.UpdateParams) {
  return requestClient.put<AdminVideoApi.UpdateResultItem[]>(
    '/admin/videos/score',
    data,
  );
}
