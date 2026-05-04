import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { $t } from '#/locales';

export interface MyTaskItem {
  briefUrl: string;
  commission: number;
  completedVideos: number;
  deadline: number;
  hasBudget: number;
  hasPrepareRecords: number;
  prepareApprovedCount: number;
  preparePendingCount: number;
  prepareRejectedCount: number;
  prepareTotalCount: number;
  product_listing_id?: number;
  productListingId?: number;
  productUrl: string;
  relationId: number;
  taskId: number;
  totalVideos: number;
}

export function useColumns(): VxeTableGridColumns<MyTaskItem> {
  return [
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
      field: 'hasBudget',
      slots: { default: 'hasBudget' },
      title: $t('page.bd.my-task.columns.has-budget'),
      width: 110,
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
      width: 160,
    },
  ];
}
