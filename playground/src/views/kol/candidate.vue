<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminKolCandidateApi } from '#/api/kol';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Card, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdminKolCandidateList } from '#/api/kol';
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

function getKolStatusText(status?: null | number) {
  switch (status) {
    case 2: {
      return $t('page.kol.kolCandidate.status.lost');
    }
    case 3: {
      return $t('page.kol.kolCandidate.status.blacklist');
    }
    default: {
      return '-';
    }
  }
}

function getKolStatusColor(status?: null | number) {
  switch (status) {
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
      fieldName: 'bd_code',
      label: $t('page.kol.kolCandidate.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.kol.kolCandidate.filters.kol-id'),
    },
    {
      component: 'Input',
      fieldName: 'prepared_bd_code',
      label: $t('page.kol.kolCandidate.filters.prepared-bd-code'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminKolCandidateApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.kol.kolCandidate.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 200,
      slots: { default: 'kol_link' },
      title: $t('page.kol.kolCandidate.columns.kol-link'),
    },
    {
      field: 'bd_code',
      minWidth: 110,
      title: $t('page.kol.kolCandidate.columns.bd-code'),
    },
    {
      field: 'is_duplicate',
      minWidth: 100,
      slots: { default: 'is_duplicate' },
      title: $t('page.kol.kolCandidate.columns.is-duplicate'),
    },
    {
      field: 'prepared_bd_name',
      minWidth: 140,
      title: $t('page.kol.kolCandidate.columns.prepared-bd'),
    },
    {
      field: 'has_belong_bd',
      minWidth: 120,
      slots: { default: 'has_belong_bd' },
      title: $t('page.kol.kolCandidate.columns.has-belong-bd'),
    },
    {
      field: 'kol_followers',
      minWidth: 120,
      slots: { default: 'kol_followers' },
      title: $t('page.kol.kolCandidate.columns.followers'),
    },
    {
      field: 'kol_status',
      minWidth: 110,
      slots: { default: 'kol_status' },
      title: $t('page.kol.kolCandidate.columns.status'),
    },
    {
      field: 'entry_time',
      minWidth: 170,
      slots: { default: 'entry_time' },
      title: $t('page.kol.kolCandidate.columns.entry-time'),
    },
    {
      field: 'created_at',
      minWidth: 170,
      slots: { default: 'created_at' },
      title: $t('page.kol.kolCandidate.columns.created-at'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminKolCandidateList({
          bd_code: formValues.bd_code?.trim() || undefined,
          kol_id: formValues.kol_id?.trim() || undefined,
          prepared_bd_code: formValues.prepared_bd_code?.trim() || undefined,
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
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div>
        <div class="text-lg font-semibold text-foreground">
          {{ $t('page.kol.kolCandidate.title') }}
        </div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ $t('page.kol.kolCandidate.description') }}
        </div>
      </div>
    </Card>

    <Grid :table-title="$t('page.kol.kolCandidate.list-title')">
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

      <template #is_duplicate="{ row }">
        <Tag v-if="row.is_duplicate" color="warning">
          {{ $t('page.kol.kolCandidate.is-duplicate.yes') }}
        </Tag>
        <Tag v-else color="default">
          {{ $t('page.kol.kolCandidate.is-duplicate.no') }}
        </Tag>
      </template>

      <template #has_belong_bd="{ row }">
        <Tag v-if="row.has_belong_bd" color="blue">
          {{ $t('page.kol.kolCandidate.has-belong-bd.yes') }}
        </Tag>
        <span v-else>-</span>
      </template>

      <template #kol_followers="{ row }">
        <span>{{ formatFollowers(row.kol_followers) }}</span>
      </template>

      <template #kol_status="{ row }">
        <Tag :color="getKolStatusColor(row.kol_status)">
          {{ getKolStatusText(row.kol_status) }}
        </Tag>
      </template>

      <template #entry_time="{ row }">
        <span>{{ formatTimestamp(row.entry_time) }}</span>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>
    </Grid>
  </Page>
</template>
