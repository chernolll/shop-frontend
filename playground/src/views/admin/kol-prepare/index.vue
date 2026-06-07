<!-- eslint-disable unicorn/prefer-add-event-listener -->
<script lang="ts" setup>
// oxlint-disable typescript/no-non-null-assertion
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AdminKolPrepareApi } from '#/api/admin/kol-prepare';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getAdminKolPrepareList,
  updateAdminKolPrepare,
} from '#/api/admin/kol-prepare';

// --- Filters ---
const kolIdFilter = ref('');
const hasBudgetFilter = ref<0 | 1 | undefined>(undefined);
const bdCodeFilter = ref('');

const hasBudgetOptions = [
  { label: '全部预算', value: undefined },
  { label: '有预算', value: 1 },
  { label: '无预算', value: 0 },
];

const hasBudgetEditOptions = [
  { label: '无', value: 0 as const },
  { label: '有', value: 1 as const },
];

// --- Edit Modal ---
const editVisible = ref(false);
const editSubmitting = ref(false);
const editingPrepareId = ref<null | number>(null);
const editForm = ref({
  kol_url: '',
  has_budget: 0 as 0 | 1,
  budget_amount: null as null | number,
  remark: '',
});

function openEditModal(row: AdminKolPrepareApi.ListItem) {
  editingPrepareId.value = row.prepare_id;
  editForm.value = {
    kol_url: row.kol_url ?? '',
    has_budget: row.has_budget,
    budget_amount: row.budget_amount,
    remark: row.remark ?? '',
  };
  editVisible.value = true;
}

function closeEditModal() {
  editVisible.value = false;
  editSubmitting.value = false;
}

async function handleEditSubmit() {
  if (editForm.value.has_budget === 1 && !editForm.value.budget_amount) {
    message.warning('有预算时必须填写预算金额');
    return;
  }

  editSubmitting.value = true;
  try {
    const updateData: {
      budget_amount?: number;
      has_budget: 0 | 1;
      kol_url?: string;
      prepare_id: number;
      remark?: null | string;
    } = {
      prepare_id: editingPrepareId.value!,
      kol_url: editForm.value.kol_url || undefined,
      has_budget: editForm.value.has_budget,
      remark: editForm.value.remark || undefined,
    };
    if (editForm.value.has_budget === 1) {
      updateData.budget_amount = editForm.value.budget_amount!;
    }
    await updateAdminKolPrepare(updateData);
    message.success('更新成功');
    closeEditModal();
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
  } finally {
    editSubmitting.value = false;
  }
}

// --- Search / Reset ---
function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  kolIdFilter.value = '';
  hasBudgetFilter.value = undefined;
  bdCodeFilter.value = '';
  gridApi.reload();
}

// --- Grid ---
const columns: VxeGridProps<AdminKolPrepareApi.ListItem>['columns'] = [
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
    field: 'bd_code',
    title: '所属BD',
    width: 100,
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
    field: 'participated_task_count',
    title: '参与任务数',
    width: 110,
  },
  {
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: '录入时间',
    width: 180,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 80,
  },
];

const [Grid, gridApi] = useVbenVxeGrid<AdminKolPrepareApi.ListItem>({
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
          const params: AdminKolPrepareApi.ListParams = {
            page: page.currentPage,
            page_size: page.pageSize,
          };
          if (kolIdFilter.value) params.kol_id = kolIdFilter.value;
          if (hasBudgetFilter.value !== undefined)
            params.has_budget = hasBudgetFilter.value;
          if (bdCodeFilter.value) params.bd_code = bdCodeFilter.value;

          const result = await getAdminKolPrepareList(params);
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'prepare_id' },
    toolbarConfig: { refresh: true },
  },
});
</script>

<template>
  <Page auto-content-height>
    <!-- Header -->
    <div
      class="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            达人筹备管理
          </h1>
          <p
            class="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            查看所有BD的达人筹备记录，支持编辑预算和备注信息。
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <Card :bordered="false" class="mb-4 rounded-2xl shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <Input
          v-model:value="kolIdFilter"
          allow-clear
          class="min-w-[160px]"
          placeholder="达人ID"
        />
        <Select
          v-model:value="hasBudgetFilter"
          :options="hasBudgetOptions"
          allow-clear
          class="min-w-[120px]"
          placeholder="预算筛选"
        />
        <Input
          v-model:value="bdCodeFilter"
          allow-clear
          class="min-w-[120px]"
          placeholder="BD代号"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </Card>

    <!-- Prepare List -->
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
          <span v-else class="text-gray-400 dark:text-gray-500">-</span>
        </template>
        <template #has_budget="{ row }">
          <Tag :color="row.has_budget === 1 ? 'green' : 'default'">
            {{ row.has_budget === 1 ? '有' : '无' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Button size="small" type="link" @click="openEditModal(row)">
            编辑
          </Button>
        </template>
      </Grid>
    </Card>

    <!-- Edit Modal -->
    <Modal
      v-model:open="editVisible"
      :confirm-loading="editSubmitting"
      title="编辑达人筹备"
      @cancel="closeEditModal"
      @ok="handleEditSubmit"
    >
      <div class="space-y-4 pt-2">
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            达人主页链接
          </div>
          <Input
            v-model:value="editForm.kol_url"
            placeholder="请输入达人主页链接（可选）"
          />
        </div>
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            有无预算
          </div>
          <Select
            v-model:value="editForm.has_budget"
            :options="hasBudgetEditOptions"
            class="w-20"
          />
        </div>
        <div v-if="editForm.has_budget === 1">
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            预算金额
          </div>
          <InputNumber
            v-model:value="editForm.budget_amount"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="请输入预算金额"
          />
        </div>
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            备注
          </div>
          <Input v-model:value="editForm.remark" placeholder="备注（可选）" />
        </div>
      </div>
    </Modal>
  </Page>
</template>
