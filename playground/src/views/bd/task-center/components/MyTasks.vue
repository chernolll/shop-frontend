<script lang="ts" setup>
import { ref } from 'vue';

import {
  Button,
  DatePicker,
  Empty,
  Input,
  message,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { BdTaskApi, getBdTaskList } from '#/api';
import { getBriefAccessUrl } from '#/api/core/file';
import { $t } from '#/locales';

import KolSelectDialog from './KolSelectDialog.vue';

// --- State ---
const loading = ref(false);
const taskList = ref<BdTaskApi.BDTaskRow[]>([]);
const totalItems = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// --- Filters ---
const searchTaskCode = ref('');
const statusFilter = ref<number | undefined>(undefined);
const deadlineRange = ref<[any, any] | null>(null);

// --- Brief ---
const briefViewLoading = ref<Record<number, boolean>>({});

async function viewBrief(productListingId: number, rowKey: number) {
  briefViewLoading.value = { ...briefViewLoading.value, [rowKey]: true };
  try {
    const result = await getBriefAccessUrl({
      product_listing_id: productListingId,
    });
    window.open(result.access_url, '_blank', 'noreferrer');
  } catch {
    message.warning($t('page.product.listing.messages.brief-not-found'));
  } finally {
    briefViewLoading.value = { ...briefViewLoading.value, [rowKey]: false };
  }
}

// --- KOL Dialog ---
const kolDialogOpen = ref(false);
const selectedTaskId = ref(0);
const selectedProductListingId = ref(0);

// --- Fetch ---
async function fetchMyTaskList(page?: number, pageSizeVal?: number) {
  loading.value = true;
  try {
    const result = await getBdTaskList({
      deadlineEnd: deadlineRange.value?.[1]
        ? Number(deadlineRange.value[1].valueOf())
        : undefined,
      deadlineStart: deadlineRange.value?.[0]
        ? Number(deadlineRange.value[0].valueOf())
        : undefined,
      page: page ?? currentPage.value,
      pageSize: pageSizeVal ?? pageSize.value,
      task_code: searchTaskCode.value?.trim() || undefined,
      taskStatus:
        statusFilter.value === undefined
          ? undefined
          : Number(statusFilter.value),
    });
    taskList.value = result.list ?? [];
    totalItems.value = result.total ?? 0;
  } catch {
    taskList.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
}

fetchMyTaskList();

function onPageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
  fetchMyTaskList(page, size);
}

function onFilterSubmit() {
  currentPage.value = 1;
  fetchMyTaskList(1);
}

// --- KOL Dialog ---
function openKolDialog(row: BdTaskApi.BDTaskRow) {
  selectedTaskId.value = row.taskId;
  selectedProductListingId.value = Number(
    row.productListingId ?? row.product_listing_id ?? 0,
  );
  kolDialogOpen.value = true;
}

function onKolSubmitted() {
  fetchMyTaskList();
}

// --- Helpers ---
function hasMainSkuInfo(row: BdTaskApi.BDTaskRow) {
  return Boolean(
    row.main_sku_code || row.main_sku_name || row.main_sku_status !== undefined,
  );
}

function getMainSkuStatusText(status?: number) {
  return status === 1
    ? $t('page.bd.task-center.product-status.on-sale')
    : $t('page.bd.task-center.product-status.off-shelf');
}

function getVideoProgressPercent(row: BdTaskApi.BDTaskRow) {
  const total = Number(row.totalVideos ?? 0);
  const completed = Number(row.completedVideos ?? 0);
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

function isVideoCompleted(row: BdTaskApi.BDTaskRow) {
  const total = Number(row.totalVideos ?? 0);
  return total > 0 && Number(row.completedVideos ?? 0) >= total;
}

function isTaskAbandoned(row: BdTaskApi.BDTaskRow) {
  return (row.taskStatus ?? row.task_status) === BdTaskApi.TaskStatus.ABANDONED;
}

function getTaskStatusText(row: BdTaskApi.BDTaskRow) {
  return isTaskAbandoned(row)
    ? $t('page.bd.task-center.status-text.abandoned')
    : $t('page.bd.task-center.status-text.normal');
}

function getTaskStatusColor(row: BdTaskApi.BDTaskRow) {
  return isTaskAbandoned(row) ? 'error' : 'success';
}

function formatDate(ts: null | number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return `฿${value.toFixed(2)}`;
}

// --- Tag colors ---
const TAG_COLORS = [
  'blue',
  'purple',
  'cyan',
  'green',
  'orange',
  'magenta',
  'gold',
  'geekblue',
] as const;

function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length] ?? 'default';
}

// --- Table columns ---
const columns = [
  {
    dataIndex: 'taskName',
    key: 'taskName',
    title: $t('page.bd.my-task.columns.task-name'),
    width: 180,
  },
  {
    dataIndex: 'task_code',
    ellipsis: true,
    key: 'task_code',
    title: $t('page.bd.my-task.columns.task-code'),
    width: 250,
  },
  {
    dataIndex: 'taskTags',
    key: 'taskTags',
    title: $t('page.bd.my-task.columns.task-tags'),
    width: 180,
  },
  {
    dataIndex: 'main_sku_brand',
    key: 'main_sku_brand',
    title: '品牌',
    width: 100,
  },
  {
    dataIndex: 'productUrl',
    key: 'productUrl',
    title: $t('page.bd.my-task.columns.product-url'),
    width: 220,
  },
  {
    dataIndex: 'commission',
    key: 'commission',
    title: $t('page.bd.my-task.columns.commission'),
    width: 100,
  },
  {
    dataIndex: 'brief',
    key: 'brief',
    title: $t('page.product.listing.columns.brief'),
    width: 100,
  },
  {
    dataIndex: 'videoProgress',
    key: 'videoProgress',
    title: $t('page.bd.my-task.columns.video-progress'),
    width: 170,
  },
  {
    dataIndex: 'deadline',
    key: 'deadline',
    title: $t('page.bd.my-task.columns.deadline'),
    width: 130,
  },
  {
    dataIndex: 'taskStatus',
    key: 'taskStatus',
    title: $t('page.bd.my-task.columns.task-status'),
    width: 100,
  },
  {
    dataIndex: 'operation',
    key: 'operation',
    title: $t('page.bd.my-task.columns.action'),
    width: 160,
  },
];
</script>

<template>
  <div class="my-tasks">
    <!-- Filter Bar -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <Input
        v-model:value="searchTaskCode"
        placeholder="搜索任务代码..."
        allow-clear
        class="!w-full sm:!w-[220px]"
      />
      <Select
        v-model:value="statusFilter"
        placeholder="任务状态"
        allow-clear
        class="!w-full sm:!w-[140px]"
        :options="[
          { label: $t('page.bd.my-task.task-status.normal'), value: 0 },
          { label: $t('page.bd.my-task.task-status.abandoned'), value: 1 },
        ]"
      />
      <DatePicker.RangePicker
        v-model:value="deadlineRange"
        placeholder="截止时间范围"
        class="!w-full sm:!w-[260px]"
      />
      <Button @click="onFilterSubmit">查询</Button>
    </div>

    <!-- Data Table -->
    <div class="my-tasks-table">
      <Table
        :columns="columns"
        :data-source="taskList"
        :loading="loading"
        :row-key="(r: BdTaskApi.BDTaskRow) => r.relationId"
        :pagination="{
          current: currentPage,
          pageSize,
          total: totalItems,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
          onChange: onPageChange,
        }"
        size="middle"
        :scroll="{ x: 1700 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'taskName'">
            <span class="font-medium">{{ record.taskName || '-' }}</span>
          </template>

          <template v-if="column.key === 'task_code'">
            <Tooltip v-if="hasMainSkuInfo(record)">
              <template #title>
                <div class="space-y-1">
                  <div>SKU编码: {{ record.main_sku_code || '-' }}</div>
                  <div>SKU名称: {{ record.main_sku_name || '-' }}</div>
                  <div>
                    SKU状态:
                    {{ getMainSkuStatusText(record.main_sku_status) }}
                  </div>
                </div>
              </template>
              <span
                class="block truncate cursor-help text-blue-500 hover:underline"
              >
                {{ record.task_code || '-' }}
              </span>
            </Tooltip>
            <Tooltip v-else :title="record.task_code">
              <span class="block truncate">{{ record.task_code || '-' }}</span>
            </Tooltip>
          </template>

          <template v-if="column.key === 'taskTags'">
            <Tooltip v-if="(record.taskTags ?? []).length > 0">
              <template #title>
                <Space :size="[4, 4]" wrap>
                  <Tag
                    v-for="(tag, i) in record.taskTags ?? []"
                    :key="tag"
                    :color="getTagColor(i)"
                  >
                    {{ tag }}
                  </Tag>
                </Space>
              </template>
              <div class="task-tags-display">
                <Tag
                  v-for="(tag, i) in record.taskTags ?? []"
                  :key="tag"
                  :color="getTagColor(i)"
                >
                  {{ tag }}
                </Tag>
              </div>
            </Tooltip>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'main_sku_brand'">
            <span>{{ record.main_sku_brand || '-' }}</span>
          </template>

          <template v-if="column.key === 'productUrl'">
            <a
              v-if="record.productUrl"
              :href="record.productUrl"
              target="_blank"
              class="text-blue-500 hover:underline"
            >
              {{ record.productUrl }}
            </a>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'commission'">
            {{ formatCurrency(record.commission) }}
          </template>

          <template v-if="column.key === 'brief'">
            <Button
              type="link"
              size="small"
              :loading="briefViewLoading[record.relationId]"
              @click="
                viewBrief(
                  record.product_listing_id ?? record.productListingId,
                  record.relationId,
                )
              "
            >
              {{ $t('page.product.listing.actions.view-brief') }}
            </Button>
          </template>

          <template v-if="column.key === 'videoProgress'">
            <Tooltip
              :title="`${record.completedVideos ?? 0} / ${record.totalVideos ?? 0}`"
            >
              <Progress
                :percent="getVideoProgressPercent(record)"
                :show-info="false"
                :status="isVideoCompleted(record) ? 'success' : 'active'"
                size="small"
                class="cursor-help"
              />
            </Tooltip>
          </template>

          <template v-if="column.key === 'deadline'">
            {{ formatDate(record.deadline) }}
          </template>

          <template v-if="column.key === 'taskStatus'">
            <Tag :color="getTaskStatusColor(record)">
              {{ getTaskStatusText(record) }}
            </Tag>
          </template>

          <template v-if="column.key === 'operation'">
            <Button type="primary" size="small" @click="openKolDialog(record)">
              提交达人参与
            </Button>
          </template>
        </template>

        <template #empty>
          <Empty description="暂无任务数据" />
        </template>
      </Table>
    </div>

    <!-- KOL Select Dialog -->
    <KolSelectDialog
      v-model:open="kolDialogOpen"
      :task-id="selectedTaskId"
      :product-listing-id="selectedProductListingId"
      @submitted="onKolSubmitted"
    />
  </div>
</template>

<style scoped>
.task-tags-display {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  overflow: hidden;
}

.task-tags-display :deep(.ant-tag) {
  flex-shrink: 0;
}

.my-tasks-table :deep(.ant-table) {
  overflow: hidden;
  border: 1px solid hsl(var(--border) / 50%);
  border-radius: 12px;
}

.my-tasks-table :deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--muted-foreground, 215 16% 47%));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: hsl(var(--background-deep, 216 20% 96%));
  border-bottom: 1px solid hsl(var(--border) / 40%);
}

.my-tasks-table :deep(.ant-table-tbody > tr:hover > td) {
  background: hsl(var(--primary) / 5%);
}
</style>
