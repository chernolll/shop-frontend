<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AdminPublicTaskApplicationApi,
  getPublicTaskApplications,
  reviewPublicTaskApplications,
} from '#/api/review/public-task-application';
import { $t } from '#/locales';

type ApplicationRow = AdminPublicTaskApplicationApi.ApplicationItem;

// --- Filters ---

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('page.review.publicTaskApplications.filters.task-id'),
      },
      fieldName: 'task_id',
      label: $t('page.review.publicTaskApplications.filters.task-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: $t('page.review.publicTaskApplications.filters.bd-code'),
      },
      fieldName: 'bd_code',
      label: $t('page.review.publicTaskApplications.columns.bd-code'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.publicTaskApplications.status-filter.all'),
            value: undefined,
          },
          {
            label: $t(
              'page.review.publicTaskApplications.status-filter.pending',
            ),
            value: 0,
          },
          {
            label: $t(
              'page.review.publicTaskApplications.status-filter.approved',
            ),
            value: 1,
          },
          {
            label: $t(
              'page.review.publicTaskApplications.status-filter.rejected',
            ),
            value: 2,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.review.publicTaskApplications.filters.status'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'timeRange',
      label: $t('page.review.publicTaskApplications.filters.time-range'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

// --- Grid ---

function syncSelectedRows() {
  selectedRows.value =
    ((gridApi.grid as any)?.getCheckboxRecords?.() as ApplicationRow[]) ?? [];
}

async function fetchList({
  formValues,
  page,
}: {
  formValues?: Record<string, any>;
  page: { currentPage: number; pageSize: number };
}) {
  let result: AdminPublicTaskApplicationApi.ListResult = {
    list: [],
    page: 1,
    page_size: 20,
    total: 0,
  };
  try {
    const { currentPage, pageSize } = page;
    const timeRange = Array.isArray(formValues?.timeRange)
      ? formValues?.timeRange
      : [];
    result = await getPublicTaskApplications({
      bd_code: formValues?.bd_code || undefined,
      created_at_end: timeRange[1] ? Number(timeRange[1]) : undefined,
      created_at_start: timeRange[0] ? Number(timeRange[0]) : undefined,
      page: currentPage,
      pageSize,
      status: formValues?.status,
      task_id: formValues?.task_id ? Number(formValues?.task_id) : undefined,
    });
  } catch {}
  return { items: result.list, total: result.total };
}

const [Grid, gridApi] = useVbenVxeGrid<ApplicationRow>({
  formOptions,
  gridEvents: {
    'checkbox-all': syncSelectedRows,
    'checkbox-change': syncSelectedRows,
  } as any,
  gridOptions: {
    checkboxConfig: { checkField: 'checked' },
    columns: [
      { type: 'checkbox', width: 50 },
      { type: 'seq', title: '#', width: 50 },
      {
        field: 'id',
        title: $t('page.review.publicTaskApplications.columns.id'),
        width: 80,
      },
      {
        field: 'task_id',
        title: $t('page.review.publicTaskApplications.columns.task-id'),
        width: 80,
      },
      {
        field: 'product_url',
        title: $t('page.review.publicTaskApplications.columns.product-url'),
        minWidth: 180,
        slots: { default: 'product_url' },
      },
      {
        field: 'main_sku_name',
        title: $t('page.review.publicTaskApplications.columns.main-sku-name'),
        minWidth: 100,
      },
      {
        field: 'bd_code',
        title: $t('page.review.publicTaskApplications.columns.bd-code'),
        width: 80,
      },
      {
        field: 'status',
        title: $t('page.review.publicTaskApplications.columns.status'),
        width: 90,
        slots: { default: 'status' },
      },
      {
        field: 'created_at',
        title: $t('page.review.publicTaskApplications.columns.created-at'),
        width: 170,
        slots: { default: 'created_at' },
      },
      {
        field: 'reviewer_name',
        title: $t('page.review.publicTaskApplications.columns.reviewer-name'),
        width: 100,
      },
      {
        field: 'audit_time',
        title: $t('page.review.publicTaskApplications.columns.audit-time'),
        width: 170,
        slots: { default: 'audit_time' },
      },
      {
        field: 'reason',
        title: $t('page.review.publicTaskApplications.columns.reason'),
        minWidth: 120,
        slots: { default: 'reason' },
      },
      {
        align: 'center',
        field: 'operation',
        fixed: 'right',
        slots: { default: 'operation' },
        title: $t('page.review.publicTaskApplications.columns.operation'),
        width: 160,
      },
    ],
    maxHeight: 560,
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: Record<string, any> = {}) => {
          return await fetchList({ formValues, page });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    scrollY: { enabled: true, gt: 0 },
    toolbarConfig: { refresh: true, zoom: true },
  },
});

// --- Review ---

const selectedRows = ref<ApplicationRow[]>([]);
const reviewModalVisible = ref(false);
const reviewSubmitting = ref(false);
const reviewForm = ref({
  reason: '',
  status: 1 as number, // 1=approve, 2=reject
  video_num: 1,
});

const isRejecting = computed(() => reviewForm.value.status === 2);
const reviewModalTitle = computed(() =>
  isRejecting.value
    ? $t('page.review.publicTaskApplications.review-modal.reject-title')
    : $t('page.review.publicTaskApplications.review-modal.approve-title'),
);

function openBatchReviewModal(status: number) {
  const records = selectedRows.value;
  if (records.length === 0) {
    message.warning(
      $t('page.review.publicTaskApplications.messages.select-records-first'),
    );
    return;
  }
  // Only allow reviewing pending applications
  const pendingRecords = records.filter((r: ApplicationRow) => r.status === 0);
  if (pendingRecords.length === 0) {
    message.warning(
      $t('page.review.publicTaskApplications.messages.no-pending-records'),
    );
    return;
  }
  selectedRows.value = pendingRecords;
  reviewForm.value = { reason: '', status, video_num: 1 };
  reviewModalVisible.value = true;
}

function openSingleReview(row: ApplicationRow, status: number) {
  selectedRows.value = [row];
  reviewForm.value = { reason: '', status, video_num: 1 };
  reviewModalVisible.value = true;
}

async function submitReview() {
  if (isRejecting.value && !reviewForm.value.reason.trim()) {
    message.warning(
      $t('page.review.publicTaskApplications.messages.reject-reason-required'),
    );
    return;
  }
  if (!isRejecting.value && reviewForm.value.video_num <= 0) {
    message.warning(
      $t('page.review.publicTaskApplications.messages.video-num-required'),
    );
    return;
  }

  reviewSubmitting.value = true;
  try {
    const list = selectedRows.value.map((row) => ({
      application_id: row.id,
      commission: row.commission,
      reason: reviewForm.value.reason || undefined,
      status: reviewForm.value.status,
      video_num: isRejecting.value ? undefined : reviewForm.value.video_num,
    }));

    const results = await reviewPublicTaskApplications({ list });
    const failures = results.filter((r) => !r.success);
    const successes = results.filter((r) => r.success);

    if (failures.length === 0) {
      message.success(
        $t('page.review.publicTaskApplications.messages.review-success', [
          String(successes.length),
        ]),
      );
    } else if (successes.length === 0) {
      message.error(
        $t('page.review.publicTaskApplications.messages.review-all-failed'),
      );
    } else {
      message.warning(
        $t(
          'page.review.publicTaskApplications.messages.review-partial-success',
          [String(successes.length), String(failures.length)],
        ),
      );
    }

    reviewModalVisible.value = false;
    selectedRows.value = [];
    (gridApi.grid as any)?.clearCheckboxRow?.();
    (gridApi.grid as any)?.clearCheckboxReserve?.();
    await gridApi.query();
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      $t('page.review.publicTaskApplications.messages.review-failed');
    message.error(msg);
  } finally {
    reviewSubmitting.value = false;
  }
}

// --- Helpers ---

function getStatusTag(status: number) {
  switch (status) {
    case 0: {
      return {
        color: 'orange',
        text: $t('page.review.publicTaskApplications.status.pending'),
      };
    }
    case 1: {
      return {
        color: 'green',
        text: $t('page.review.publicTaskApplications.status.approved'),
      };
    }
    case 2: {
      return {
        color: 'red',
        text: $t('page.review.publicTaskApplications.status.rejected'),
      };
    }
    default: {
      return {
        color: 'default',
        text: $t('page.review.publicTaskApplications.status.unknown'),
      };
    }
  }
}

function formatDate(ts: null | number | undefined): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

// --- Selectable columns ---

const selectedCount = computed(() => selectedRows.value.length);
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.review.publicTaskApplications.list-title')">
      <template #toolbar-actions>
        <Space>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openBatchReviewModal(1)"
          >
            {{ $t('page.review.publicTaskApplications.actions.batch-approve') }}
          </Button>
          <Button
            danger
            :disabled="selectedCount === 0"
            @click="openBatchReviewModal(2)"
          >
            {{ $t('page.review.publicTaskApplications.actions.batch-reject') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <div class="flex min-h-[220px] items-center justify-center px-6 py-10">
          <Empty
            :description="$t('page.review.publicTaskApplications.empty')"
            class="max-w-[360px]"
          />
        </div>
      </template>

      <template #product_url="{ row }">
        <a
          v-if="row.product_url"
          :href="row.product_url"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
        <span v-else>-</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusTag(row.status).color">
          {{ getStatusTag(row.status).text }}
        </Tag>
      </template>

      <template #created_at="{ row }">
        {{ formatDate(row.created_at) }}
      </template>

      <template #audit_time="{ row }">
        {{ formatDate(row.audit_time) }}
      </template>

      <template #reason="{ row }">
        <span class="text-gray-500">{{ row.reason || '-' }}</span>
      </template>

      <template #operation="{ row }">
        <Space v-if="row.status === 0">
          <Button type="link" size="small" @click="openSingleReview(row, 1)">
            {{ $t('page.review.publicTaskApplications.actions.approve') }}
          </Button>
          <Button
            type="link"
            danger
            size="small"
            @click="openSingleReview(row, 2)"
          >
            {{ $t('page.review.publicTaskApplications.actions.reject') }}
          </Button>
        </Space>
        <span v-else class="text-gray-400">-</span>
      </template>
    </Grid>

    <!-- Review Modal -->
    <Modal
      v-model:open="reviewModalVisible"
      :title="reviewModalTitle"
      :confirm-loading="reviewSubmitting"
      @ok="submitReview"
    >
      <p class="mb-3">
        {{
          isRejecting
            ? $t(
                'page.review.publicTaskApplications.review-modal.description-reject',
                [String(selectedRows.length)],
              )
            : $t(
                'page.review.publicTaskApplications.review-modal.description-approve',
                [String(selectedRows.length)],
              )
        }}
      </p>

      <!-- Selected applications summary -->
      <div
        class="mb-3 max-h-40 overflow-y-auto rounded bg-gray-50 p-2 dark:bg-gray-800"
      >
        <div
          v-for="row in selectedRows"
          :key="row.id"
          class="border-b border-gray-200 py-1 text-sm last:border-0 dark:border-gray-700"
        >
          {{
            $t(
              'page.review.publicTaskApplications.review-modal.application-summary',
              [String(row.id), row.bd_code, String(row.task_id)],
            )
          }}
        </div>
      </div>

      <!-- Approve fields -->
      <template v-if="!isRejecting">
        <div class="mb-3">
          <label class="mb-1 block text-sm font-medium">{{
            $t(
              'page.review.publicTaskApplications.review-modal.video-num-label',
            )
          }}</label>
          <InputNumber
            v-model:value="reviewForm.video_num"
            :min="1"
            class="w-full"
          />
        </div>
      </template>

      <!-- Reject reason -->
      <div v-if="isRejecting">
        <label class="mb-1 block text-sm font-medium">
          {{
            $t(
              'page.review.publicTaskApplications.review-modal.reject-reason-label',
            )
          }}
          <span class="text-red-500">{{
            $t(
              'page.review.publicTaskApplications.review-modal.reject-reason-required',
            )
          }}</span>
        </label>
        <Input.Textarea
          v-model:value="reviewForm.reason"
          :maxlength="500"
          :rows="3"
          :placeholder="
            $t(
              'page.review.publicTaskApplications.review-modal.reject-reason-placeholder',
            )
          "
        />
      </div>
    </Modal>
  </Page>
</template>
