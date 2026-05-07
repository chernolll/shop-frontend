<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBriefAccessUrl } from '#/api/core';
import {
  getKolTaskHistory,
  getReviewKolPrepareList,
  reviewKolPrepare,
  ReviewKolPrepareApi,
} from '#/api/review/kol-prepare';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const { componentProps: bdCodeSelectProps } = useAdminBdSelect();

const briefLoadingIds = ref<number[]>([]);
const historyDrawerOpen = ref(false);
const historyLoading = ref(false);
const historyItems = ref<ReviewKolPrepareApi.TaskHistoryItem[]>([]);
const historyKolId = ref('');
const historyTotal = ref(0);
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

function getSopStatusText(status?: number) {
  switch (status) {
    case ReviewKolPrepareApi.SopStatus.COMPLETED: {
      return $t('page.review.kolPrepare.history.sop-status.completed');
    }
    case ReviewKolPrepareApi.SopStatus.CONTACT: {
      return $t('page.review.kolPrepare.history.sop-status.contact');
    }
    case ReviewKolPrepareApi.SopStatus.RECOVER: {
      return $t('page.review.kolPrepare.history.sop-status.recover');
    }
    case ReviewKolPrepareApi.SopStatus.REMITTANCE: {
      return $t('page.review.kolPrepare.history.sop-status.remittance');
    }
    case ReviewKolPrepareApi.SopStatus.SAMPLE: {
      return $t('page.review.kolPrepare.history.sop-status.sample');
    }
    case ReviewKolPrepareApi.SopStatus.TERMINATED: {
      return $t('page.review.kolPrepare.history.sop-status.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getCompletionStatusText(status?: number) {
  switch (status) {
    case ReviewKolPrepareApi.CompletionStatus.COMPLETED: {
      return $t('page.review.kolPrepare.history.completion-status.completed');
    }
    case ReviewKolPrepareApi.CompletionStatus.TERMINATED: {
      return $t('page.review.kolPrepare.history.completion-status.terminated');
    }
    default: {
      return $t('page.review.kolPrepare.history.completion-status.processing');
    }
  }
}

function getCompletionStatusColor(status?: number) {
  switch (status) {
    case ReviewKolPrepareApi.CompletionStatus.COMPLETED: {
      return 'success';
    }
    case ReviewKolPrepareApi.CompletionStatus.TERMINATED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function hasMainSkuInfo(
  row: ReviewKolPrepareApi.ListItem | ReviewKolPrepareApi.TaskHistoryItem,
) {
  return Boolean(
    row.main_sku_code || row.main_sku_name || row.main_sku_status !== undefined,
  );
}

function getMainSkuStatusText(status?: number) {
  return status === 1
    ? $t('page.bd.task-center.product-status.on-sale')
    : $t('page.bd.task-center.product-status.off-shelf');
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

async function openTaskHistory(row: ReviewKolPrepareApi.ListItem) {
  historyKolId.value = row.kol_id;
  historyDrawerOpen.value = true;
  historyLoading.value = true;
  historyItems.value = [];
  historyTotal.value = 0;

  try {
    const result = await getKolTaskHistory({
      kol_id: row.kol_id,
    });
    historyItems.value = result.list;
    historyTotal.value = result.total;
  } finally {
    historyLoading.value = false;
  }
}

function closeHistoryDrawer() {
  historyDrawerOpen.value = false;
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
      fieldName: 'task_code',
      label: $t('page.review.kolPrepare.filters.task-code'),
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
  submitOnChange: false,
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
      field: 'task_code',
      minWidth: 180,
      slots: { default: 'task_code' },
      title: $t('page.review.kolPrepare.columns.task-code'),
    },
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
      field: 'participated_task_count',
      minWidth: 140,
      slots: { default: 'participated_task_count' },
      title: $t('page.review.kolPrepare.columns.participated-task-count'),
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
      minWidth: 160,
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
          task_code: formValues.task_code?.trim() || undefined,
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

      <template #task_code="{ row }">
        <Tooltip v-if="hasMainSkuInfo(row)">
          <template #title>
            <div class="space-y-1">
              <div>
                {{ $t('page.bd.task-center.main-sku.code') }}:
                {{ row.main_sku_code || '-' }}
              </div>
              <div>
                {{ $t('page.bd.task-center.main-sku.name') }}:
                {{ row.main_sku_name || '-' }}
              </div>
              <div>
                {{ $t('page.bd.task-center.main-sku.status') }}:
                {{ getMainSkuStatusText(row.main_sku_status) }}
              </div>
            </div>
          </template>
          <span class="cursor-help text-blue-500 hover:underline">
            {{ row.task_code || '-' }}
          </span>
        </Tooltip>
        <span v-else>{{ row.task_code || '-' }}</span>
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

      <template #participated_task_count="{ row }">
        <Button
          v-if="row.participated_task_count > 0"
          size="small"
          @click="openTaskHistory(row)"
        >
          {{
            $t('page.review.kolPrepare.history.view-count', [
              String(row.participated_task_count),
            ])
          }}
        </Button>
        <span v-else>0</span>
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

    <Drawer
      :open="historyDrawerOpen"
      :title="$t('page.review.kolPrepare.history.title', [historyKolId || '-'])"
      :width="920"
      @close="closeHistoryDrawer"
    >
      <Spin :spinning="historyLoading">
        <div class="mb-4 text-sm text-muted-foreground">
          {{
            $t('page.review.kolPrepare.history.description', [
              String(historyTotal),
            ])
          }}
        </div>

        <Empty
          v-if="!historyLoading && historyItems.length === 0"
          :description="$t('page.review.kolPrepare.history.empty')"
        />

        <Table
          v-else
          :data-source="historyItems"
          :pagination="false"
          row-key="task_bd_id"
          size="small"
        >
          <Table.Column
            key="task_code"
            data-index="task_code"
            :title="$t('page.review.kolPrepare.history.columns.task-code')"
          >
            <template #default="{ record }">
              <Tooltip v-if="hasMainSkuInfo(record)">
                <template #title>
                  <div class="space-y-1">
                    <div>
                      {{ $t('page.bd.task-center.main-sku.code') }}:
                      {{ record.main_sku_code || '-' }}
                    </div>
                    <div>
                      {{ $t('page.bd.task-center.main-sku.name') }}:
                      {{ record.main_sku_name || '-' }}
                    </div>
                    <div>
                      {{ $t('page.bd.task-center.main-sku.status') }}:
                      {{ getMainSkuStatusText(record.main_sku_status) }}
                    </div>
                  </div>
                </template>
                <span class="cursor-help text-blue-500 hover:underline">
                  {{ record.task_code || '-' }}
                </span>
              </Tooltip>
              <span v-else>{{ record.task_code || '-' }}</span>
            </template>
          </Table.Column>
          <Table.Column
            key="sop_status"
            data-index="sop_status"
            :title="$t('page.review.kolPrepare.history.columns.sop-status')"
          >
            <template #default="{ record }">
              <span>{{ getSopStatusText(record.sop_status) }}</span>
            </template>
          </Table.Column>
          <Table.Column
            key="completion_status"
            data-index="completion_status"
            :title="
              $t('page.review.kolPrepare.history.columns.completion-status')
            "
          >
            <template #default="{ record }">
              <Tag :color="getCompletionStatusColor(record.completion_status)">
                {{ getCompletionStatusText(record.completion_status) }}
              </Tag>
            </template>
          </Table.Column>
          <Table.Column
            key="video_urls"
            data-index="video_urls"
            :title="$t('page.review.kolPrepare.history.columns.video-urls')"
          >
            <template #default="{ record }">
              <div
                v-if="record.video_urls?.length"
                class="flex flex-col gap-1 py-1"
              >
                <a
                  v-for="(videoUrl, index) in record.video_urls"
                  :key="`${record.task_bd_id}-${index}`"
                  :href="videoUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="text-blue-500 hover:underline"
                >
                  {{ videoUrl }}
                </a>
              </div>
              <span v-else>-</span>
            </template>
          </Table.Column>
        </Table>
      </Spin>
    </Drawer>
  </Page>
</template>
