<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { KolPoolApi } from '#/api/bd/kol-pool';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, message, Modal, Select, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { claimKolFromPool, getBdKolPoolList } from '#/api/bd/kol-pool';

const claimingId = ref<null | number>(null);

const sourceTypeOptions = [
  { label: '全部来源', value: undefined },
  { label: '离职BD释放', value: 1 },
  { label: 'Admin上传', value: 2 },
];

const hasBudgetOptions = [
  { label: '全部预算', value: undefined },
  { label: '有预算', value: 1 },
  { label: '无预算', value: 0 },
];

const kolIdFilter = ref('');
const sourceTypeFilter = ref<1 | 2 | undefined>(undefined);
const hasBudgetFilter = ref<0 | 1 | undefined>(undefined);

const columns: VxeGridProps<KolPoolApi.ListItem>['columns'] = [
  { type: 'seq', width: 60 },
  {
    field: 'kol_id',
    title: '达人ID',
    width: 160,
  },
  {
    field: 'kol_url',
    minWidth: 200,
    slots: { default: 'kol_url' },
    title: '达人主页',
  },
  {
    field: 'has_budget',
    slots: { default: 'has_budget' },
    title: '有无预算',
    width: 100,
  },
  {
    field: 'budget_amount',
    title: '预算金额',
    width: 120,
  },
  {
    field: 'remark',
    minWidth: 160,
    title: '备注',
  },
  {
    field: 'source_type',
    slots: { default: 'source_type' },
    title: '来源',
    width: 120,
  },
  {
    field: 'source_bd_code',
    title: '来源BD',
    width: 120,
  },
  {
    field: 'created_at',
    formatter: 'formatDateTime',
    title: '创建时间',
    width: 180,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 100,
  },
];

const [Grid, gridApi] = useVbenVxeGrid<KolPoolApi.ListItem>({
  gridOptions: {
    columns,
    height: 'auto',
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const params: KolPoolApi.ListParams = {
            page: page.currentPage,
            page_size: page.pageSize,
          };
          if (kolIdFilter.value) params.kol_id = kolIdFilter.value;
          if (sourceTypeFilter.value !== undefined)
            params.source_type = sourceTypeFilter.value;
          if (hasBudgetFilter.value !== undefined)
            params.has_budget = hasBudgetFilter.value;

          const result = await getBdKolPoolList(params);
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  },
});

async function handleClaim(row: KolPoolApi.ListItem) {
  claimingId.value = row.id;
  try {
    await claimKolFromPool({ pool_id: row.id });
    message.success(`已认领达人 ${row.kol_id}，请前往「达人筹备」查看`);
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '认领失败');
  } finally {
    claimingId.value = null;
  }
}

function confirmClaim(row: KolPoolApi.ListItem) {
  Modal.confirm({
    content: `确认认领达人 ${row.kol_id} 吗？认领后将出现在你的筹备列表中。`,
    onOk: () => handleClaim(row),
    title: '确认认领',
  });
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  kolIdFilter.value = '';
  sourceTypeFilter.value = undefined;
  hasBudgetFilter.value = undefined;
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <!-- Header -->
    <div
      class="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-900">达人池</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            公共达人资源池。离职BD释放的达人以及Admin上传的达人会进入此池，你可以认领到达人自己的筹备列表中。
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <Card :bordered="false" class="mb-4 rounded-2xl shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <Select
          v-model:value="sourceTypeFilter"
          :options="sourceTypeOptions"
          allow-clear
          class="min-w-[140px]"
          placeholder="来源筛选"
        />
        <Select
          v-model:value="hasBudgetFilter"
          :options="hasBudgetOptions"
          allow-clear
          class="min-w-[120px]"
          placeholder="预算筛选"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </Card>

    <!-- Pool List -->
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <Grid>
        <template #kol_url="{ row }">
          <a
            v-if="row.kol_url"
            :href="row.kol_url"
            class="text-blue-500 hover:underline"
            rel="noreferrer"
            target="_blank"
          >
            {{ row.kol_url }}
          </a>
          <span v-else class="text-slate-400">-</span>
        </template>
        <template #has_budget="{ row }">
          <Tag :color="row.has_budget === 1 ? 'green' : 'default'">
            {{ row.has_budget === 1 ? '有' : '无' }}
          </Tag>
        </template>
        <template #source_type="{ row }">
          <Tag :color="row.source_type === 1 ? 'blue' : 'purple'">
            {{ row.source_type === 1 ? '离职BD释放' : 'Admin上传' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Button
            type="primary"
            size="small"
            :loading="claimingId === row.id"
            @click="confirmClaim(row)"
          >
            认领
          </Button>
        </template>
      </Grid>
    </Card>
  </Page>
</template>
