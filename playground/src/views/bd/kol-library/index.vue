<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdKolLibraryApi } from '#/api/bd/kol';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Card, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBdKolLibraryList } from '#/api/bd/kol';
import { $t } from '#/locales';

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatFollowers(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function getStatusText(status: number) {
  switch (status) {
    case 1: {
      return $t('page.bd.kolLibrary.status.normal');
    }
    case 2: {
      return $t('page.bd.kolLibrary.status.lost');
    }
    case 3: {
      return $t('page.bd.kolLibrary.status.blacklist');
    }
    default: {
      return '-';
    }
  }
}

function getStatusColor(status: number) {
  switch (status) {
    case 1: {
      return 'success';
    }
    case 2: {
      return 'warning';
    }
    case 3: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.bd.kolLibrary.filters.kol-id'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<BdKolLibraryApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.bd.kolLibrary.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 200,
      slots: { default: 'kol_link' },
      title: $t('page.bd.kolLibrary.columns.kol-link'),
    },
    {
      field: 'followers',
      minWidth: 120,
      title: $t('page.bd.kolLibrary.columns.followers'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        formatFollowers(cellValue),
    },
    {
      field: 'cooperation_fee',
      minWidth: 120,
      title: $t('page.bd.kolLibrary.columns.cooperation-fee'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        cellValue ? String(cellValue) : '-',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: $t('page.bd.kolLibrary.columns.status'),
    },
    {
      field: 'score',
      minWidth: 90,
      title: $t('page.bd.kolLibrary.columns.score'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        cellValue ? String(cellValue) : '-',
    },
    {
      field: 'participated_task_count',
      minWidth: 130,
      title: $t('page.bd.kolLibrary.columns.participated-task-count'),
    },
    {
      field: 'completed_task_count',
      minWidth: 120,
      title: $t('page.bd.kolLibrary.columns.completed-task-count'),
    },
    {
      field: 'entry_time',
      minWidth: 170,
      title: $t('page.bd.kolLibrary.columns.entry-time'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        formatTimestamp(cellValue),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getBdKolLibraryList({
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
        });

        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'kol_id',
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
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div>
        <div class="text-lg font-semibold text-foreground">
          {{ $t('page.bd.kolLibrary.title') }}
        </div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ $t('page.bd.kolLibrary.list-title') }}
        </div>
      </div>
    </Card>

    <Grid :table-title="$t('page.bd.kolLibrary.list-title')">
      <template #kol_link="{ row }">
        <a
          v-if="row.kol_link"
          :href="row.kol_link"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.kol_link }}
        </a>
        <span v-else>-</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
