import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BdTaskApi } from '#/api';

import { h } from 'vue';

import { Image, Progress, Tag } from 'ant-design-vue';

const PREPARE_STATUS_MAP: Record<
  BdTaskApi.PrepareStatus,
  { color: string; label: string }
> = {
  NOT_STARTED: { color: 'default', label: '未开始' },
  IN_PROGRESS: { color: 'processing', label: '筹备中' },
  PARTIAL: { color: 'warning', label: '部分通过' },
  DONE: { color: 'success', label: '已完成' },
};

const PLATFORM_MAP: Record<number, string> = {
  1: 'TikTok',
  2: 'Shopee',
  3: 'Lazada',
};

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
        allowClear: true,
      },
      fieldName: 'productName',
      label: '商品名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '未开始', value: 'NOT_STARTED' },
          { label: '筹备中', value: 'IN_PROGRESS' },
          { label: '部分通过', value: 'PARTIAL' },
          { label: '已完成', value: 'DONE' },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'prepareStatus',
      label: '筹备状态',
    },
    {
      component: 'RangePicker',
      fieldName: 'deadline',
      label: '截止时间',
    },
  ];
}

export function useColumns(
  onActionClick: (code: string, row: BdTaskApi.MyTaskItem) => void,
): VxeTableGridColumns<BdTaskApi.MyTaskItem> {
  return [
    {
      field: 'productName',
      minWidth: 220,
      slots: {
        default: ({ row }) => {
          return h('div', { class: 'flex items-center gap-2' }, [
            h(Image, {
              src: row.productImage,
              width: 40,
              height: 40,
              style: { borderRadius: '4px', objectFit: 'cover', flexShrink: 0 },
              fallback:
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNiZGJkYmQiIGZvbnQtc2l6ZT0iMTIiPk5vPC90ZXh0Pjwvc3ZnPg==',
            }),
            h('span', { class: 'truncate' }, row.productName),
          ]);
        },
      },
      title: '商品信息',
    },
    {
      field: 'shopName',
      minWidth: 160,
      slots: {
        default: ({ row }) => {
          return h('div', {}, [
            h('div', {}, row.shopName),
            h('div', { class: 'text-xs text-gray-400' }, [
              `${PLATFORM_MAP[row.platform] || 'Unknown'} · ${row.country}`,
            ]),
          ]);
        },
      },
      title: '店铺',
    },
    {
      field: 'commission',
      slots: {
        default: ({ row }) => {
          return h('span', {}, `${row.commission}`);
        },
      },
      title: '佣金',
      width: 90,
    },
    {
      field: 'myVideoNum',
      slots: {
        default: ({ row }) => {
          return h('span', {}, `${row.myVideoNum} / ${row.totalVideoNum}`);
        },
      },
      title: '我的任务量',
      width: 110,
    },
    {
      field: 'progress',
      minWidth: 180,
      slots: {
        default: ({ row }) => {
          return h('div', { class: 'flex items-center gap-2 w-full' }, [
            h('span', { class: 'text-xs whitespace-nowrap' }, [
              `${row.preparePassed} / ${row.myVideoNum}`,
            ]),
            h(Progress, {
              percent: row.progress,
              size: 'small',
              strokeColor:
                row.progress >= 100
                  ? '#52c41a'
                  : (row.progress > 0
                    ? '#1677ff'
                    : '#d9d9d9'),
              format: () => '',
            }),
          ]);
        },
      },
      title: '筹备进度',
    },
    {
      field: 'prepareStatus',
      slots: {
        default: ({ row }) => {
          const statusConfig = PREPARE_STATUS_MAP[row.prepareStatus];
          return h(
            Tag,
            { color: statusConfig?.color || 'default' },
            { default: () => statusConfig?.label || row.prepareStatus },
          );
        },
      },
      title: '状态',
      width: 100,
    },
    {
      field: 'deadline',
      formatter: 'formatDate',
      title: '截止时间',
      width: 120,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const isDone = row.prepareStatus === 'DONE';
          return h('div', { class: 'flex items-center justify-center gap-1' }, [
            h(
              'a',
              {
                class: isDone
                  ? 'cursor-not-allowed text-gray-300'
                  : 'cursor-pointer',
                onClick: () => {
                  if (!isDone) onActionClick('upload', row);
                },
              },
              '上传筹备表',
            ),
            h(
              'a',
              {
                class: 'cursor-pointer',
                onClick: () => onActionClick('view', row),
              },
              '查看达人',
            ),
          ]);
        },
      },
      title: '操作',
      width: 160,
    },
  ];
}
