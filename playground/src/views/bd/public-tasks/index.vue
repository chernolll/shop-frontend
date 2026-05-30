<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { BdPublicTaskApi } from '#/api';

import { Page } from '@vben/common-ui';

import { Alert, Empty, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBDPublicTaskList } from '#/api';

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'deadlineRange',
      label: '截止日期范围',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '全部', value: undefined },
          { label: '有预算', value: true },
          { label: '无预算', value: false },
        ],
      },
      fieldName: 'hasBudget',
      label: '是否有预算',
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

async function fetchPublicTaskList({
  formValues,
  page,
}: {
  formValues?: Record<string, any>;
  page: { currentPage: number; pageSize: number };
}) {
  let result: BdPublicTaskApi.BdPublicTaskListResult = { total: 0, list: [] };
  try {
    const { currentPage, pageSize } = page;
    const deadlineRange = Array.isArray(formValues?.deadlineRange)
      ? formValues?.deadlineRange
      : [];
    result = await getBDPublicTaskList({
      deadlineEnd: deadlineRange[1] ? Number(deadlineRange[1]) : undefined,
      deadlineStart: deadlineRange[0] ? Number(deadlineRange[0]) : undefined,
      hasBudget:
        formValues?.hasBudget === undefined ? undefined : formValues.hasBudget,
      page: currentPage,
      pageSize,
    });
  } catch {}

  return {
    items: result.list,
    total: result.total,
  };
}

const [Grid] = useVbenVxeGrid<BdPublicTaskApi.BdPublicTaskItem>({
  formOptions,
  gridOptions: {
    columns: [
      {
        field: 'task_id',
        title: '任务ID',
        width: 80,
      },
      {
        field: 'product_url',
        title: '商品链接',
        minWidth: 200,
        slots: { default: 'product_url' },
      },
      {
        field: 'main_sku_code',
        title: 'SKU编码',
        width: 100,
      },
      {
        field: 'main_sku_name',
        title: 'SKU名称',
        minWidth: 120,
      },
      {
        field: 'commission',
        title: '佣金',
        width: 90,
        slots: { default: 'commission' },
      },
      {
        field: 'video_num',
        title: '视频数',
        width: 80,
      },
      {
        field: 'bd_count',
        title: '已分配BD',
        width: 90,
      },
      {
        field: 'deadline',
        title: '截止日期',
        width: 120,
        slots: { default: 'deadline' },
      },
      {
        field: 'budget',
        title: '预算',
        width: 80,
        slots: { default: 'budget' },
      },
      {
        field: 'created_at',
        title: '创建时间',
        width: 170,
        slots: { default: 'created_at' },
      },
    ],
    maxHeight: 560,
    proxyConfig: {
      ajax: {
        query: async (
          {
            page,
          }: {
            formValues?: Record<string, any>;
            page: { currentPage: number; pageSize: number };
          },
          formValues: Record<string, any> = {},
        ) => {
          return await fetchPublicTaskList({ formValues, page });
        },
      },
    },
    rowConfig: { keyField: 'task_id' },
    scrollY: {
      enabled: true,
      gt: 0,
    },
    toolbarConfig: { refresh: true, zoom: true },
  },
});

function formatDate(timestamp: null | number | undefined): string {
  if (!timestamp) return '长期';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="公开任务">
      <template #toolbar-actions>
        <Alert
          type="info"
          show-icon
          message="以下为公开的未分配任务。如果您对某个任务感兴趣，请联系管理员进行任务分配。"
          class="!mb-0 flex-1"
        />
      </template>
      <template #empty>
        <div class="flex min-h-[220px] items-center justify-center px-6 py-10">
          <Empty description="暂无公开任务" class="max-w-[360px]">
            <template #image>
              <div class="mb-4 text-base font-medium text-foreground">
                暂无公开任务
              </div>
            </template>
          </Empty>
        </div>
      </template>
      <template #product_url="{ row }">
        <a
          :href="row.product_url"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
      </template>
      <template #commission="{ row }">
        {{ formatCurrency(row.commission) }}
      </template>
      <template #deadline="{ row }">
        <span v-if="row.deadline">{{ formatDate(row.deadline) }}</span>
        <Tag v-else color="green">长期有效</Tag>
      </template>
      <template #budget="{ row }">
        <Tag :color="row.budget === 1 ? 'green' : 'default'">
          {{ row.budget === 1 ? '有预算' : '无预算' }}
        </Tag>
      </template>
      <template #created_at="{ row }">
        {{ formatDate(row.created_at) }}
      </template>
    </Grid>
  </Page>
</template>
