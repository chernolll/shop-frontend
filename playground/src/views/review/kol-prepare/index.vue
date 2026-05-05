<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReviewKolPrepareApi } from '#/api/review/kol-prepare';

import { computed, h, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Input, message, Modal, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBriefAccessUrl } from '#/api/core';
import {
  getReviewKolPrepareList,
  reviewKolPrepare,
} from '#/api/review/kol-prepare';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const router = useRouter();
const { componentProps: bdCodeSelectProps } = useAdminBdSelect();

const briefLoadingIds = ref<number[]>([]);
const selectedRows = ref<ReviewKolPrepareApi.ListItem[]>([]);
const reviewSubmitting = ref(false);
const reviewTargetRows = ref<ReviewKolPrepareApi.ListItem[]>([]);
const reviewModalOpen = ref(false);
const reviewForm = reactive<{
  reason: string;
  status:
    | ReviewKolPrepareApi.Status.APPROVED
    | ReviewKolPrepareApi.Status.REJECTED;
}>({
  reason: '',
  status: 3,
});

const selectedCount = computed(() => selectedRows.value.length);
const isRejecting = computed(() => reviewForm.status === 2);
const reviewModalTitle = computed(() =>
  isRejecting.value
    ? $t('page.review.kolPrepare.review-modal.reject-title')
    : $t('page.review.kolPrepare.review-modal.approve-title'),
);
const reviewModalDescription = computed(() =>
  $t('page.review.kolPrepare.review-modal.description', [
    String(reviewTargetRows.value.length),
  ]),
);

function getStatusText(status: ReviewKolPrepareApi.Status) {
  switch (status) {
    case 1: {
      return $t('page.review.status.pending');
    }
    case 2: {
      return $t('page.review.status.rejected');
    }
    case 3: {
      return $t('page.review.status.approved');
    }
    default: {
      return $t('page.review.status.waiting');
    }
  }
}

function getStatusColor(status: ReviewKolPrepareApi.Status) {
  switch (status) {
    case 1: {
      return 'processing';
    }
    case 2: {
      return 'error';
    }
    case 3: {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
}

function openDetail(row: ReviewKolPrepareApi.ListItem) {
  router.push(`/review/kol-prepare/${row.task_id}`);
}

function isBriefLoading(row: ReviewKolPrepareApi.ListItem) {
  return briefLoadingIds.value.includes(row.prepare_id);
}

async function openBriefPreview(row: ReviewKolPrepareApi.ListItem) {
  const productListingId = Number(row.product_listing_id ?? 0);
  if (productListingId <= 0) {
    message.warning(
      $t('page.review.kolPrepare.messages.preview-pdf-unavailable'),
    );
    return;
  }

  const previewTab = window.open('', '_blank', 'noopener');

  try {
    briefLoadingIds.value = [...briefLoadingIds.value, row.prepare_id];
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
      (id) => id !== row.prepare_id,
    );
  }
}

function syncSelectedRows() {
  selectedRows.value =
    ((
      gridApi.grid as any
    )?.getCheckboxRecords?.() as ReviewKolPrepareApi.ListItem[]) ?? [];
}

function openBatchReviewModal(
  status:
    | ReviewKolPrepareApi.Status.APPROVED
    | ReviewKolPrepareApi.Status.REJECTED,
  rows = selectedRows.value,
) {
  if (rows.length === 0) {
    message.warning($t('page.review.kolPrepare.messages.select-records-first'));
    return;
  }

  reviewForm.status = status;
  reviewForm.reason = '';
  reviewTargetRows.value = [...rows];
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  if (reviewSubmitting.value) {
    return;
  }
  reviewModalOpen.value = false;
}

function showReviewFailures(result: ReviewKolPrepareApi.ReviewResultItem[]) {
  const failedItems = result.filter((item) => !item.success);
  if (failedItems.length === 0) {
    return;
  }

  Modal.warning({
    okText: $t('common.confirm'),
    title: $t('page.review.kolPrepare.messages.partial-failed-title'),
    content: h(
      'div',
      { class: 'space-y-2 text-sm leading-6' },
      failedItems.map((item) =>
        h(
          'div',
          { key: item.prepare_id },
          `#${item.prepare_id} ${item.reason || $t('page.review.kolPrepare.messages.unknown-failure')}`,
        ),
      ),
    ),
  });
}

async function submitReview() {
  if (reviewTargetRows.value.length === 0) {
    return;
  }

  try {
    reviewSubmitting.value = true;
    const reason = reviewForm.reason.trim();
    const result = await reviewKolPrepare({
      list: reviewTargetRows.value.map((row) => ({
        prepare_id: row.prepare_id,
        reason: reason || undefined,
        status: reviewForm.status,
      })),
    });

    const successCount = result.filter((item) => item.success).length;
    const failedCount = result.length - successCount;

    if (failedCount === 0) {
      message.success(
        $t('page.review.kolPrepare.messages.review-success', [
          String(successCount),
        ]),
      );
    } else if (successCount === 0) {
      message.warning(
        $t('page.review.kolPrepare.messages.review-all-failed', [
          String(failedCount),
        ]),
      );
    } else {
      message.warning(
        $t('page.review.kolPrepare.messages.review-partial-success', [
          String(successCount),
          String(failedCount),
        ]),
      );
    }

    showReviewFailures(result);
    reviewModalOpen.value = false;
    reviewTargetRows.value = [];
    selectedRows.value = [];
    (gridApi.grid as any)?.clearCheckboxRow?.();
    (gridApi.grid as any)?.clearCheckboxReserve?.();
    await gridApi.query();
  } finally {
    reviewSubmitting.value = false;
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'task_bd_id',
      label: $t('page.review.kolPrepare.filters.task-bd-id'),
    },
    {
      component: 'Input',
      fieldName: 'task_id',
      label: $t('page.review.kolPrepare.filters.task-id'),
    },
    {
      component: 'Select',
      componentProps: () => bdCodeSelectProps.value,
      fieldName: 'bd_code',
      label: $t('page.review.kolPrepare.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.review.kolPrepare.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.kolPrepare.filters.all-status'),
            value: undefined,
          },
          {
            label: getStatusText(0),
            value: 0,
          },
          {
            label: getStatusText(1),
            value: 1,
          },
          {
            label: getStatusText(2),
            value: 2,
          },
          {
            label: getStatusText(3),
            value: 3,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.review.kolPrepare.filters.status'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'entry_time_range',
      label: $t('page.review.kolPrepare.filters.entry-time-range'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<ReviewKolPrepareApi.ListItem> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.review.kolPrepare.columns.bd-code'),
    },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.review.kolPrepare.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 220,
      slots: { default: 'kol_link' },
      title: $t('page.review.kolPrepare.columns.kol-link'),
    },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.review.kolPrepare.columns.product-url'),
    },
    {
      field: 'brief_url',
      minWidth: 120,
      slots: { default: 'brief_url' },
      title: $t('page.review.kolPrepare.columns.brief-url'),
    },
    {
      field: 'entry_time',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: $t('page.review.kolPrepare.columns.entry-time'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.review.kolPrepare.columns.status'),
    },
    {
      field: 'reviewer_name',
      minWidth: 140,
      title: $t('page.review.kolPrepare.columns.reviewer-name'),
    },
    {
      field: 'audit_time',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: $t('page.review.kolPrepare.columns.audit-time'),
    },
    {
      field: 'reason',
      minWidth: 200,
      slots: { default: 'reason' },
      title: $t('page.review.kolPrepare.columns.reason'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'operation' },
      title: $t('page.review.kolPrepare.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const entryTimeRange = resolveDateRange(formValues.entry_time_range);
        const result = await getReviewKolPrepareList({
          bd_code: formValues.bd_code?.trim() || undefined,
          entry_time_end: entryTimeRange.end,
          entry_time_start: entryTimeRange.start,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          status: toOptionalNumber(formValues.status),
          task_bd_id: toOptionalNumber(formValues.task_bd_id),
          task_id: toOptionalNumber(formValues.task_id),
        });

        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'prepare_id',
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
    <Grid :table-title="$t('page.review.kolPrepare.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{
              $t('page.review.kolPrepare.selected-count', [
                String(selectedCount),
              ])
            }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openBatchReviewModal(3)"
          >
            {{ $t('page.review.actions.batch-approve') }}
          </Button>
          <Button
            danger
            :disabled="selectedCount === 0"
            @click="openBatchReviewModal(2)"
          >
            {{ $t('page.review.actions.batch-reject') }}
          </Button>
        </Space>
      </template>

      <template #kol_link="{ row }">
        <a
          :href="row.kol_link"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.kol_link }}
        </a>
      </template>

      <template #product_url="{ row }">
        <a
          v-if="row.product_url"
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
        <span v-else>-</span>
      </template>

      <template #brief_url="{ row }">
        <Button
          type="link"
          size="small"
          :loading="isBriefLoading(row)"
          @click="openBriefPreview(row)"
        >
          {{ $t('page.review.actions.preview-pdf') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #reason="{ row }">
        <span>{{ row.reason || '-' }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openDetail(row)">
            {{ $t('page.review.actions.view') }}
          </Button>
          <Button
            type="link"
            size="small"
            @click="openBatchReviewModal(3, [row])"
          >
            {{ $t('page.review.actions.approve') }}
          </Button>
          <Button
            danger
            type="link"
            size="small"
            @click="openBatchReviewModal(2, [row])"
          >
            {{ $t('page.review.actions.reject') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      :open="reviewModalOpen"
      :confirm-loading="reviewSubmitting"
      :ok-text="
        isRejecting
          ? $t('page.review.actions.confirm-reject')
          : $t('page.review.actions.confirm-approve')
      "
      :cancel-text="$t('common.cancel')"
      :title="reviewModalTitle"
      @cancel="closeReviewModal"
      @ok="submitReview"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <div class="text-sm leading-6 text-muted-foreground">
          {{ reviewModalDescription }}
        </div>

        <div
          v-if="reviewTargetRows.length === 1"
          class="rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6"
        >
          <div>
            {{
              $t('page.review.kolPrepare.review-modal.single-record', [
                String(reviewTargetRows[0]?.prepare_id ?? '-'),
              ])
            }}
          </div>
          <div>
            {{
              $t('page.review.kolPrepare.review-modal.single-kol', [
                reviewTargetRows[0]?.kol_id ?? '-',
              ])
            }}
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.kolPrepare.review-modal.reason-label') }}
          </div>
          <Input.TextArea
            v-model:value="reviewForm.reason"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="500"
            :placeholder="
              isRejecting
                ? $t(
                    'page.review.kolPrepare.review-modal.reject-reason-placeholder',
                  )
                : $t(
                    'page.review.kolPrepare.review-modal.approve-reason-placeholder',
                  )
            "
            show-count
          />
        </div>
      </Space>
    </Modal>
  </Page>
</template>
