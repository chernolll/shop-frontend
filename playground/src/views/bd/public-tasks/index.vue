<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { BdPublicTaskApi } from '#/api';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Empty, message, Modal, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { applyForPublicTask, getBDPublicTaskList } from '#/api';
import { $t } from '#/locales';

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'deadlineRange',
      label: $t('page.bd.task-center.filters.deadline-range'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.my-task.placeholders.all-budget'),
            value: undefined,
          },
          { label: $t('page.bd.publicTasks.budget-text.yes'), value: true },
          { label: $t('page.bd.publicTasks.budget-text.no'), value: false },
        ],
      },
      fieldName: 'hasBudget',
      label: $t('page.bd.my-task.filters.has-budget'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const applyingTaskId = ref<null | number>(null);
const applyModalVisible = ref(false);
const applyTargetTask = ref<BdPublicTaskApi.BdPublicTaskItem | null>(null);

function openApplyModal(row: BdPublicTaskApi.BdPublicTaskItem) {
  applyTargetTask.value = row;
  applyModalVisible.value = true;
}

async function confirmApply() {
  const taskId = applyTargetTask.value?.task_id;
  if (!taskId) return;

  applyingTaskId.value = taskId;
  try {
    await applyForPublicTask({ task_id: taskId });
    message.success($t('page.bd.publicTasks.messages.apply-success'));
    applyModalVisible.value = false;
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      $t('page.bd.publicTasks.messages.apply-failed');
    message.error(msg);
  } finally {
    applyingTaskId.value = null;
  }
}

async function fetchPublicTaskList({
  formValues,
  page,
}: {
  formValues?: Record<string, any>;
  page: { currentPage: number; pageSize: number };
}) {
  let result: BdPublicTaskApi.BdPublicTaskListResult = { total: 0, list: [] };
  try {
    const { currentPage, pageSize } = page;
    const deadlineRange = Array.isArray(formValues?.deadlineRange)
      ? formValues?.deadlineRange
      : [];
    result = await getBDPublicTaskList({
      deadlineEnd: deadlineRange[1] ? Number(deadlineRange[1]) : undefined,
      deadlineStart: deadlineRange[0] ? Number(deadlineRange[0]) : undefined,
      hasBudget:
        formValues?.hasBudget === undefined ? undefined : formValues.hasBudget,
      page: currentPage,
      pageSize,
    });
  } catch {}

  return {
    items: result.list,
    total: result.total,
  };
}

const [Grid] = useVbenVxeGrid<BdPublicTaskApi.BdPublicTaskItem>({
  formOptions,
  gridOptions: {
    columns: [
      {
        field: 'task_id',
        title: $t('page.bd.publicTasks.columns.task-id'),
        width: 80,
      },
      {
        field: 'product_url',
        title: $t('page.bd.publicTasks.columns.product-url'),
        minWidth: 200,
        slots: { default: 'product_url' },
      },
      {
        field: 'main_sku_code',
        title: $t('page.bd.publicTasks.columns.main-sku-code'),
        width: 100,
      },
      {
        field: 'main_sku_name',
        title: $t('page.bd.publicTasks.columns.main-sku-name'),
        minWidth: 120,
      },
      {
        field: 'commission',
        title: $t('page.bd.publicTasks.columns.commission'),
        width: 90,
        slots: { default: 'commission' },
      },
      {
        field: 'video_num',
        title: $t('page.bd.publicTasks.columns.video-num'),
        width: 80,
      },
      {
        field: 'bd_count',
        title: $t('page.bd.publicTasks.columns.bd-count'),
        width: 90,
      },
      {
        field: 'deadline',
        title: $t('page.bd.publicTasks.columns.deadline'),
        width: 120,
        slots: { default: 'deadline' },
      },
      {
        field: 'budget',
        title: $t('page.bd.publicTasks.columns.budget'),
        width: 80,
        slots: { default: 'budget' },
      },
      {
        field: 'created_at',
        title: $t('page.bd.publicTasks.columns.created-at'),
        width: 170,
        slots: { default: 'created_at' },
      },
      {
        align: 'center',
        field: 'operation',
        fixed: 'right',
        slots: { default: 'operation' },
        title: $t('page.bd.publicTasks.columns.operation'),
        width: 100,
      },
    ],
    maxHeight: 560,
    proxyConfig: {
      ajax: {
        query: async (
          {
            page,
          }: {
            formValues?: Record<string, any>;
            page: { currentPage: number; pageSize: number };
          },
          formValues: Record<string, any> = {},
        ) => {
          return await fetchPublicTaskList({ formValues, page });
        },
      },
    },
    rowConfig: { keyField: 'task_id' },
    scrollY: {
      enabled: true,
      gt: 0,
    },
    toolbarConfig: { refresh: true, zoom: true },
  },
});

function formatDate(timestamp: null | number | undefined): string {
  if (!timestamp) return $t('page.bd.publicTasks.deadline.no-deadline');
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.bd.publicTasks.list-title')">
      <template #toolbar-actions>
        <Alert
          type="info"
          show-icon
          :message="$t('page.bd.publicTasks.alert-message')"
          class="!mb-0 flex-1"
        />
      </template>
      <template #empty>
        <div class="flex min-h-[220px] items-center justify-center px-6 py-10">
          <Empty
            :description="$t('page.bd.publicTasks.empty')"
            class="max-w-[360px]"
          >
            <template #image>
              <div class="mb-4 text-base font-medium text-foreground">
                {{ $t('page.bd.publicTasks.empty') }}
              </div>
            </template>
          </Empty>
        </div>
      </template>
      <template #product_url="{ row }">
        <a
          :href="row.product_url"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
      </template>
      <template #commission="{ row }">
        {{ formatCurrency(row.commission) }}
      </template>
      <template #deadline="{ row }">
        <span v-if="row.deadline">{{ formatDate(row.deadline) }}</span>
        <Tag v-else color="green">
{{
          $t('page.bd.publicTasks.deadline.long-term')
        }}
</Tag>
      </template>
      <template #budget="{ row }">
        <Tag :color="row.budget === 1 ? 'green' : 'default'">
          {{
            row.budget === 1
              ? $t('page.bd.publicTasks.budget-text.yes')
              : $t('page.bd.publicTasks.budget-text.no')
          }}
        </Tag>
      </template>
      <template #created_at="{ row }">
        {{ formatDate(row.created_at) }}
      </template>
      <template #operation="{ row }">
        <Button
          type="primary"
          size="small"
          :loading="applyingTaskId === row.task_id"
          @click="openApplyModal(row)"
        >
          {{ $t('page.bd.publicTasks.apply-button') }}
        </Button>
      </template>
    </Grid>

    <!-- Apply Confirmation Modal -->
    <Modal
      v-model:open="applyModalVisible"
      :title="$t('page.bd.publicTasks.apply-modal.title')"
      :confirm-loading="!!applyingTaskId"
      @ok="confirmApply"
    >
      <p class="mb-2">
        {{ $t('page.bd.publicTasks.apply-modal.confirm-message') }}
      </p>
      <div
        v-if="applyTargetTask"
        class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800"
      >
        <p>
          <strong>{{ $t('page.bd.publicTasks.apply-modal.task-id') }}</strong>{{ applyTargetTask.task_id }}
        </p>
        <p>
          <strong>{{ $t('page.bd.publicTasks.apply-modal.sku') }}</strong>{{ applyTargetTask.main_sku_name || '-' }}
        </p>
        <p>
          <strong>{{ $t('page.bd.publicTasks.apply-modal.commission') }}</strong>{{ formatCurrency(applyTargetTask.commission) }}
        </p>
        <p>
          <strong>{{ $t('page.bd.publicTasks.apply-modal.video-num') }}</strong>{{ applyTargetTask.video_num }}
        </p>
      </div>
      <p class="mt-3 text-gray-500 text-sm">
        {{ $t('page.bd.publicTasks.apply-modal.tip') }}
      </p>
    </Modal>
  </Page>
</template>
