<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdKolLibraryApi } from '#/api/bd/kol';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Tag } from 'ant-design-vue';

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
    <div class="page-header">
      <div class="page-header-accent"></div>
      <div class="page-header-content">
        <div class="page-header-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-5"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
            <path d="M8 7h6" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
          </svg>
        </div>
        <div>
          <h1 class="page-header-title">
            {{ $t('page.bd.kolLibrary.title') }}
          </h1>
          <p class="page-header-desc">
            {{ $t('page.bd.kolLibrary.list-title') }}
          </p>
        </div>
      </div>
    </div>

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

<style scoped>
.page-header {
  position: relative;
  display: flex;
  align-items: stretch;
  margin-bottom: 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgb(0 0 0 / 4%);
}

.page-header-accent {
  width: 4px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #3b82f6, #6366f1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
}

.page-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: #3b82f6;
  background: #eff6ff;
  flex-shrink: 0;
}

.dark .page-header-icon {
  background: #1e3a5f;
  color: #60a5fa;
}

.page-header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  color: hsl(var(--foreground));
}

.page-header-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
}
</style>
