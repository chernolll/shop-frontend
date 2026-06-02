<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdKolListApi } from '#/api/bd/kol';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKolCandidate,
  deleteKolCandidate,
  getBdKolList,
} from '#/api/bd/kol';
import { $t } from '#/locales';

const deletingId = ref(0);
const createDrawerOpen = ref(false);
const createSubmitting = ref(false);
const createKolId = ref('');
const createKolLink = ref('');

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatFollowers(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function isDeleting(row: BdKolListApi.ListItem) {
  return deletingId.value === row.id;
}

function confirmDelete(row: BdKolListApi.ListItem) {
  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.bd.kols.delete.confirm-title'),
    content: $t('page.bd.kols.delete.confirm-content', [row.kol_id]),
    async onOk() {
      try {
        deletingId.value = row.id;
        await deleteKolCandidate({ id: row.id });
        message.success($t('page.bd.kols.messages.delete-success'));
        await gridApi.query();
      } finally {
        deletingId.value = 0;
      }
    },
  });
}

function resetCreateForm() {
  createKolId.value = '';
  createKolLink.value = '';
}

function openCreateDrawer() {
  resetCreateForm();
  createDrawerOpen.value = true;
}

async function submitCreate() {
  const kolId = createKolId.value.trim();
  if (!kolId) {
    message.warning($t('page.bd.kols.messages.kol-id-required'));
    return;
  }

  createSubmitting.value = true;
  try {
    const results = await createKolCandidate({
      items: [{ kol_id: kolId, kol_link: createKolLink.value.trim() }],
    });

    if (results && results.length > 0) {
      const r = results[0];
      if (r?.is_duplicate) {
        message.info($t('page.bd.kols.messages.create-duplicate', [r.kol_id]));
      } else {
        message.success(
          $t('page.bd.kols.messages.create-success', [r?.kol_id ?? kolId]),
        );
      }
    } else {
      message.success($t('page.bd.kols.messages.create-success', [kolId]));
    }

    createDrawerOpen.value = false;
    await gridApi.query();
  } finally {
    createSubmitting.value = false;
  }
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
      component: 'Input',
      fieldName: 'prepared_bd_code',
      label: $t('page.bd.kols.filters.prepared-bd-code'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

function getKolStatusText(status?: null | number) {
  switch (status) {
    case 2: {
      return $t('page.bd.kols.status.lost');
    }
    case 3: {
      return $t('page.bd.kols.status.blacklist');
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
      minWidth: 200,
      slots: { default: 'kol_link' },
      title: $t('page.bd.kols.columns.kol-link'),
    },
    {
      field: 'is_duplicate',
      minWidth: 100,
      slots: { default: 'is_duplicate' },
      title: $t('page.bd.kols.columns.is-duplicate'),
    },
    {
      field: 'prepared_bd_name',
      minWidth: 140,
      title: $t('page.bd.kols.columns.prepared-bd'),
    },
    {
      field: 'has_belong_bd',
      minWidth: 120,
      slots: { default: 'has_belong_bd' },
      title: $t('page.bd.kols.columns.has-belong-bd'),
    },
    {
      field: 'kol_followers',
      minWidth: 120,
      slots: { default: 'kol_followers' },
      title: $t('page.bd.kols.columns.followers'),
    },
    {
      field: 'kol_status',
      minWidth: 110,
      slots: { default: 'kol_status' },
      title: $t('page.bd.kols.columns.status'),
    },
    {
      field: 'entry_time',
      minWidth: 170,
      slots: { default: 'entry_time' },
      title: $t('page.bd.kols.columns.entry-time'),
    },
    {
      field: 'created_at',
      minWidth: 170,
      slots: { default: 'created_at' },
      title: $t('page.bd.kols.columns.created-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
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

    <Grid :table-title="$t('page.bd.kols.list-title')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreateDrawer">
          {{ $t('page.bd.kols.actions.create') }}
        </Button>
      </template>

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
          {{ $t('page.bd.kols.is-duplicate.yes') }}
        </Tag>
        <span v-else>-</span>
      </template>

      <template #has_belong_bd="{ row }">
        <Tag v-if="row.has_belong_bd" color="blue">
          {{ $t('page.bd.kols.has-belong-bd.yes') }}
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

      <template #operation="{ row }">
        <Space size="small">
          <Button
            danger
            type="link"
            size="small"
            :loading="isDeleting(row)"
            @click="confirmDelete(row)"
          >
            {{ $t('page.bd.kols.actions.delete') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <!-- 新增候选筹备记录 Drawer -->
    <Modal
      :open="createDrawerOpen"
      :title="$t('page.bd.kols.create.title')"
      :confirm-loading="createSubmitting"
      @ok="submitCreate"
      @cancel="createDrawerOpen = false"
    >
      <div class="space-y-4">
        <div>
          <div class="mb-1 text-sm font-medium">
            {{ $t('page.bd.kols.columns.kol-id') }}
            <span class="text-red-500">*</span>
          </div>
          <Input
            v-model:value="createKolId"
            :placeholder="$t('page.bd.kols.create.kol-id-placeholder')"
          />
        </div>
        <div>
          <div class="mb-1 text-sm font-medium">
            {{ $t('page.bd.kols.columns.kol-link') }}
          </div>
          <Input
            v-model:value="createKolLink"
            :placeholder="$t('page.bd.kols.create.kol-link-placeholder')"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>
