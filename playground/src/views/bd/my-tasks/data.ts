import type { VxeTableGridColumns } from '#/adapter/vxe-table';

export interface MyTaskItem {
  briefUrl: string;
  commission: number;
  completedVideos: number;
  deadline: number;
  hasBudget: number;
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
      title: '商品链接',
    },
    {
      field: 'briefUrl',
      minWidth: 220,
      slots: { default: 'briefUrl' },
      title: '产品PDF链接',
    },
    {
      field: 'commission',
      title: '佣金',
      width: 100,
    },
    {
      field: 'videoProgress',
      slots: { default: 'videoProgress' },
      title: '任务视频数',
      width: 100,
    },
    {
      field: 'hasBudget',
      slots: { default: 'hasBudget' },
      title: '是否有预算',
      width: 110,
    },
    {
      field: 'deadline',
      formatter: 'formatDate',
      title: '截止日期',
      width: 140,
    },
    {
      align: 'center',
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ];
}
