import { requestClient } from '../request';

export namespace KolPoolApi {
  // --- List ---

  export interface ListParams {
    has_budget?: 0 | 1;
    kol_id?: string;
    page: number;
    page_size: number;
    source_type?: 1 | 2; // 1-离职BD释放, 2-Admin上传
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
  }

  export interface ListResult {
    list: ListItem[];
    page: number;
    page_size: number;
    total: number;
  }

  // --- Claim ---

  export interface ClaimParams {
    pool_id: number;
  }

  export interface ClaimResult {
    pool_id: number;
  }
}

/** BD 查看达人池列表 */
export async function getBdKolPoolList(params: KolPoolApi.ListParams) {
  return requestClient.get<KolPoolApi.ListResult>('/bd/kol-pool', {
    params,
  });
}

/** BD 从达人池认领达人 */
export async function claimKolFromPool(data: KolPoolApi.ClaimParams) {
  return requestClient.post<KolPoolApi.ClaimResult>('/bd/kol-pool/claim', data);
}
