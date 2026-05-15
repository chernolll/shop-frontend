<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  DatePicker,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBriefAccessUrl } from '#/api/core';
import {
  getReviewSampleList,
  reviewSample,
  ReviewSampleApi,
} from '#/api/review/sample';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

type ReviewModalMode = 'review' | 'update';

const briefLoadingIds = ref<number[]>([]);
const { componentProps: bdCodeSelectProps } = useAdminBdSelect();
const selectedRows = ref<ReviewSampleApi.ListItem[]>([]);
const reviewModalOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewTargetRows = ref<ReviewSampleApi.ListItem[]>([]);
const reviewModalMode = ref<ReviewModalMode>('review');

const reviewForm = reactive<{
  address: string;
  delivered_at: string | undefined;
  package_received: 0 | 1 | undefined;
  quantity: number | undefined;
  reason: string;
  status:
    | ReviewSampleApi.RequestStatus.ABANDONED
    | ReviewSampleApi.RequestStatus.APPROVED
    | ReviewSampleApi.RequestStatus.REJECTED
    | undefined;
  tracking_number: string;
}>({
  address: '',
  delivered_at: undefined,
  package_received: 0,
  quantity: undefined,
  reason: '',
  status: ReviewSampleApi.RequestStatus.APPROVED,
  tracking_number: '',
});

const selectedCount = computed(() => selectedRows.value.length);
const isBatchMode = computed(() => reviewTargetRows.value.length > 1);
const isUpdateMode = computed(() => reviewModalMode.value === 'update');
const isRejecting = computed(
  () => reviewForm.status === ReviewSampleApi.RequestStatus.REJECTED,
);
const reviewModalTitle = computed(() => {
  if (isUpdateMode.value) {
    return $t('page.review.sample.update-modal.title');
  }
  return isBatchMode.value
    ? $t('page.review.sample.review-modal.batch-title')
    : $t('page.review.sample.review-modal.single-title');
});

const reviewStatusOptions = [
  {
    label: $t('page.review.sample.status.approved'),
    value: ReviewSampleApi.RequestStatus.APPROVED,
  },
  {
    label: $t('page.review.sample.status.rejected'),
    value: ReviewSampleApi.RequestStatus.REJECTED,
  },
  {
    label: $t('page.review.sample.status.abandoned'),
    value: ReviewSampleApi.RequestStatus.ABANDONED,
  },
];

const packageReceivedOptions = [
  {
    label: $t('page.review.sample.package-received.no'),
    value: 0,
  },
  {
    label: $t('page.review.sample.package-received.yes'),
    value: 1,
  },
];

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getRequestStatusText(status?: number) {
  switch (status) {
    case ReviewSampleApi.RequestStatus.ABANDONED: {
      return $t('page.review.sample.status.abandoned');
    }
    case ReviewSampleApi.RequestStatus.APPROVED: {
      return $t('page.review.sample.status.approved');
    }
    case ReviewSampleApi.RequestStatus.REJECTED: {
      return $t('page.review.sample.status.rejected');
    }
    default: {
      return $t('page.review.sample.status.pending');
    }
  }
}

function getRequestStatusColor(status?: number) {
  switch (status) {
    case ReviewSampleApi.RequestStatus.ABANDONED: {
      return 'default';
    }
    case ReviewSampleApi.RequestStatus.APPROVED: {
      return 'success';
    }
    case ReviewSampleApi.RequestStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function getSopStatusText(status?: number) {
  switch (status) {
    case ReviewSampleApi.SopStatus.COMPLETED: {
      return $t('page.review.sample.sop-status.completed');
    }
    case ReviewSampleApi.SopStatus.CONTACT: {
      return $t('page.review.sample.sop-status.contact');
    }
    case ReviewSampleApi.SopStatus.RECOVER: {
      return $t('page.review.sample.sop-status.recover');
    }
    case ReviewSampleApi.SopStatus.REMITTANCE: {
      return $t('page.review.sample.sop-status.remittance');
    }
    case ReviewSampleApi.SopStatus.SAMPLE: {
      return $t('page.review.sample.sop-status.sample');
    }
    case ReviewSampleApi.SopStatus.TERMINATED: {
      return $t('page.review.sample.sop-status.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case ReviewSampleApi.SopStatus.COMPLETED: {
      return 'success';
    }
    case ReviewSampleApi.SopStatus.CONTACT: {
      return 'default';
    }
    case ReviewSampleApi.SopStatus.RECOVER: {
      return 'warning';
    }
    case ReviewSampleApi.SopStatus.REMITTANCE: {
      return 'processing';
    }
    case ReviewSampleApi.SopStatus.SAMPLE: {
      return 'processing';
    }
    case ReviewSampleApi.SopStatus.TERMINATED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function getPackageReceivedText(value?: 0 | 1) {
  return value === 1
    ? $t('page.review.sample.package-received.yes')
    : $t('page.review.sample.package-received.no');
}

function getPackageReceivedColor(value?: 0 | 1) {
  return value === 1 ? 'success' : 'default';
}

function canBatchReviewRow(row: ReviewSampleApi.ListItem) {
  return (
    row.status === ReviewSampleApi.RequestStatus.PENDING &&
    row.sop_status !== ReviewSampleApi.SopStatus.TERMINATED
  );
}

function canUpdateRow(row: ReviewSampleApi.ListItem) {
  return (
    row.status === ReviewSampleApi.RequestStatus.APPROVED &&
    row.sop_status !== ReviewSampleApi.SopStatus.TERMINATED
  );
}

function isBriefLoading(row: ReviewSampleApi.ListItem) {
  return briefLoadingIds.value.includes(row.request_id);
}

async function openBriefPreview(row: ReviewSampleApi.ListItem) {
  const productListingId = Number(row.product_listing_id ?? 0);
  if (productListingId <= 0) {
    message.warning($t('page.review.sample.messages.preview-pdf-unavailable'));
    return;
  }

  const previewTab = window.open('', '_blank', 'noopener');

  try {
    briefLoadingIds.value = [...briefLoadingIds.value, row.request_id];
    const result = await getBriefAccessUrl({
      product_listing_id: productListingId,
    });
    if (previewTab) {
      previewTab.location.href = result.access_url;
      return;
    }
    window.open(result.access_url, '_blank', 'noopener');
  } catch {
    previewTab?.close();
  } finally {
    briefLoadingIds.value = briefLoadingIds.value.filter(
      (id) => id !== row.request_id,
    );
  }
}

function syncSelectedRows() {
  selectedRows.value =
    ((
      gridApi.grid as any
    )?.getCheckboxRecords?.() as ReviewSampleApi.ListItem[]) ?? [];
}

function clearSelections() {
  selectedRows.value = [];
  (gridApi.grid as any)?.clearCheckboxRow?.();
  (gridApi.grid as any)?.clearCheckboxReserve?.();
}

function resetReviewForm() {
  reviewForm.address = '';
  reviewForm.delivered_at = undefined;
  reviewForm.package_received = 0;
  reviewForm.quantity = undefined;
  reviewForm.reason = '';
  reviewForm.status = ReviewSampleApi.RequestStatus.APPROVED;
  reviewForm.tracking_number = '';
}

function seedReviewForm(row?: ReviewSampleApi.ListItem) {
  reviewForm.address = row?.address ?? '';
  reviewForm.delivered_at = row?.delivered_at
    ? String(row.delivered_at)
    : undefined;
  reviewForm.package_received = row?.package_received ?? 0;
  reviewForm.quantity = row?.quantity ? Number(row.quantity) : undefined;
  reviewForm.reason = row?.review_reason ?? '';
  reviewForm.status = ReviewSampleApi.RequestStatus.APPROVED;
  reviewForm.tracking_number = row?.tracking_number ?? '';
}

function openReviewModal(rows = selectedRows.value) {
  const targetRows = rows.filter((element) => canBatchReviewRow(element));

  if (targetRows.length === 0) {
    message.warning($t('page.review.sample.messages.select-records-first'));
    return;
  }

  reviewModalMode.value = 'review';
  reviewTargetRows.value = [...targetRows];
  if (targetRows.length === 1) {
    seedReviewForm(targetRows[0]);
  } else {
    resetReviewForm();
  }
  reviewModalOpen.value = true;
}

function openUpdateModal(row: ReviewSampleApi.ListItem) {
  if (!canUpdateRow(row)) {
    return;
  }
  reviewModalMode.value = 'update';
  reviewTargetRows.value = [row];
  seedReviewForm(row);
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  if (reviewSubmitting.value) {
    return;
  }
  reviewModalOpen.value = false;
}

function showReviewFailures(result: ReviewSampleApi.ReviewResultItem[]) {
  const failedItems = result.filter((item) => !item.success);
  if (failedItems.length === 0) {
    return;
  }

  Modal.warning({
    okText: $t('common.confirm'),
    title: $t('page.review.sample.messages.partial-failed-title'),
    content: h(
      'div',
      { class: 'space-y-2 text-sm leading-6' },
      failedItems.map((item) =>
        h(
          'div',
          { key: item.request_id },
          `#${item.request_id} ${item.reason || $t('page.review.sample.messages.unknown-failure')}`,
        ),
      ),
    ),
  });
}

async function submitReview() {
  if (reviewTargetRows.value.length === 0) {
    return;
  }

  if (!isUpdateMode.value && reviewForm.status === undefined) {
    message.warning($t('page.review.sample.messages.status-required'));
    return;
  }

  const reason = reviewForm.reason.trim();
  if (
    !isUpdateMode.value &&
    reviewForm.status === ReviewSampleApi.RequestStatus.REJECTED &&
    !reason
  ) {
    message.warning($t('page.review.sample.messages.reject-reason-required'));
    return;
  }

  if (
    !isBatchMode.value &&
    reviewForm.quantity !== undefined &&
    reviewForm.quantity < 1
  ) {
    message.warning($t('page.review.sample.messages.quantity-required'));
    return;
  }

  try {
    reviewSubmitting.value = true;

    const result = await reviewSample({
      list: reviewTargetRows.value.map((row) => {
        if (isUpdateMode.value) {
          return {
            address: reviewForm.address.trim() || undefined,
            delivered_at: toOptionalNumber(reviewForm.delivered_at),
            package_received: reviewForm.package_received,
            quantity: reviewForm.quantity,
            request_id: row.request_id,
            tracking_number: reviewForm.tracking_number.trim() || undefined,
          };
        }

        if (isBatchMode.value) {
          return {
            reason: reason || undefined,
            request_id: row.request_id,
            status: reviewForm.status,
          };
        }

        return {
          address: reviewForm.address.trim() || undefined,
          delivered_at: toOptionalNumber(reviewForm.delivered_at),
          package_received: reviewForm.package_received,
          quantity: reviewForm.quantity,
          reason: reason || undefined,
          request_id: row.request_id,
          status: reviewForm.status,
          tracking_number: reviewForm.tracking_number.trim() || undefined,
        };
      }),
    });

    const successCount = result.filter((item) => item.success).length;
    const failedCount = result.length - successCount;

    if (failedCount === 0) {
      message.success(
        $t('page.review.sample.messages.review-success', [
          String(successCount),
        ]),
      );
    } else if (successCount === 0) {
      message.warning(
        $t('page.review.sample.messages.review-all-failed', [
          String(failedCount),
        ]),
      );
    } else {
      message.warning(
        $t('page.review.sample.messages.review-partial-success', [
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
  collapsed: true,
  collapsedRows: 1,
  showCollapseButton: true,
  schema: [
    {
      component: 'Select',
      componentProps: () => bdCodeSelectProps.value,
      fieldName: 'bd_code',
      label: $t('page.review.sample.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.review.sample.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.sample.filters.all-status'),
            value: undefined,
          },
          {
            label: getRequestStatusText(ReviewSampleApi.RequestStatus.PENDING),
            value: ReviewSampleApi.RequestStatus.PENDING,
          },
          {
            label: getRequestStatusText(ReviewSampleApi.RequestStatus.APPROVED),
            value: ReviewSampleApi.RequestStatus.APPROVED,
          },
          {
            label: getRequestStatusText(ReviewSampleApi.RequestStatus.REJECTED),
            value: ReviewSampleApi.RequestStatus.REJECTED,
          },
          {
            label: getRequestStatusText(
              ReviewSampleApi.RequestStatus.ABANDONED,
            ),
            value: ReviewSampleApi.RequestStatus.ABANDONED,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.review.sample.filters.status'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'created_time_range',
      label: $t('page.review.sample.filters.created-time-range'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<ReviewSampleApi.ListItem> = {
  stripe: true,
  checkboxConfig: {
    checkMethod: ({ row }) => canBatchReviewRow(row),
    highlight: true,
  },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'brief',
      minWidth: 100,
      slots: { default: 'brief' },
      title: $t('page.review.sample.columns.brief-url'),
    },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.review.sample.columns.product-url'),
    },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.review.sample.columns.bd-code'),
    },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.review.sample.columns.kol-id'),
    },
    {
      field: 'address',
      minWidth: 220,
      title: $t('page.review.sample.columns.address'),
    },
    {
      field: 'quantity',
      minWidth: 100,
      title: $t('page.review.sample.columns.quantity'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.review.sample.columns.status'),
    },
    {
      field: 'sop_status',
      minWidth: 120,
      slots: { default: 'sop_status' },
      title: $t('page.review.sample.columns.sop-status'),
    },
    {
      field: 'tracking_number',
      minWidth: 160,
      slots: { default: 'tracking_number' },
      title: $t('page.review.sample.columns.tracking-number'),
    },
    {
      field: 'delivered_at',
      minWidth: 180,
      slots: { default: 'delivered_at' },
      title: $t('page.review.sample.columns.delivered-at'),
    },
    {
      field: 'package_received',
      minWidth: 130,
      slots: { default: 'package_received' },
      title: $t('page.review.sample.columns.package-received'),
    },
    {
      field: 'review_reason',
      minWidth: 180,
      slots: { default: 'review_reason' },
      title: $t('page.review.sample.columns.review-reason'),
    },
    {
      field: 'reviewer_name',
      minWidth: 120,
      title: $t('page.review.sample.columns.reviewer-name'),
    },
    {
      field: 'reviewed_at',
      minWidth: 180,
      slots: { default: 'reviewed_at' },
      title: $t('page.review.sample.columns.reviewed-at'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.review.sample.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.review.sample.columns.updated-at'),
    },
    {
      field: 'terminate_remark',
      minWidth: 180,
      slots: { default: 'terminate_remark' },
      title: $t('page.review.sample.columns.terminate-remark'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'operation' },
      title: $t('page.review.sample.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const createdTimeRange = resolveDateRange(
          formValues.created_time_range,
        );
        const result = await getReviewSampleList({
          bd_code: formValues.bd_code?.trim() || undefined,
          created_time_end: createdTimeRange.end,
          created_time_start: createdTimeRange.start,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          status: toOptionalNumber(formValues.status),
        });
        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    isHover: true,
    keyField: 'request_id',
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
    <Grid :table-title="$t('page.review.sample.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{
              $t('page.review.sample.selected-count', [String(selectedCount)])
            }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openReviewModal()"
          >
            {{ $t('page.review.sample.actions.batch-review') }}
          </Button>
        </Space>
      </template>

      <template #brief="{ row }">
        <Button
          type="link"
          size="small"
          :loading="isBriefLoading(row)"
          @click="openBriefPreview(row)"
        >
          {{ $t('page.review.actions.preview-pdf') }}
        </Button>
      </template>

      <template #product_url="{ row }">
        <a
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="cursor-pointer text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
      </template>

      <template #status="{ row }">
        <Tag :color="getRequestStatusColor(row.status)">
          {{ getRequestStatusText(row.status) }}
        </Tag>
      </template>

      <template #sop_status="{ row }">
        <Tag :color="getSopStatusColor(row.sop_status)">
          {{ getSopStatusText(row.sop_status) }}
        </Tag>
      </template>

      <template #tracking_number="{ row }">
        <span>{{ row.tracking_number || '-' }}</span>
      </template>

      <template #delivered_at="{ row }">
        <span>{{ formatTimestamp(row.delivered_at) }}</span>
      </template>

      <template #package_received="{ row }">
        <Tag :color="getPackageReceivedColor(row.package_received)">
          {{ getPackageReceivedText(row.package_received) }}
        </Tag>
      </template>

      <template #review_reason="{ row }">
        <span>{{ row.review_reason || '-' }}</span>
      </template>

      <template #reviewed_at="{ row }">
        <span>{{ formatTimestamp(row.reviewed_at) }}</span>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #terminate_remark="{ row }">
        <span>{{ row.terminate_remark || '-' }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button
            v-if="canBatchReviewRow(row)"
            type="link"
            size="small"
            @click="openReviewModal([row])"
          >
            {{ $t('page.review.sample.actions.review') }}
          </Button>
          <Button
            v-else-if="canUpdateRow(row)"
            type="link"
            size="small"
            @click="openUpdateModal(row)"
          >
            {{ $t('page.review.sample.actions.update-logistics') }}
          </Button>
          <span v-else>-</span>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.review.sample.empty')" />
      </template>
    </Grid>

    <Modal
      :open="reviewModalOpen"
      :confirm-loading="reviewSubmitting"
      :ok-text="
        isUpdateMode
          ? $t('page.review.sample.actions.confirm-update')
          : $t('page.review.sample.actions.confirm-submit')
      "
      :cancel-text="$t('common.cancel')"
      :title="reviewModalTitle"
      @cancel="closeReviewModal"
      @ok="submitReview"
    >
      <Form layout="vertical" class="pt-2">
        <div class="mb-4 text-sm leading-6 text-muted-foreground">
          {{
            isUpdateMode
              ? $t('page.review.sample.update-modal.description')
              : $t('page.review.sample.review-modal.description', [
                  String(reviewTargetRows.length),
                ])
          }}
        </div>

        <div
          v-if="reviewTargetRows.length === 1"
          class="mb-4 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6"
        >
          <div>
            {{
              $t('page.review.sample.review-modal.single-kol', [
                reviewTargetRows[0]?.kol_id ?? '-',
              ])
            }}
          </div>
          <div>
            {{
              $t('page.review.sample.review-modal.single-quantity', [
                String(reviewTargetRows[0]?.quantity ?? '-'),
              ])
            }}
          </div>
        </div>

        <FormItem
          v-if="!isUpdateMode"
          :label="$t('page.review.sample.review-modal.status-label')"
        >
          <Select
            v-model:value="reviewForm.status"
            class="w-full"
            :options="reviewStatusOptions"
            :placeholder="
              $t('page.review.sample.review-modal.status-placeholder')
            "
          />
        </FormItem>

        <template v-if="!isBatchMode">
          <FormItem :label="$t('page.review.sample.review-modal.address-label')">
            <Input.TextArea
              v-model:value="reviewForm.address"
              :auto-size="{ minRows: 3, maxRows: 6 }"
              :maxlength="500"
              :placeholder="
                $t('page.review.sample.review-modal.address-placeholder')
              "
              show-count
            />
          </FormItem>

          <FormItem :label="$t('page.review.sample.review-modal.quantity-label')">
            <InputNumber
              v-model:value="reviewForm.quantity"
              class="w-full"
              :min="1"
              :precision="0"
              :placeholder="
                $t('page.review.sample.review-modal.quantity-placeholder')
              "
            />
          </FormItem>

          <FormItem :label="$t('page.review.sample.review-modal.tracking-number-label')">
            <Input
              v-model:value="reviewForm.tracking_number"
              :maxlength="100"
              :placeholder="
                $t(
                  'page.review.sample.review-modal.tracking-number-placeholder',
                )
              "
            />
          </FormItem>

          <FormItem :label="$t('page.review.sample.review-modal.delivered-at-label')">
            <DatePicker
              v-model:value="reviewForm.delivered_at"
              class="w-full"
              show-time
              value-format="x"
            />
          </FormItem>

          <FormItem :label="$t('page.review.sample.review-modal.package-received-label')">
            <Select
              v-model:value="reviewForm.package_received"
              class="w-full"
              :options="packageReceivedOptions"
            />
          </FormItem>
        </template>

        <FormItem
          v-if="!isUpdateMode"
          :label="$t('page.review.sample.review-modal.reason-label')"
        >
          <Input.TextArea
            v-model:value="reviewForm.reason"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="500"
            :placeholder="
              isRejecting
                ? $t(
                    'page.review.sample.review-modal.reject-reason-placeholder',
                  )
                : $t('page.review.sample.review-modal.reason-placeholder')
            "
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
