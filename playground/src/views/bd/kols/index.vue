<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  message,
  Modal,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  BdKolListApi,
  claimBdKol,
  getBdKolList,
  unbindBdKol,
} from '#/api/bd/kol';
import { $t } from '#/locales';

const activeTab = ref(String(BdKolListApi.ViewType.MY_KOLS));
const claimingKolId = ref('');
const unbindingKolId = ref('');

const tabItems = [
  {
    key: String(BdKolListApi.ViewType.MY_KOLS),
    label: $t('page.bd.kols.tabs.my-kols'),
  },
  {
    key: String(BdKolListApi.ViewType.UNASSIGNED_KOLS),
    label: $t('page.bd.kols.tabs.unassigned-kols'),
  },
];

const isUnassignedView = computed(
  () => Number(activeTab.value) === BdKolListApi.ViewType.UNASSIGNED_KOLS,
);

function getStatusText(status?: number) {
  switch (status) {
    case BdKolListApi.KolStatus.BLACKLIST: {
      return $t('page.bd.kols.status.blacklist');
    }
    case BdKolListApi.KolStatus.LOST: {
      return $t('page.bd.kols.status.lost');
    }
    default: {
      return $t('page.bd.kols.status.normal');
    }
  }
}

function getStatusColor(status?: number) {
  switch (status) {
    case BdKolListApi.KolStatus.BLACKLIST: {
      return 'error';
    }
    case BdKolListApi.KolStatus.LOST: {
      return 'warning';
    }
    default: {
      return 'success';
    }
  }
}

function getPaidText(value?: number) {
  return value === BdKolListApi.PaidStatus.YES
    ? $t('page.bd.kols.paid.yes')
    : $t('page.bd.kols.paid.no');
}

function getPaidColor(value?: number) {
  return value === BdKolListApi.PaidStatus.YES ? 'blue' : 'default';
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatFollowers(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function isClaiming(row: BdKolListApi.ListItem) {
  return claimingKolId.value === row.kol_id;
}

function isUnbinding(row: BdKolListApi.ListItem) {
  return unbindingKolId.value === row.kol_id;
}

async function onTabChange() {
  await gridApi.query();
}

function confirmClaim(row: BdKolListApi.ListItem) {
  if (!isUnassignedView.value || row.can_claim !== 1) {
    return;
  }

  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.bd.kols.claim.confirm-title'),
    content: $t('page.bd.kols.claim.confirm-content', [row.kol_id]),
    async onOk() {
      try {
        claimingKolId.value = row.kol_id;
        const result = await claimBdKol({
          kol_id: row.kol_id,
        });
        message.success(
          $t('page.bd.kols.messages.claim-success', [result.kol_id]),
        );
        await gridApi.query();
      } finally {
        claimingKolId.value = '';
      }
    },
  });
}

function confirmUnbind(row: BdKolListApi.ListItem) {
  if (isUnassignedView.value) {
    return;
  }

  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.bd.kols.unbind.confirm-title'),
    content: $t('page.bd.kols.unbind.confirm-content', [row.kol_id]),
    async onOk() {
      try {
        unbindingKolId.value = row.kol_id;
        const result = await unbindBdKol({
          kol_id: row.kol_id,
        });
        message.success(
          $t('page.bd.kols.messages.unbind-success', [result.kol_id]),
        );
        await gridApi.query();
      } finally {
        unbindingKolId.value = '';
      }
    },
  });
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.bd.kols.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.kols.filters.all-status'),
            value: undefined,
          },
          {
            label: $t('page.bd.kols.status.normal'),
            value: BdKolListApi.KolStatus.NORMAL,
          },
          {
            label: $t('page.bd.kols.status.lost'),
            value: BdKolListApi.KolStatus.LOST,
          },
          {
            label: $t('page.bd.kols.status.blacklist'),
            value: BdKolListApi.KolStatus.BLACKLIST,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.bd.kols.filters.status'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<BdKolListApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.bd.kols.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 220,
      slots: { default: 'kol_link' },
      title: $t('page.bd.kols.columns.kol-link'),
    },
    {
      field: 'followers',
      minWidth: 120,
      slots: { default: 'followers' },
      title: $t('page.bd.kols.columns.followers'),
    },
    {
      field: 'is_paid',
      minWidth: 110,
      slots: { default: 'is_paid' },
      title: $t('page.bd.kols.columns.is-paid'),
    },
    {
      field: 'cooperation_fee',
      minWidth: 120,
      title: $t('page.bd.kols.columns.cooperation-fee'),
    },
    {
      field: 'contact_info',
      minWidth: 180,
      slots: { default: 'contact_info' },
      title: $t('page.bd.kols.columns.contact-info'),
    },
    {
      field: 'belong_bd_code',
      minWidth: 140,
      slots: { default: 'belong_bd_code' },
      title: $t('page.bd.kols.columns.belong-bd-code'),
    },
    {
      field: 'participated_task_count',
      minWidth: 130,
      title: $t('page.bd.kols.columns.participated-task-count'),
    },
    {
      field: 'completed_task_count',
      minWidth: 130,
      title: $t('page.bd.kols.columns.completed-task-count'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.bd.kols.columns.status'),
    },
    {
      field: 'score',
      minWidth: 100,
      title: $t('page.bd.kols.columns.score'),
    },
    {
      field: 'notes',
      minWidth: 180,
      slots: { default: 'notes' },
      title: $t('page.bd.kols.columns.notes'),
    },
    {
      field: 'entry_time',
      minWidth: 180,
      slots: { default: 'entry_time' },
      title: $t('page.bd.kols.columns.entry-time'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.bd.kols.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'operation' },
      title: $t('page.bd.kols.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getBdKolList({
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          status:
            formValues.status === '' || formValues.status === undefined
              ? undefined
              : Number(formValues.status),
          view_type: Number(activeTab.value),
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

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div>
        <div class="text-lg font-semibold text-foreground">
          {{ $t('page.bd.kols.title') }}
        </div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ $t('page.bd.kols.description') }}
        </div>
      </div>
    </Card>

    <div class="mt-4">
      <Tabs v-model:active-key="activeTab" @change="onTabChange">
        <Tabs.TabPane
          v-for="item in tabItems"
          :key="item.key"
          :tab="item.label"
        />
      </Tabs>
    </div>

    <Grid :table-title="$t('page.bd.kols.list-title')">
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

      <template #followers="{ row }">
        <span>{{ formatFollowers(row.followers) }}</span>
      </template>

      <template #is_paid="{ row }">
        <Tag :color="getPaidColor(row.is_paid)">
          {{ getPaidText(row.is_paid) }}
        </Tag>
      </template>

      <template #contact_info="{ row }">
        <Tooltip v-if="row.contact_info" :title="row.contact_info">
          <span class="block max-w-[220px] truncate">
            {{ row.contact_info }}
          </span>
        </Tooltip>
        <span v-else>-</span>
      </template>

      <template #belong_bd_code="{ row }">
        <span>{{ row.belong_bd_code || '-' }}</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #notes="{ row }">
        <span>{{ row.notes || '-' }}</span>
      </template>

      <template #entry_time="{ row }">
        <span>{{ formatTimestamp(row.entry_time) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Tooltip
            v-if="
              isUnassignedView && row.can_claim !== 1 && row.claim_block_reason
            "
            :title="row.claim_block_reason"
          >
            <Button type="link" size="small" disabled>
              {{ $t('page.bd.kols.actions.claim') }}
            </Button>
          </Tooltip>
          <Button
            v-else-if="isUnassignedView"
            type="link"
            size="small"
            :loading="isClaiming(row)"
            @click="confirmClaim(row)"
          >
            {{ $t('page.bd.kols.actions.claim') }}
          </Button>
          <Button
            v-else
            danger
            type="link"
            size="small"
            :loading="isUnbinding(row)"
            @click="confirmUnbind(row)"
          >
            {{ $t('page.bd.kols.actions.unbind') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
