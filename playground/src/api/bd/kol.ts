import { requestClient } from '../request';

export namespace KolApi {
  export interface ValidKolStateParams {
    /** task_bd_relation.id */
    kol_ids: string[];
    task_id: number;
  }

  export interface ValidKolStateResult {
    belong_bd_code?: string;
    can_prepare: boolean;
    entry_time: number;
    kol_id: string;
    kol_status: number;
    prepare_status: number;
    prepared_bd_code?: string;
    reason_code: number;
    reason_msg: string;
  }
}

/** 校验达人是否可加入当前任务筹备表 */
export async function queryKolPrepareState(data: KolApi.ValidKolStateParams) {
  return requestClient.post<KolApi.ValidKolStateResult[]>(
    '/bd/validate-kol-prepare',
    data,
  );
}
