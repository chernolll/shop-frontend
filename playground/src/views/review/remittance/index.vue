<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Upload,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getFileUploadUrl, registerUploadedFile } from '#/api/core';
import {
  getReviewRemittanceDetail,
  getReviewRemittanceList,
  reviewRemittance,
  ReviewRemittanceApi,
} from '#/api/review/remittance';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

type ReviewModalMode = 'payment' | 'review';

const selectedRows = ref<ReviewRemittanceApi.ListItem[]>([]);
const { componentProps: bdCodeSelectProps } = useAdminBdSelect();
const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailError = ref('');
const detailDrawerOpen = ref(false);
const detailAutoReloaded = ref(false);
const selectedRemittanceId = ref<null | number>(null);
const remittanceDetail = ref<null | ReviewRemittanceApi.DetailResult>(null);

const reviewModalOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewModalMode = ref<ReviewModalMode>('review');
const reviewTargetRows = ref<ReviewRemittanceApi.ListItem[]>([]);
const uploadFileList = ref<UploadFile[]>([]);
const previewModalOpen = ref(false);
const previewImageSrc = ref('');
const previewImageTitle = ref('');

const reviewForm = reactive<{
  amount: number | undefined;
  review_remark: string;
  status:
    | ReviewRemittanceApi.RemittanceStatus.ABANDONED
    | ReviewRemittanceApi.RemittanceStatus.APPROVED
    | ReviewRemittanceApi.RemittanceStatus.REJECTED
    | undefined;
}>({
  amount: undefined,
  review_remark: '',
  status: ReviewRemittanceApi.RemittanceStatus.APPROVED,
});

const allowedUploadMimeTypes = new Set(['image/jpeg', 'image/png']);
const allowedUploadNamePattern = /\.(jpe?g|png)$/i;

const selectedCount = computed(() => selectedRows.value.length);
const isBatchMode = computed(() => reviewTargetRows.value.length > 1);
const isPaymentMode = computed(() => reviewModalMode.value === 'payment');
const canEditAmount = computed(
  () => !isBatchMode.value && !isPaymentMode.value,
);
const showUploadField = computed(() => !isBatchMode.value);
const reviewModalTitle = computed(() => {
  if (isPaymentMode.value) {
    return $t('page.review.remittance.payment-modal.title');
  }
  return isBatchMode.value
    ? $t('page.review.remittance.review-modal.batch-title')
    : $t('page.review.remittance.review-modal.single-title');
});

const paymentStatusOptions = [
  {
    label: $t('page.review.remittance.status.approved'),
    value: ReviewRemittanceApi.RemittanceStatus.APPROVED,
  },
  {
    label: $t('page.review.remittance.status.rejected'),
    value: ReviewRemittanceApi.RemittanceStatus.REJECTED,
  },
  {
    label: $t('page.review.remittance.status.abandoned'),
    value: ReviewRemittanceApi.RemittanceStatus.ABANDONED,
  },
];

function formatAmount(value?: null | number) {
  return value === null || value === undefined ? '-' : String(value);
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getBudgetText(value?: 0 | 1) {
  return value === 1
    ? $t('page.review.remittance.budget.yes')
    : $t('page.review.remittance.budget.no');
}

function getBudgetColor(value?: 0 | 1) {
  return value === 1 ? 'blue' : 'default';
}

function getSopStatusText(status?: number) {
  switch (status) {
    case ReviewRemittanceApi.SopStatus.COMPLETED: {
      return $t('page.review.remittance.sop-status.completed');
    }
    case ReviewRemittanceApi.SopStatus.CONTACT: {
      return $t('page.review.remittance.sop-status.contact');
    }
    case ReviewRemittanceApi.SopStatus.RECOVER: {
      return $t('page.review.remittance.sop-status.recover');
    }
    case ReviewRemittanceApi.SopStatus.REMITTANCE: {
      return $t('page.review.remittance.sop-status.remittance');
    }
    case ReviewRemittanceApi.SopStatus.SAMPLE: {
      return $t('page.review.remittance.sop-status.sample');
    }
    case ReviewRemittanceApi.SopStatus.TERMINATED: {
      return $t('page.review.remittance.sop-status.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case ReviewRemittanceApi.SopStatus.COMPLETED: {
      return 'success';
    }
    case ReviewRemittanceApi.SopStatus.CONTACT: {
      return 'default';
    }
    case ReviewRemittanceApi.SopStatus.RECOVER: {
      return 'warning';
    }
    case ReviewRemittanceApi.SopStatus.REMITTANCE: {
      return 'processing';
    }
    case ReviewRemittanceApi.SopStatus.SAMPLE: {
      return 'processing';
    }
    case ReviewRemittanceApi.SopStatus.TERMINATED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function getRemittanceStatusText(status?: number) {
  switch (status) {
    case ReviewRemittanceApi.RemittanceStatus.ABANDONED: {
      return $t('page.review.remittance.status.abandoned');
    }
    case ReviewRemittanceApi.RemittanceStatus.APPROVED: {
      return $t('page.review.remittance.status.approved');
    }
    case ReviewRemittanceApi.RemittanceStatus.REJECTED: {
      return $t('page.review.remittance.status.rejected');
    }
    default: {
      return $t('page.review.remittance.status.pending');
    }
  }
}

function getRemittanceStatusColor(status?: number) {
  switch (status) {
    case ReviewRemittanceApi.RemittanceStatus.ABANDONED: {
      return 'default';
    }
    case ReviewRemittanceApi.RemittanceStatus.APPROVED: {
      return 'success';
    }
    case ReviewRemittanceApi.RemittanceStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function extractErrorMessage(error: any, fallbackKey: string) {
  return (
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    $t(fallbackKey)
  );
}

function syncSelectedRows() {
  selectedRows.value =
    ((
      gridApi.grid as any
    )?.getCheckboxRecords?.() as ReviewRemittanceApi.ListItem[]) ?? [];
}

function clearSelections() {
  selectedRows.value = [];
  (gridApi.grid as any)?.clearCheckboxRow?.();
  (gridApi.grid as any)?.clearCheckboxReserve?.();
}

function isAllowedUploadFile(file: File | UploadFile) {
  const fileName = 'name' in file ? (file.name ?? '') : '';
  const fileType = 'type' in file ? (file.type ?? '') : '';
  return (
    allowedUploadMimeTypes.has(fileType) ||
    allowedUploadNamePattern.test(fileName)
  );
}

function validateUploadFile(file: File | UploadFile) {
  if (isAllowedUploadFile(file)) {
    return false;
  }
  message.warning($t('page.review.remittance.messages.upload-type-invalid'));
  return Upload.LIST_IGNORE;
}

function handleUploadChange(event: UploadChangeParam) {
  uploadFileList.value = event.fileList.slice(0, 9);
}

function closePreviewModal() {
  previewModalOpen.value = false;
}

function openImagePreview(imageSrc: string, title?: string) {
  previewImageSrc.value = imageSrc;
  previewImageTitle.value = title ?? '';
  previewModalOpen.value = true;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    // eslint-disable-next-line unicorn/prefer-add-event-listener
    reader.onerror = () => reject(new Error('file_preview_failed'));
    reader.readAsDataURL(file);
  });
}

async function handleUploadPreview(file: UploadFile) {
  const previewUrl =
    file.url ??
    file.thumbUrl ??
    (typeof file.preview === 'string' ? file.preview : undefined);

  if (previewUrl) {
    openImagePreview(previewUrl, file.name);
    return;
  }

  if (file.originFileObj) {
    const preview = await fileToDataUrl(file.originFileObj as File);
    file.preview = preview;
    openImagePreview(preview, file.name);
  }
}

function resetReviewForm() {
  reviewForm.amount = undefined;
  reviewForm.review_remark = '';
  reviewForm.status = ReviewRemittanceApi.RemittanceStatus.APPROVED;
  uploadFileList.value = [];
}

function seedReviewForm(row?: ReviewRemittanceApi.ListItem) {
  reviewForm.amount = row?.amount ? Number(row.amount) : undefined;
  reviewForm.review_remark = row?.review_remark ?? '';
  reviewForm.status = ReviewRemittanceApi.RemittanceStatus.APPROVED;
  uploadFileList.value = [];
}

function openReviewModal(mode: ReviewModalMode, rows = selectedRows.value) {
  if (rows.length === 0) {
    message.warning($t('page.review.remittance.messages.select-records-first'));
    return;
  }

  reviewModalMode.value = mode;
  reviewTargetRows.value = [...rows];
  resetReviewForm();
  if (rows.length === 1) {
    seedReviewForm(rows[0]);
  }
  if (mode === 'payment') {
    reviewForm.status = undefined;
  }
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  if (reviewSubmitting.value) {
    return;
  }
  reviewModalOpen.value = false;
}

async function loadRemittanceDetail(remittanceId: number) {
  try {
    detailLoading.value = true;
    detailError.value = '';
    remittanceDetail.value = await getReviewRemittanceDetail({
      remittance_id: remittanceId,
    });
    detailAutoReloaded.value = false;
  } catch (error) {
    remittanceDetail.value = null;
    detailError.value = extractErrorMessage(
      error,
      'page.review.remittance.messages.detail-load-failed',
    );
  } finally {
    detailLoaded.value = true;
    detailLoading.value = false;
  }
}

async function openDetailDrawer(remittanceId: number) {
  selectedRemittanceId.value = remittanceId;
  detailDrawerOpen.value = true;
  detailLoaded.value = false;
  await loadRemittanceDetail(remittanceId);
}

function closeDetailDrawer() {
  detailDrawerOpen.value = false;
}

async function uploadPaymentAttachment(file: UploadFile) {
  const rawFile = file.originFileObj;
  if (!rawFile) {
    throw new Error($t('page.review.remittance.messages.upload-file-invalid'));
  }

  uploadFileList.value = uploadFileList.value.map((item) =>
    item.uid === file.uid ? { ...item, percent: 0, status: 'uploading' } : item,
  );

  const uploadData = await getFileUploadUrl({
    biz_type: 'remittance-images',
    content_type: rawFile.type || 'application/octet-stream',
    file_name: rawFile.name,
  });

  const response = await fetch(uploadData.upload_url, {
    body: rawFile,
    headers: uploadData.headers,
    method: uploadData.method || 'PUT',
  });

  if (!response.ok) {
    throw new Error($t('page.review.remittance.messages.upload-failed'));
  }

  const registeredFile = await registerUploadedFile({
    file_key: uploadData.file_key,
    file_name: uploadData.file_name,
  });

  uploadFileList.value = uploadFileList.value.map((item) =>
    item.uid === file.uid ? { ...item, percent: 100, status: 'done' } : item,
  );

  return registeredFile.id;
}

async function uploadPaymentAttachments() {
  const fileIds: number[] = [];

  for (const file of uploadFileList.value) {
    try {
      fileIds.push(await uploadPaymentAttachment(file));
    } catch (error) {
      uploadFileList.value = uploadFileList.value.map((item) =>
        item.uid === file.uid ? { ...item, percent: 0, status: 'error' } : item,
      );
      throw error;
    }
  }

  return fileIds;
}

function showReviewFailures(result: ReviewRemittanceApi.ReviewResultItem[]) {
  const failedItems = result.filter((item) => !item.success);
  if (failedItems.length === 0) {
    return;
  }

  Modal.warning({
    okText: $t('common.confirm'),
    title: $t('page.review.remittance.messages.partial-failed-title'),
    content: h(
      'div',
      { class: 'space-y-2 text-sm leading-6' },
      failedItems.map((item) =>
        h(
          'div',
          { key: item.remittance_id },
          `#${item.remittance_id} ${item.reason || $t('page.review.remittance.messages.unknown-failure')}`,
        ),
      ),
    ),
  });
}

async function submitReview() {
  if (reviewTargetRows.value.length === 0) {
    return;
  }

  if (!isPaymentMode.value && reviewForm.status === undefined) {
    message.warning($t('page.review.remittance.messages.status-required'));
    return;
  }

  if (canEditAmount.value) {
    const amount = Number(reviewForm.amount ?? 0);
    if (
      reviewForm.amount !== undefined &&
      (!Number.isFinite(amount) || amount <= 0)
    ) {
      message.warning($t('page.review.remittance.messages.amount-required'));
      return;
    }
  }

  if (isPaymentMode.value && uploadFileList.value.length === 0) {
    message.warning($t('page.review.remittance.messages.upload-required'));
    return;
  }

  try {
    reviewSubmitting.value = true;
    const shouldUploadPaymentAttachments =
      uploadFileList.value.length > 0 ||
      (isPaymentMode.value && showUploadField.value);
    const paymentAttachmentFileIds = shouldUploadPaymentAttachments
      ? await uploadPaymentAttachments()
      : undefined;

    const result = await reviewRemittance({
      list: reviewTargetRows.value.map((row) => ({
        amount: canEditAmount.value ? reviewForm.amount : undefined,
        payment_attachment_file_ids: shouldUploadPaymentAttachments
          ? paymentAttachmentFileIds
          : undefined,
        remittance_id: row.remittance_id,
        review_remark: reviewForm.review_remark,
        status: isPaymentMode.value
          ? undefined
          : (reviewForm.status ?? undefined),
      })),
    });

    const successCount = result.filter((item) => item.success).length;
    const failedCount = result.length - successCount;

    if (failedCount === 0) {
      message.success(
        $t('page.review.remittance.messages.review-success', [
          String(successCount),
        ]),
      );
    } else if (successCount === 0) {
      message.warning(
        $t('page.review.remittance.messages.review-all-failed', [
          String(failedCount),
        ]),
      );
    } else {
      message.warning(
        $t('page.review.remittance.messages.review-partial-success', [
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

    if (detailDrawerOpen.value && selectedRemittanceId.value) {
      await loadRemittanceDetail(selectedRemittanceId.value);
    }
  } finally {
    reviewSubmitting.value = false;
  }
}

async function handleAttachmentImageError() {
  if (
    detailLoading.value ||
    !selectedRemittanceId.value ||
    detailAutoReloaded.value
  ) {
    return;
  }

  detailAutoReloaded.value = true;
  await loadRemittanceDetail(selectedRemittanceId.value);
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Select',
      componentProps: () => bdCodeSelectProps.value,
      fieldName: 'bd_code',
      label: $t('page.review.remittance.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.review.remittance.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.remittance.filters.all-status'),
            value: undefined,
          },
          {
            label: getRemittanceStatusText(
              ReviewRemittanceApi.RemittanceStatus.PENDING,
            ),
            value: ReviewRemittanceApi.RemittanceStatus.PENDING,
          },
          {
            label: getRemittanceStatusText(
              ReviewRemittanceApi.RemittanceStatus.APPROVED,
            ),
            value: ReviewRemittanceApi.RemittanceStatus.APPROVED,
          },
          {
            label: getRemittanceStatusText(
              ReviewRemittanceApi.RemittanceStatus.REJECTED,
            ),
            value: ReviewRemittanceApi.RemittanceStatus.REJECTED,
          },
          {
            label: getRemittanceStatusText(
              ReviewRemittanceApi.RemittanceStatus.ABANDONED,
            ),
            value: ReviewRemittanceApi.RemittanceStatus.ABANDONED,
          },
        ],
      },
      fieldName: 'status',
      label: $t('page.review.remittance.filters.status'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'submit_time_range',
      label: $t('page.review.remittance.filters.submit-time-range'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<ReviewRemittanceApi.ListItem> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.review.remittance.columns.product-url'),
    },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.review.remittance.columns.bd-code'),
    },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.review.remittance.columns.kol-id'),
    },
    {
      field: 'has_budget',
      minWidth: 110,
      slots: { default: 'has_budget' },
      title: $t('page.review.remittance.columns.has-budget'),
    },
    {
      field: 'default_amount',
      minWidth: 120,
      slots: { default: 'default_amount' },
      title: $t('page.review.remittance.columns.default-amount'),
    },
    {
      field: 'sop_status',
      minWidth: 120,
      slots: { default: 'sop_status' },
      title: $t('page.review.remittance.columns.sop-status'),
    },
    {
      field: 'amount',
      minWidth: 120,
      slots: { default: 'amount' },
      title: $t('page.review.remittance.columns.amount'),
    },
    {
      field: 'payee_name',
      minWidth: 120,
      title: $t('page.review.remittance.columns.payee-name'),
    },
    {
      field: 'bank_name',
      minWidth: 140,
      title: $t('page.review.remittance.columns.bank-name'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.review.remittance.columns.status'),
    },
    {
      field: 'review_remark',
      minWidth: 180,
      slots: { default: 'review_remark' },
      title: $t('page.review.remittance.columns.review-remark'),
    },
    {
      field: 'submitter_name',
      minWidth: 120,
      title: $t('page.review.remittance.columns.submitter-name'),
    },
    {
      field: 'reviewer_name',
      minWidth: 120,
      title: $t('page.review.remittance.columns.reviewer-name'),
    },
    {
      field: 'submit_at',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: $t('page.review.remittance.columns.submit-at'),
    },
    {
      field: 'reviewed_at',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: $t('page.review.remittance.columns.reviewed-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'operation' },
      title: $t('page.review.remittance.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const submitTimeRange = resolveDateRange(formValues.submit_time_range);
        const result = await getReviewRemittanceList({
          bd_code: formValues.bd_code?.trim() || undefined,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          product_listing_id: toOptionalNumber(formValues.product_listing_id),
          status: toOptionalNumber(formValues.status),
          submit_time_end: submitTimeRange.end,
          submit_time_start: submitTimeRange.start,
          task_bd_id: toOptionalNumber(formValues.task_bd_id),
          task_id: toOptionalNumber(formValues.task_id),
          task_sop_id: toOptionalNumber(formValues.task_sop_id),
        });
        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'remittance_id',
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
    <Grid :table-title="$t('page.review.remittance.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{
              $t('page.review.remittance.selected-count', [
                String(selectedCount),
              ])
            }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openReviewModal('review')"
          >
            {{ $t('page.review.remittance.actions.batch-review') }}
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

      <template #has_budget="{ row }">
        <Tag :color="getBudgetColor(row.has_budget)">
          {{ getBudgetText(row.has_budget) }}
        </Tag>
      </template>

      <template #default_amount="{ row }">
        <span>{{ formatAmount(row.default_amount) }}</span>
      </template>

      <template #sop_status="{ row }">
        <Tag :color="getSopStatusColor(row.sop_status)">
          {{ getSopStatusText(row.sop_status) }}
        </Tag>
      </template>

      <template #amount="{ row }">
        <span>{{ formatAmount(row.amount) }}</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getRemittanceStatusColor(row.status)">
          {{ getRemittanceStatusText(row.status) }}
        </Tag>
      </template>

      <template #review_remark="{ row }">
        <span>{{ row.review_remark || '-' }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button
            type="link"
            size="small"
            @click="openDetailDrawer(row.remittance_id)"
          >
            {{ $t('page.review.remittance.actions.view') }}
          </Button>
          <Button
            type="link"
            size="small"
            @click="openReviewModal('review', [row])"
          >
            {{ $t('page.review.remittance.actions.review') }}
          </Button>
          <Button
            type="link"
            size="small"
            @click="openReviewModal('payment', [row])"
          >
            {{ $t('page.review.remittance.actions.update-payment') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Drawer
      :open="detailDrawerOpen"
      :title="$t('page.review.remittance.detail.title')"
      :width="760"
      @close="closeDetailDrawer"
    >
      <Spin :spinning="detailLoading">
        <Space direction="vertical" :size="16" class="w-full">
          <Alert
            v-if="detailError"
            show-icon
            type="warning"
            :message="$t('page.review.remittance.messages.detail-load-failed')"
            :description="detailError"
            class="rounded-xl"
          />

          <template v-if="remittanceDetail">
            <Space wrap>
              <Tag :color="getRemittanceStatusColor(remittanceDetail.status)">
                {{ getRemittanceStatusText(remittanceDetail.status) }}
              </Tag>
              <Tag :color="getSopStatusColor(remittanceDetail.sop_status)">
                {{ getSopStatusText(remittanceDetail.sop_status) }}
              </Tag>
              <Tag :color="getBudgetColor(remittanceDetail.has_budget)">
                {{ getBudgetText(remittanceDetail.has_budget) }}
              </Tag>
            </Space>

            <Descriptions bordered size="small" :column="1">
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.product-url')"
              >
                <a
                  :href="remittanceDetail.product_url"
                  target="_blank"
                  rel="noreferrer"
                  class="break-all text-blue-500 hover:underline"
                >
                  {{ remittanceDetail.product_url }}
                </a>
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.bd-code')"
              >
                {{ remittanceDetail.bd_code }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.kol-id')"
              >
                {{ remittanceDetail.kol_id }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.default-amount')"
              >
                {{ formatAmount(remittanceDetail.default_amount) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.amount')"
              >
                {{ formatAmount(remittanceDetail.amount) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.payee-name')"
              >
                {{ remittanceDetail.payee_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.bank-name')"
              >
                {{ remittanceDetail.bank_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.detail.bank-card-no')"
              >
                <span class="break-all">
                  {{ remittanceDetail.bank_card_no || '-' }}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.submitter-name')"
              >
                {{ remittanceDetail.submitter_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.reviewer-name')"
              >
                {{ remittanceDetail.reviewer_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.submit-at')"
              >
                {{ formatTimestamp(remittanceDetail.submit_at) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.review.remittance.columns.reviewed-at')"
              >
                {{ formatTimestamp(remittanceDetail.reviewed_at) }}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{ $t('page.review.remittance.detail.review-remark') }}
                </span>
              </template>
              <div class="break-words text-sm leading-6 text-muted-foreground">
                {{ remittanceDetail.review_remark || '-' }}
              </div>
            </Card>

            <Card
              v-if="remittanceDetail.terminate_remark"
              size="small"
              class="rounded-2xl border border-border"
            >
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{ $t('page.review.remittance.detail.terminate-remark') }}
                </span>
              </template>
              <div class="break-words text-sm leading-6 text-muted-foreground">
                {{ remittanceDetail.terminate_remark }}
              </div>
            </Card>

            <Alert
              show-icon
              type="info"
              :message="
                $t('page.review.remittance.detail.attachment-tip-title')
              "
              :description="
                $t('page.review.remittance.detail.attachment-tip-content')
              "
              class="rounded-xl"
            />

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{ $t('page.review.remittance.detail.chat-attachments') }}
                </span>
              </template>
              <div
                v-if="remittanceDetail.chat_attachments.length > 0"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div
                  v-for="attachment in remittanceDetail.chat_attachments"
                  :key="attachment.r2_file_id"
                  class="rounded-xl border border-border p-3"
                >
                  <Image
                    :alt="attachment.file_name"
                    :src="attachment.access_url"
                    class="h-40 w-full rounded-lg object-cover"
                    @error="handleAttachmentImageError"
                    @click="
                      openImagePreview(
                        attachment.access_url,
                        attachment.file_name,
                      )
                    "
                  />
                  <div class="mt-3 text-sm font-medium text-foreground">
                    {{ attachment.file_name }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ formatTimestamp(attachment.access_url_expired_at) }}
                  </div>
                </div>
              </div>
              <Empty
                v-else
                :description="$t('page.review.remittance.detail.chat-empty')"
              />
            </Card>

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{ $t('page.review.remittance.detail.payment-attachments') }}
                </span>
              </template>
              <div
                v-if="remittanceDetail.payment_attachments.length > 0"
                class="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div
                  v-for="attachment in remittanceDetail.payment_attachments"
                  :key="attachment.r2_file_id"
                  class="rounded-xl border border-border p-3"
                >
                  <Image
                    :alt="attachment.file_name"
                    :src="attachment.access_url"
                    class="h-40 w-full rounded-lg object-cover"
                    @error="handleAttachmentImageError"
                    @click="
                      openImagePreview(
                        attachment.access_url,
                        attachment.file_name,
                      )
                    "
                  />
                  <div class="mt-3 text-sm font-medium text-foreground">
                    {{ attachment.file_name }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ formatTimestamp(attachment.access_url_expired_at) }}
                  </div>
                </div>
              </div>
              <Empty
                v-else
                :description="$t('page.review.remittance.detail.payment-empty')"
              />
            </Card>

            <Space wrap>
              <Button
                type="primary"
                @click="openReviewModal('review', [remittanceDetail as any])"
              >
                {{ $t('page.review.remittance.actions.review') }}
              </Button>
              <Button
                @click="openReviewModal('payment', [remittanceDetail as any])"
              >
                {{ $t('page.review.remittance.actions.update-payment') }}
              </Button>
            </Space>
          </template>

          <Empty
            v-else-if="detailLoaded"
            :description="$t('page.review.remittance.messages.detail-empty')"
          />
        </Space>
      </Spin>
    </Drawer>

    <Modal
      :open="reviewModalOpen"
      :confirm-loading="reviewSubmitting"
      :ok-text="$t('page.review.remittance.actions.confirm-submit')"
      :cancel-text="$t('common.cancel')"
      :title="reviewModalTitle"
      @cancel="closeReviewModal"
      @ok="submitReview"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <div class="text-sm leading-6 text-muted-foreground">
          {{
            isPaymentMode
              ? $t('page.review.remittance.payment-modal.description', [
                  String(reviewTargetRows.length),
                ])
              : $t('page.review.remittance.review-modal.description', [
                  String(reviewTargetRows.length),
                ])
          }}
        </div>

        <div class="space-y-2" v-if="!isPaymentMode">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.remittance.review-modal.status-label') }}
          </div>
          <Select
            v-model:value="reviewForm.status"
            class="w-full"
            :options="paymentStatusOptions"
          />
        </div>

        <div class="space-y-2" v-if="canEditAmount">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.remittance.columns.amount') }}
          </div>
          <InputNumber
            v-model:value="reviewForm.amount"
            :min="0"
            :precision="2"
            class="w-full"
            :placeholder="
              $t('page.review.remittance.review-modal.amount-placeholder')
            "
          />
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.remittance.review-modal.review-remark-label') }}
          </div>
          <Input.TextArea
            v-model:value="reviewForm.review_remark"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            :maxlength="500"
            :placeholder="
              $t(
                'page.review.remittance.review-modal.review-remark-placeholder',
              )
            "
            show-count
          />
        </div>

        <div class="space-y-2" v-if="showUploadField">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.review.remittance.payment-modal.attachments-label') }}
          </div>
          <Upload
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            :before-upload="validateUploadFile"
            :file-list="uploadFileList"
            list-type="picture-card"
            multiple
            @change="handleUploadChange"
            @preview="handleUploadPreview"
          >
            <div class="px-2 text-xs leading-5 text-muted-foreground">
              {{ $t('page.review.remittance.payment-modal.upload-button') }}
            </div>
          </Upload>
          <div class="text-xs leading-5 text-muted-foreground">
            {{ $t('page.review.remittance.payment-modal.upload-helper') }}
          </div>
        </div>
      </Space>
    </Modal>

    <Modal
      :footer="null"
      :open="previewModalOpen"
      :title="previewImageTitle"
      width="720px"
      @cancel="closePreviewModal"
    >
      <div class="flex justify-center">
        <Image
          :preview="false"
          :src="previewImageSrc"
          class="max-h-[70vh] max-w-full object-contain"
        />
      </div>
    </Modal>
  </Page>
</template>
