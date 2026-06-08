<script lang="ts" setup>
import type { MyTaskItem, TaskStatus } from '../mockData';

import { computed, reactive, ref } from 'vue';

import { Button, Input, Select, Space, Table, Tag } from 'ant-design-vue';

import { mockMyTaskList, TASK_STATUS_CONFIG } from '../mockData';

// --- Filters ---
const searchKeyword = ref('');
const statusFilter = ref<TaskStatus | undefined>(undefined);

const statusOptions = Object.entries(TASK_STATUS_CONFIG).map(([key, val]) => ({
  label: val.label,
  value: Number(key),
}));

// --- Table Selection ---
const selectedRowKeys = ref<number[]>([]);

// --- Pagination ---
const pagination = reactive({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// --- Filtered data ---
const filteredList = computed(() => {
  let list = mockMyTaskList;

  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.taskCode.toLowerCase().includes(kw) ||
        item.assigneeName.toLowerCase().includes(kw) ||
        item.assignee.toLowerCase().includes(kw),
    );
  }

  if (statusFilter.value !== undefined) {
    list = list.filter((item) => item.status === statusFilter.value);
  }

  return list;
});

const tableData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  return filteredList.value.slice(start, start + pagination.pageSize);
});

function resetFilters() {
  searchKeyword.value = '';
  statusFilter.value = undefined;
  pagination.current = 1;
}

const paginationConfig = computed(() => ({
  ...pagination,
  total: filteredList.value.length,
}));

// --- Formatting ---
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString()}`;
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
}

function handleSelectionChange(keys: (number | string)[]) {
  selectedRowKeys.value = keys as number[];
}

// --- Table Columns ---
const columns = [
  {
    title: '任务代码',
    dataIndex: 'taskCode',
    key: 'taskCode',
    width: 160,
    sorter: (a: MyTaskItem, b: MyTaskItem) =>
      a.taskCode.localeCompare(b.taskCode),
  },
  {
    title: '指派对象',
    dataIndex: 'assigneeName',
    key: 'assigneeName',
    width: 120,
    sorter: (a: MyTaskItem, b: MyTaskItem) =>
      a.assigneeName.localeCompare(b.assigneeName),
  },
  {
    title: '奖励 (฿)',
    dataIndex: 'reward',
    key: 'reward',
    width: 120,
    sorter: (a: MyTaskItem, b: MyTaskItem) => a.reward - b.reward,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 130,
    sorter: (a: MyTaskItem, b: MyTaskItem) => a.createdAt - b.createdAt,
  },
  {
    title: '截止时间',
    dataIndex: 'deadline',
    key: 'deadline',
    width: 130,
    sorter: (a: MyTaskItem, b: MyTaskItem) => a.deadline - b.deadline,
  },
  {
    title: '当前状态',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    sorter: (a: MyTaskItem, b: MyTaskItem) => a.status - b.status,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 130,
    sorter: (a: MyTaskItem, b: MyTaskItem) => a.updatedAt - b.updatedAt,
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right' as const,
  },
];
</script>

<template>
  <div class="my-tasks">
    <!-- Filter Bar -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索任务代码 / 指派对象..."
        allow-clear
        class="!w-full sm:!w-[260px]"
      >
        <template #prefix>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </template>
      </Input>
      <Select
        v-model:value="statusFilter"
        placeholder="状态筛选"
        allow-clear
        class="!w-full sm:!w-[150px]"
        :options="statusOptions"
      />
      <div class="flex-1"></div>
      <Button @click="resetFilters">
        <template #icon>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
            />
          </svg>
        </template>
        刷新
      </Button>
    </div>

    <!-- Batch Actions -->
    <div
      v-if="selectedRowKeys.length > 0"
      class="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950"
    >
      <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
        已选择 {{ selectedRowKeys.length }} 项
      </span>
      <Button size="small">批量导出</Button>
      <Button size="small">批量标记完成</Button>
      <Button size="small" danger>批量删除</Button>
    </div>

    <!-- Data Table -->
    <div class="my-tasks-table">
      <Table
        :columns="columns"
        :data-source="tableData"
        :pagination="paginationConfig"
        :row-key="(r: MyTaskItem) => r.id"
        :row-selection="{
          selectedRowKeys,
          onChange: handleSelectionChange,
        }"
        size="middle"
        :scroll="{ x: 1100 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- Task Code -->
          <template v-if="column.key === 'taskCode'">
            <span class="task-code-link">{{ record.taskCode }}</span>
          </template>

          <!-- Assignee -->
          <template v-if="column.key === 'assigneeName'">
            <div class="flex items-center gap-2">
              <div
                class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {{ record.assigneeName.charAt(0) }}
              </div>
              <span class="text-sm">{{ record.assigneeName }}</span>
            </div>
          </template>

          <!-- Reward -->
          <template v-if="column.key === 'reward'">
            <span
              :class="
                record.reward > 0
                  ? 'font-medium text-amber-600'
                  : 'text-gray-400'
              "
            >
              {{ record.reward > 0 ? formatCurrency(record.reward) : '-' }}
            </span>
          </template>

          <!-- Created At -->
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <!-- Deadline -->
          <template v-if="column.key === 'deadline'">
            <span
              :class="
                record.status === 3 || new Date(record.deadline) < new Date()
                  ? 'text-red-500'
                  : ''
              "
            >
              {{ formatDate(record.deadline) }}
            </span>
          </template>

          <!-- Status Badge -->
          <template v-if="column.key === 'status'">
            <Tag :color="TASK_STATUS_CONFIG[record.status as TaskStatus].color">
              {{ TASK_STATUS_CONFIG[record.status as TaskStatus].label }}
            </Tag>
          </template>

          <!-- Updated At -->
          <template v-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <!-- Actions -->
          <template v-if="column.key === 'action'">
            <Space :size="[4, 4]">
              <Button type="link" size="small">查看详情</Button>
              <Button
                v-if="record.status === 0 || record.status === 1"
                type="link"
                size="small"
              >
                上传达人
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>
  </div>
</template>

<style scoped>
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

.task-code-link {
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--primary));
}
</style>
