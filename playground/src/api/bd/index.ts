import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace BdTaskApi {
  export type PrepareStatus =
    | 'DONE'
    | 'IN_PROGRESS'
    | 'NOT_STARTED'
    | 'PARTIAL';

  export interface MyTaskItem {
    commission: number;
    country: string;
    deadline: string;
    followEntryTime: string;
    myVideoNum: number;
    platform: number;
    preparePassed: number;
    preparePending: number;
    prepareStatus: PrepareStatus;
    prepareTotal: number;
    productImage: string;
    productName: string;
    progress: number;
    shopName: string;
    taskId: number;
    taskType: number;
    totalVideoNum: number;
  }

  export interface MyTaskListParams extends Recordable<any> {
    deadlineEnd?: string;
    deadlineStart?: string;
    page: number;
    pageSize: number;
    prepareStatus?: PrepareStatus;
    productName?: string;
  }
}

async function getMyTaskList(params: BdTaskApi.MyTaskListParams) {
  return requestClient.get<{
    items: BdTaskApi.MyTaskItem[];
    total: number;
  }>('/bd/my-tasks', { params });
}

export { getMyTaskList };
