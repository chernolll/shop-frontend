import { requestClient } from '../request';

export namespace BdVideoApi {
  export enum SopStatus {
    CONTACT = 0,
    SAMPLE = 1,
    RECOVER = 2,
    COMPLETED = 3,
    REMITTANCE = 4,
    TERMINATED = 5,
  }

  export interface ListParams {
    gmv_max?: number;
    gmv_min?: number;
    kol_id?: string;
    page: number;
    page_size: number;
    play_count_max?: number;
    play_count_min?: number;
    score_max?: number;
    score_min?: number;
    task_sop_id?: number;
    upload_time_end?: number;
    upload_time_start?: number;
  }

  export interface ListItem {
    ads_code: null | string;
    bd_code: string;
    commission: number;
    created_at: number;
    gmv: number;
    id: number;
    kol_id: string;
    play_count: number;
    product_listing_id: number;
    product_url: null | string;
    score: null | number;
    sop_status: SopStatus;
    task_sop_id: number;
    updated_at: number;
    upload_time: null | number;
    video_url: string;
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }
}

export async function getBdVideoList(params: BdVideoApi.ListParams) {
  return requestClient.get<BdVideoApi.ListResult>('/bd/videos', {
    params,
  });
}
