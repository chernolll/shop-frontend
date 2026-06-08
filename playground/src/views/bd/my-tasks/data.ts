import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { $t } from '#/locales';

export interface MyTaskItem {
  briefUrl: string;
  commission: number;
  completedVideos: number;
  deadline: number;
  hasPrepareRecords: number;
  main_sku_code?: string;
  main_sku_name?: string;
  main_sku_status?: number;
  prepareApprovedCount: number;
  preparePendingCount: number;
  prepareRejectedCount: number;
  prepareTotalCount: number;
  product_listing_id?: number;
  productListingId?: number;
  productUrl: string;
  relationId: number;
  task_code?: string;
  task_status?: number;
  taskCode?: string;
  taskId: number;
  taskStatus?: number;
  totalVideos: number;
}

export function useColumns(): VxeTableGridColumns<MyTaskItem> {
  return [
    {
      field: 'task_code',
      minWidth: 180,
      slots: { default: 'task_code' },
      title: $t('page.bd.my-task.columns.task-code'),
    },
    {
      field: 'taskName',
      minWidth: 160,
      slots: { default: 'taskName' },
      title: $t('page.bd.my-task.columns.task-name'),
    },
    {
      field: 'taskTags',
      minWidth: 180,
      slots: { default: 'taskTags' },
      title: $t('page.bd.my-task.columns.task-tags'),
    },
    {
      field: 'productUrl',
      minWidth: 220,
      slots: { default: 'productUrl' },
      title: $t('page.bd.my-task.columns.product-url'),
    },
    {
      field: 'briefUrl',
      minWidth: 220,
      slots: { default: 'briefUrl' },
      title: $t('page.bd.my-task.columns.brief-url'),
    },
    {
      field: 'commission',
      title: $t('page.bd.my-task.columns.commission'),
      width: 100,
    },
    {
      field: 'videoProgress',
      showOverflow: false,
      slots: { default: 'videoProgress' },
      title: $t('page.bd.my-task.columns.video-progress'),
      width: 170,
    },
    {
      field: 'prepareSummary',
      minWidth: 260,
      showOverflow: false,
      slots: { default: 'prepareSummary' },
      title: $t('page.bd.my-task.columns.prepare-summary'),
    },
    {
      field: 'taskStatus',
      slots: { default: 'taskStatus' },
      title: $t('page.bd.my-task.columns.task-status'),
      width: 120,
    },
    {
      field: 'deadline',
      formatter: 'formatDate',
      title: $t('page.bd.my-task.columns.deadline'),
      width: 140,
    },
    {
      align: 'center',
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: $t('page.bd.my-task.columns.action'),
      width: 220,
    },
  ];
}
