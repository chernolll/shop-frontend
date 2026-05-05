<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Button, Input, message, Modal, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getReviewBudgetList,
  reviewBudget,
  ReviewBudgetApi,
} from '#/api/review/budget';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const selectedRows = ref<ReviewBudgetApi.ListItem[]>([]);
const { componentProps: bdCodeSelectProps } = useAdminBdSelect();
const reviewSubmitting = ref(false);
const reviewTargetRows = ref<ReviewBudgetApi.ListItem[]>([]);
const reviewModalOpen = ref(false);
const reviewForm = reactive<{
  reason: string;
  status:
    | ReviewBudgetApi.BudgetStatus.APPROVED
    | ReviewBudgetApi.BudgetStatus.REJECTED;
}>({
  reason: '',
  status: ReviewBudgetApi.BudgetStatus.APPROVED,
});

const selectedCount = computed(() => selectedRows.value.length);
const isRejecting = computed(
  () => reviewForm.status === ReviewBudgetApi.BudgetStatus.REJECTED,
);
const reviewModalTitle = computed(() =>
  reviewTargetRows.value.length > 1
    ? $t('page.review.budget.review-modal.batch-title')
    : $t('page.review.budget.review-modal.single-title'),
);

function getBudgetStatusText(status?: number) {
  switch (status) {
    case ReviewBudgetApi.BudgetStatus.APPROVED: {
      return $t('page.review.budget.status.approved');
    }
    case ReviewBudgetApi.BudgetStatus.REJECTED: {
      return $t('page.review.budget.status.rejected');
    }
    default: {
      return $t('page.review.budget.status.pending');
    }
  }
}

function getBudgetStatusColor(status?: number) {
  switch (status) {
    case ReviewBudgetApi.BudgetStatus.APPROVED: {
      return 'success';
    }
    case ReviewBudgetApi.BudgetStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function getSopStatusText(status?: number) {
  switch (status) {
    case ReviewBudgetApi.SopStatus.COMPLETED: {
      return $t('page.review.budget.sop-status.completed');
    }
    case ReviewBudgetApi.SopStatus.CONTACT: {
      return $t('page.review.budget.sop-status.contact');
    }
    case ReviewBudgetApi.SopStatus.RECOVER: {
      return $t('page.review.budget.sop-status.recover');
    }
    case ReviewBudgetApi.SopStatus.REMITTANCE: {
      return $t('page.review.budget.sop-status.remittance');
    }
    case ReviewBudgetApi.SopStatus.SAMPLE: {
      return $t('page.review.budget.sop-status.sample');
    }
    case ReviewBudgetApi.SopStatus.TERMINATED: {
      return $t('page.review.budget.sop-status.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case ReviewBudgetApi.SopStatus.COMPLETED: {
      return 'success';
    }
    case ReviewBudgetApi.SopStatus.CONTACT: {
      return 'default';
    }
    case ReviewBudgetApi.SopStatus.RECOVER: {
      return 'warning';
    }
    case ReviewBudgetApi.SopStatus.REMITTANCE: {
      return 'processing';
    }
    case ReviewBudgetApi.SopStatus.SAMPLE: {
      return 'processing';
    }
    case ReviewBudgetApi.SopStatus.TERMINATED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function canReviewRow(row: ReviewBudgetApi.ListItem) {
  return row.budget_status === ReviewBudgetApi.BudgetStatus.PENDING;
}

function syncSelectedRows() {
  selectedRows.value =
    ((
      gridApi.grid as any
    )?.getCheckboxRecords?.() as ReviewBudgetApi.ListItem[]) ?? [];
}

function clearSelections() {
  selectedRows.value = [];
  (gridApi.grid as any)?.clearCheckboxRow?.();
  (gridApi.grid as any)?.clearCheckboxReserve?.();
}

function openReviewModal(
  status:
    | ReviewBudgetApi.BudgetStatus.APPROVED
    | ReviewBudgetApi.BudgetStatus.REJECTED,
  rows = selectedRows.value,
) {
  const targetRows = rows.filter((element) => canReviewRow(element));

  if (targetRows.length === 0) {
    message.warning($t('page.review.budget.messages.select-records-first'));
    return;
  }
  reviewForm.status = status;
  reviewForm.reason = '';
  reviewTargetRows.value = [...targetRows];
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  if (reviewSubmitting.value) {
    return;
  }
  reviewModalOpen.value = false;
}

function showReviewFailures(result: ReviewBudgetApi.ReviewResultItem[]) {
  const failedItems = result.filter((item) => !item.success);
  if (failedItems.length === 0) {
    return;
  }

  Modal.warning({
    okText: $t('common.confirm'),
    title: $t('page.review.budget.messages.partial-failed-title'),
    content: h(
      'div',
      { class: 'space-y-2 text-sm leading-6' },
      failedItems.map((item) =>
        h(
          'div',
          { key: item.budget_application_id },
          `#${item.budget_application_id} ${item.reason || $t('page.review.budget.messages.unknown-failure')}`,
        ),
      ),
    ),
  });
}

async function submitReview() {
  if (reviewTargetRows.value.length === 0) {
    return;
  }

  const reason = reviewForm.reason.trim();
  if (reviewForm.status === ReviewBudgetApi.BudgetStatus.REJECTED && !reason) {
    message.warning($t('page.review.budget.messages.reject-reason-required'));
    return;
  }

  try {
    reviewSubmitting.value = true;
    const result = await reviewBudget({
      list: reviewTargetRows.value.map((row) => ({
        budget_application_id: row.budget_application_id,
        reason,
        status: reviewForm.status,
      })),
    });

    const successCount = result.filter((item) => item.success).length;
    const failedCount = result.length - successCount;

    if (failedCount === 0) {
      message.success(
        $t('page.review.budget.messages.review-success', [
          String(successCount),
        ]),
      );
    } else if (successCount === 0) {
      message.warning(
        $t('page.review.budget.messages.review-all-failed', [
          String(failedCount),
        ]),
      );
    } else {
      message.warning(
        $t('page.review.budget.messages.review-partial-success', [
          String(successCount),
          String(failedCount),
        ]),
      );
    }

    showReviewFailures(result);
    reviewModalOpen.value = false;
    reviewTargetRows.value = [];
    clearSelections();
    await gridApi.query();
  } finally {
    reviewSubmitting.value = false;
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Select',
      componentProps: () => bdCodeSelectProps.value,
      fieldName: 'bd_code',
      label: $t('page.review.budget.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.review.budget.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.budget.filters.all-status'),
            value: undefined,
          },
          {
            label: getBudgetStatusText(ReviewBudgetApi.BudgetStatus.PENDING),
            value: ReviewBudgetApi.BudgetStatus.PENDING,
          },
          {
            label: getBudgetStatusText(ReviewBudgetApi.BudgetStatus.APPROVED),
            value: ReviewBudgetApi.BudgetStatus.APPROVED,
          },
          {
            label: getBudgetStatusText(ReviewBudgetApi.BudgetStatus.REJECTED),
            value: ReviewBudgetApi.BudgetStatus.REJECTED,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.review.budget.filters.status'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'submit_time_range',
      label: $t('page.review.budget.filters.submit-time-range'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<ReviewBudgetApi.ListItem> = {
  checkboxConfig: {
    highlight: true,
    checkMethod: ({ row }) => canReviewRow(row),
  },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.review.budget.columns.product-url'),
    },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.review.budget.columns.bd-code'),
    },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.review.budget.columns.kol-id'),
    },
    {
      field: 'contact_information',
      minWidth: 220,
      title: $t('page.review.budget.columns.contact-information'),
    },
    {
      field: 'amount',
      minWidth: 120,
      title: $t('page.review.budget.columns.amount'),
    },
    {
      field: 'budget_status',
      minWidth: 120,
      slots: { default: 'budget_status' },
      title: $t('page.review.budget.columns.budget-status'),
    },
    {
      field: 'sop_status',
      minWidth: 120,
      slots: { default: 'sop_status' },
      title: $t('page.review.budget.columns.sop-status'),
    },
    {
      field: 'terminate_remark',
      minWidth: 180,
      slots: { default: 'terminate_remark' },
      title: $t('page.review.budget.columns.terminate-remark'),
    },
    {
      field: 'submitter_name',
      minWidth: 120,
      title: $t('page.review.budget.columns.submitter-name'),
    },
    {
      field: 'reviewer_name',
      minWidth: 120,
      title: $t('page.review.budget.columns.reviewer-name'),
    },
    {
      field: 'submit_at',
      minWidth: 180,
      slots: { default: 'submit_at' },
      title: $t('page.review.budget.columns.submit-at'),
    },
    {
      field: 'reviewed_at',
      minWidth: 180,
      slots: { default: 'reviewed_at' },
      title: $t('page.review.budget.columns.reviewed-at'),
    },
    {
      field: 'reason',
      minWidth: 180,
      slots: { default: 'reason' },
      title: $t('page.review.budget.columns.reason'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'operation' },
      title: $t('page.review.budget.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const submitTimeRange = resolveDateRange(formValues.submit_time_range);
        const result = await getReviewBudgetList({
          bd_code: formValues.bd_code?.trim() || undefined,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          status: toOptionalNumber(formValues.status),
          submit_time_end: submitTimeRange.end,
          submit_time_start: submitTimeRange.start,
        });
        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'budget_application_id',
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
  gridEvents: {
    'checkbox-all': syncSelectedRows,
    'checkbox-change': syncSelectedRows,
  } as any,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.review.budget.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{
              $t('page.review.budget.selected-count', [String(selectedCount)])
            }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openReviewModal(ReviewBudgetApi.BudgetStatus.APPROVED)"
          >
            {{ $t('page.review.budget.actions.batch-approve') }}
          </Button>
          <Button
            danger
            :disabled="selectedCount === 0"
            @click="openReviewModal(ReviewBudgetApi.BudgetStatus.REJECTED)"
          >
            {{ $t('page.review.budget.actions.batch-reject') }}
          </Button>
        </Space>
      </template>

      <template #product_url="{ row }">
        <a
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
      </template>

      <template #budget_status="{ row }">
        <Tag :color="getBudgetStatusColor(row.budget_status)">
          {{ getBudgetStatusText(row.budget_status) }}
        </Tag>
      </template>

      <template #sop_status="{ row }">
        <Tag :color="getSopStatusColor(row.sop_status)">
          {{ getSopStatusText(row.sop_status) }}
        </Tag>
      </template>

      <template #terminate_remark="{ row }">
        <span>{{ row.terminate_remark || '-' }}</span>
      </template>

      <template #submit_at="{ row }">
        <span>{{ formatTimestamp(row.submit_at) }}</span>
      </template>

      <template #reviewed_at="{ row }">
        <span>{{ formatTimestamp(row.reviewed_at) }}</span>
      </template>

      <template #reason="{ row }">
        <span>{{ row.reason || '-' }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button
            type="link"
            size="small"
            :disabled="!canReviewRow(row)"
            @click="
              openReviewModal(ReviewBudgetApi.BudgetStatus.APPROVED, [row])
            "
          >
            {{ $t('page.review.budget.actions.approve') }}
          </Button>
          <Button
            danger
            type="link"
            size="small"
            :disabled="!canReviewRow(row)"
            @click="
              openReviewModal(ReviewBudgetApi.BudgetStatus.REJECTED, [row])
            "
          >
            {{ $t('page.review.budget.actions.reject') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      :open="reviewModalOpen"
      :confirm-loading="reviewSubmitting"
      :ok-text="
        isRejecting
          ? $t('page.review.budget.actions.confirm-reject')
          : $t('page.review.budget.actions.confirm-approve')
      "
      :cancel-text="$t('common.cancel')"
      :title="reviewModalTitle"
      @cancel="closeReviewModal"
      @ok="submitReview"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <div class="text-sm leading-6 text-muted-foreground">
          {{
            $t('page.review.budget.review-modal.description', [
              String(reviewTargetRows.length),
            ])
          }}
        </div>

        <div
          v-if="reviewTargetRows.length === 1"
          class="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6"
        >
          <div>
            {{
              $t('page.review.budget.review-modal.single-kol', [
                reviewTargetRows[0]?.kol_id ?? '-',
              ])
            }}
          </div>
          <div>
            {{
              $t('page.review.budget.review-modal.single-amount', [
                String(reviewTargetRows[0]?.amount ?? '-'),
              ])
            }}
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.budget.review-modal.reason-label') }}
          </div>
          <Input.TextArea
            v-model:value="reviewForm.reason"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="500"
            :placeholder="
              isRejecting
                ? $t(
                    'page.review.budget.review-modal.reject-reason-placeholder',
                  )
                : $t(
                    'page.review.budget.review-modal.approve-reason-placeholder',
                  )
            "
            show-count
          />
        </div>
      </Space>
    </Modal>
  </Page>
</template>
