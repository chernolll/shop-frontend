<script lang="ts" setup>
import type { BdPrepareKolApi } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  Empty,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { getValidPrepareKols, submitKolsToTask } from '#/api';
import { $t } from '#/locales';

const props = defineProps<{
  open: boolean;
  productListingId: number;
  taskId: number;
}>();

const emit = defineEmits<{
  submitted: [];
  'update:open': [value: boolean];
}>();

// --- State ---
const loading = ref(false);
const submitting = ref(false);
const kolList = ref<BdPrepareKolApi.ValidKolItem[]>([]);
const selectedRowKeys = ref<string[]>([]);
const searchKolId = ref('');
const budgetFilter = ref<'0' | '1' | ''>('');

const budgetFilterOptions = [
  { label: $t('page.bd.task-center.kol-dialog.filter-all'), value: '' },
  { label: $t('page.bd.task-center.kol-dialog.filter-has-budget'), value: '1' },
  { label: $t('page.bd.task-center.kol-dialog.filter-no-budget'), value: '0' },
];

// --- Fetch ---
async function fetchValidKols() {
  loading.value = true;
  try {
    const result = await getValidPrepareKols();
    kolList.value = result ?? [];
  } catch {
    kolList.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedRowKeys.value = [];
      searchKolId.value = '';
      budgetFilter.value = '';
      fetchValidKols();
    }
  },
);

// --- Client-side filtering ---
const filteredList = computed(() => {
  let list = kolList.value;
  if (searchKolId.value.trim()) {
    const kw = searchKolId.value.trim().toLowerCase();
    list = list.filter((item) => item.kol_id.toLowerCase().includes(kw));
  }
  if (budgetFilter.value !== '') {
    list = list.filter(
      (item) => item.has_budget === Number(budgetFilter.value),
    );
  }
  return list;
});

// --- Selection ---
function onSelectChange(keys: (number | string)[]) {
  selectedRowKeys.value = keys as string[];
}

// --- Submit ---
async function handleSubmit() {
  if (selectedRowKeys.value.length === 0) {
    message.warning($t('page.bd.task-center.kol-dialog.selected-count', [0]));
    return;
  }
  submitting.value = true;
  try {
    const selectedKols = kolList.value.filter((k) =>
      selectedRowKeys.value.includes(k.kol_id),
    );
    const items = selectedKols.map((kol) => ({
      budget: kol.budget_amount,
      has_budget: kol.has_budget,
      kol_id: kol.kol_id,
      kol_note: kol.remark ?? undefined,
      kol_url: kol.kol_url ?? undefined,
      product_listing_id: props.productListingId,
      task_id: props.taskId,
    }));
    const result = await submitKolsToTask(items);
    if (result.failed_kol_ids?.length) {
      message.warning(
        $t('page.bd.task-center.kol-dialog.submit-partial', [
          result.failed_kol_ids.join(', '),
        ]),
      );
    } else {
      message.success($t('page.bd.task-center.kol-dialog.submit-success'));
    }
    emit('submitted');
    emit('update:open', false);
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      $t('page.bd.task-center.kol-dialog.submit-failed');
    message.error(msg);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  emit('update:open', false);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getBudgetText(value: 0 | 1): string {
  return value === 1
    ? $t('page.bd.task-center.kol-dialog.budget-text.yes')
    : $t('page.bd.task-center.kol-dialog.budget-text.no');
}

function getBudgetColor(value: 0 | 1): string {
  return value === 1 ? 'blue' : 'default';
}

// --- Table columns ---
const columns = [
  {
    dataIndex: 'kol_id',
    key: 'kol_id',
    title: $t('page.bd.task-center.kol-dialog.columns.kol-id'),
    width: 120,
  },
  {
    dataIndex: 'kol_url',
    key: 'kol_url',
    title: $t('page.bd.task-center.kol-dialog.columns.kol-url'),
    width: 240,
  },
  {
    dataIndex: 'has_budget',
    key: 'has_budget',
    title: $t('page.bd.task-center.kol-dialog.columns.has-budget'),
    width: 90,
  },
  {
    dataIndex: 'budget_amount',
    key: 'budget_amount',
    title: $t('page.bd.task-center.kol-dialog.columns.budget-amount'),
    width: 120,
  },
  {
    dataIndex: 'remark',
    key: 'remark',
    title: $t('page.bd.task-center.kol-dialog.columns.remark'),
    width: 160,
  },
  {
    dataIndex: 'entry_time',
    key: 'entry_time',
    title: $t('page.bd.task-center.kol-dialog.columns.entry-time'),
    width: 130,
  },
];
</script>

<template>
  <Modal
    :open="open"
    :title="$t('page.bd.task-center.kol-dialog.title')"
    :width="960"
    :confirm-loading="submitting"
    :ok-text="$t('page.bd.task-center.kol-dialog.submit')"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <!-- Search & Filter Bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <Input
        v-model:value="searchKolId"
        :placeholder="$t('page.bd.task-center.kol-dialog.search-placeholder')"
        allow-clear
        class="!w-[220px]"
      />
      <Select
        v-model:value="budgetFilter"
        :options="budgetFilterOptions"
        class="!w-[140px]"
      />
      <span class="text-sm text-gray-500">
        {{
          $t('page.bd.task-center.kol-dialog.selected-count', [
            String(selectedRowKeys.length),
          ])
        }}
      </span>
    </div>

    <!-- Table -->
    <Table
      :columns="columns"
      :data-source="filteredList"
      :loading="loading"
      :row-key="(r: BdPrepareKolApi.ValidKolItem) => r.kol_id"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
      }"
      size="middle"
      :scroll="{ y: 400 }"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'kol_url'">
          <a
            v-if="record.kol_url"
            :href="record.kol_url"
            target="_blank"
            class="text-blue-500 hover:underline"
          >
            {{ record.kol_url }}
          </a>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'has_budget'">
          <Tag :color="getBudgetColor(record.has_budget)">
            {{ getBudgetText(record.has_budget) }}
          </Tag>
        </template>
        <template v-if="column.key === 'budget_amount'">
          <span v-if="record.has_budget === 1 && record.budget_amount">
            ฿{{ record.budget_amount.toLocaleString() }}
          </span>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'remark'">
          <span>{{ record.remark || '-' }}</span>
        </template>
        <template v-if="column.key === 'entry_time'">
          {{ formatDate(record.entry_time) }}
        </template>
      </template>

      <template #empty>
        <Empty :description="$t('page.bd.task-center.kol-dialog.filter-all')" />
      </template>
    </Table>
  </Modal>
</template>
