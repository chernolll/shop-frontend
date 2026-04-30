<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BDSopApi } from '#/api/bd/sop';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBDSopList } from '#/api/bd/sop';
import { $t } from '#/locales';

enum BDSOPStatus {
  CONTACT = 0,
  SAMPLE = 1,
  RECOVER = 2,
  COMPLETED = 3,
  REMITTANCE = 4,
  TERMINATED = 5,
}

const router = useRouter();

const sopStatusTextMap: Record<number, string> = {
  [BDSOPStatus.COMPLETED]: $t('page.bd.sop.status-text.completed'),
  [BDSOPStatus.CONTACT]: $t('page.bd.sop.status-text.contact'),
  [BDSOPStatus.RECOVER]: $t('page.bd.sop.status-text.recover'),
  [BDSOPStatus.REMITTANCE]: $t('page.bd.sop.status-text.remittance'),
  [BDSOPStatus.SAMPLE]: $t('page.bd.sop.status-text.sample'),
  [BDSOPStatus.TERMINATED]: $t('page.bd.sop.status-text.terminated'),
};

const sopStatusColorMap: Record<number, string> = {
  [BDSOPStatus.COMPLETED]: 'success',
  [BDSOPStatus.CONTACT]: 'default',
  [BDSOPStatus.RECOVER]: 'warning',
  [BDSOPStatus.REMITTANCE]: 'processing',
  [BDSOPStatus.SAMPLE]: 'processing',
  [BDSOPStatus.TERMINATED]: 'error',
};

function getSopStatusText(status: number) {
  return sopStatusTextMap[status] ?? String(status);
}

function getSopStatusColor(status: number) {
  return sopStatusColorMap[status] ?? 'default';
}

function getBudgetText(value: number) {
  return value === 1
    ? $t('page.bd.sop.budget-text.yes')
    : $t('page.bd.sop.budget-text.no');
}

function getBudgetColor(value: number) {
  return value === 1 ? 'green' : 'default';
}

function getTaskTypeText(value: number) {
  return value === 1
    ? $t('page.bd.sop.task-type-text.public')
    : $t('page.bd.sop.task-type-text.custom');
}

function openDetail(row: BDSopApi.Item) {
  router.push(`/bd/sop/${row.id}`);
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'start_date',
      label: $t('page.bd.sop.filters.created-from'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'end_date',
      label: $t('page.bd.sop.filters.deadline-to'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.sop.placeholders.all-status'),
            value: undefined,
          },
          {
            label: getSopStatusText(BDSOPStatus.CONTACT),
            value: BDSOPStatus.CONTACT,
          },
          {
            label: getSopStatusText(BDSOPStatus.SAMPLE),
            value: BDSOPStatus.SAMPLE,
          },
          {
            label: getSopStatusText(BDSOPStatus.RECOVER),
            value: BDSOPStatus.RECOVER,
          },
          {
            label: getSopStatusText(BDSOPStatus.REMITTANCE),
            value: BDSOPStatus.REMITTANCE,
          },
          {
            label: getSopStatusText(BDSOPStatus.TERMINATED),
            value: BDSOPStatus.TERMINATED,
          },
          {
            label: getSopStatusText(BDSOPStatus.COMPLETED),
            value: BDSOPStatus.COMPLETED,
          },
        ],
      },
      fieldName: 'sop_status',
      label: $t('page.bd.sop.filters.status'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<BDSopApi.Item> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 160,
      title: $t('page.bd.sop.columns.kol-id'),
    },
    {
      field: 'status',
      minWidth: 140,
      slots: { default: 'status' },
      title: $t('page.bd.sop.columns.status'),
    },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.bd.sop.columns.product-url'),
    },
    {
      field: 'brief_url',
      minWidth: 220,
      slots: { default: 'brief_url' },
      title: $t('page.bd.sop.columns.brief-url'),
    },
    {
      field: 'task_commission',
      title: $t('page.bd.sop.columns.commission'),
      width: 130,
    },
    {
      field: 'task_budget',
      slots: { default: 'task_budget' },
      title: $t('page.bd.sop.columns.budget'),
      width: 120,
    },
    {
      field: 'task_type',
      slots: { default: 'task_type' },
      title: $t('page.bd.sop.columns.task-type'),
      width: 120,
    },
    {
      field: 'task_created_at',
      formatter: 'formatDateTime',
      title: $t('page.bd.sop.columns.created-at'),
      width: 180,
    },
    {
      field: 'task_deadline',
      formatter: 'formatDateTime',
      title: $t('page.bd.sop.columns.deadline'),
      width: 180,
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getBDSopList({
          end_date: formValues.end_date
            ? Number(formValues.end_date)
            : undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          sop_status:
            formValues.sop_status === undefined
              ? undefined
              : Number(formValues.sop_status),
          start_date: formValues.start_date
            ? Number(formValues.start_date)
            : undefined,
        });
        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.bd.sop.list-title')">
      <template #status="{ row }">
        <Tag
          :color="getSopStatusColor(row.status)"
          class="cursor-pointer"
          @click="openDetail(row)"
        >
          {{ getSopStatusText(row.status) }}
        </Tag>
      </template>
      <template #product_url="{ row }">
        <a
          v-if="row.product_url"
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
        <span v-else>-</span>
      </template>
      <template #brief_url="{ row }">
        <a
          v-if="row.brief_url"
          :href="row.brief_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.brief_url }}
        </a>
        <span v-else>-</span>
      </template>
      <template #task_budget="{ row }">
        <Tag :color="getBudgetColor(row.task_budget)">
          {{ getBudgetText(row.task_budget) }}
        </Tag>
      </template>
      <template #task_type="{ row }">
        <Tag>
          {{ getTaskTypeText(row.task_type) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
