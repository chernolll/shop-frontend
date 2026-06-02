<script lang="ts" setup>
import type { UploadChangeParam, UploadFile } from 'ant-design-vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  FormItem,
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

function formatOptionalText(value?: null | string) {
  const normalizedValue = value?.trim();
  return normalizedValue ?? '-';
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
    case ReviewRemittanceApi.RemittanceStatus.PENDING: {
      return $t('page.review.remittance.status.pending');
    }
    case ReviewRemittanceApi.RemittanceStatus.REJECTED: {
      return $t('page.review.remittance.status.rejected');
    }
    default: {
      return '-';
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
    case ReviewRemittanceApi.RemittanceStatus.PENDING: {
      return 'processing';
    }
    case ReviewRemittanceApi.RemittanceStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function canReviewRow(row: ReviewRemittanceApi.ListItem): boolean {
  return (
    row.status === ReviewRemittanceApi.RemittanceStatus.PENDING &&
    row.sop_status !== ReviewRemittanceApi.SopStatus.TERMINATED
  );
}

function canPaymentRow(row: ReviewRemittanceApi.ListItem): boolean {
  return (
    row.status === ReviewRemittanceApi.RemittanceStatus.APPROVED &&
    (row.payment_status === undefined ||
      row.payment_status === ReviewRemittanceApi.ApprovalStatus.UNAPPROVED)
  );
}

function syncSelectedRows() {
  selectedRows.value =
    gridApi.grid.getCheckboxRecords() as ReviewRemittanceApi.ListItem[];
}

async function handleReview(
  action: 'payment' | 'review',
  callback: () => void,
) {
  if (reviewSubmitting.value) {
    return;
  }
  try {
    reviewSubmitting.value = true;
    const list: ReviewRemittanceApi.ReviewItem[] = reviewTargetRows.value.map(
      (row) => {
        const base: ReviewRemittanceApi.ReviewItem = {
          reason: reviewForm.review_remark?.trim() || undefined,
          remittance_id: row.remittance_id,
        };
        if (action === 'review') {
          base.status = reviewForm.status;
          base.amount = reviewForm.amount;
        }
        return base;
      },
    );
    await reviewRemittance({ list });
    message.success(
      $t('page.review.remittance.messages.review-success', [
        String(list.length),
      ]),
    );
    callback();
    reviewTargetRows.value = [];
    reviewModalOpen.value = false;
    reviewSubmitting.value = false;
    await gridApi.query();
  } catch (error: any) {
    reviewSubmitting.value = false;
    console.error('审核汇款失败:', error);
    message.error($t('page.review.remittance.messages.review-failed'));
  }
}

function openReviewModal(
  mode: ReviewModalMode,
  row?: ReviewRemittanceApi.ListItem,
) {
  if (reviewModalOpen.value) {
    return;
  }
  reviewForm.amount = undefined;
  reviewForm.review_remark = '';
  reviewForm.status = ReviewRemittanceApi.RemittanceStatus.APPROVED;
  reviewModalMode.value = mode;
  uploadFileList.value = [];
  reviewTargetRows.value = row ? [row] : [...selectedRows.value];
  reviewModalOpen.value = true;
}

function openPaymentModal(row: ReviewRemittanceApi.ListItem) {
  openReviewModal('payment', row);
}

async function openDetailDrawer(remittanceId: number) {
  selectedRemittanceId.value = remittanceId;
  detailLoading.value = true;
  detailError.value = '';
  detailDrawerOpen.value = true;
  detailAutoReloaded.value = false;
  try {
    const result = await getReviewRemittanceDetail({
      remittance_id: remittanceId,
    });
    remittanceDetail.value = result;
  } catch (error: any) {
    detailError.value =
      error?.message || $t('page.review.remittance.messages.detail-load-error');
  } finally {
    detailLoading.value = false;
    detailLoaded.value = true;
  }
}

function handlePreviewImage(url: string, title: string) {
  previewImageSrc.value = url;
  previewImageTitle.value = title;
  previewModalOpen.value = true;
}

async function beforeUpload(file: UploadFile) {
  const isValidMime = allowedUploadMimeTypes.has(file.type as string);
  const isValidName = allowedUploadNamePattern.test(file.name || '');
  if (!isValidMime || !isValidName) {
    message.error($t('page.review.remittance.messages.payment-upload-limit'));
    return Upload.LIST_IGNORE;
  }
  return true;
}

async function handleUploadChange(info: UploadChangeParam) {
  const { file } = info;
  if (file.status === 'uploading') {
    return;
  }
  if (
    (file.status === 'error' || file.status === 'done') &&
    file.response?.data?.url
  ) {
    file.url = file.response.data.url;
  }
}

async function handleCustomRequest(options: any) {
  const { file, onSuccess, onError } = options;
  try {
    const uploadUrlResult = await getFileUploadUrl({
      file_name: file.name,
      content_type: file.type,
    });
    const { upload_url, access_url } = uploadUrlResult;
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
    await registerUploadedFile({ url: access_url } as any);
    onSuccess({ url: access_url }, file);
  } catch (error: any) {
    onError(error);
  }
}

const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Select',
      componentProps: () => ({
        ...bdCodeSelectProps.value,
        mode: 'multiple' as const,
      }),
      fieldName: 'bd_code',
      label: $t('page.review.remittance.columns.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.review.remittance.columns.kol-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.remittance.status.pending'),
            value: ReviewRemittanceApi.RemittanceStatus.PENDING,
          },
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
        ],
      },
      fieldName: 'status',
      label: $t('page.review.remittance.columns.status'),
    },
    {
      component: 'RangePicker',
      fieldName: 'submit_time_range',
      label: $t('page.review.remittance.columns.submit-at'),
    },
  ],
  wrapperClass: 'grid-cols-1 lg:grid-cols-3',
  resetButtonOptions: {
    content: $t('common.reset'),
  },
  submitButtonOptions: {
    content: $t('common.search'),
  },
};

const gridOptions: VxeTableGridOptions<ReviewRemittanceApi.ListItem> = {
  stripe: true,
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
      title: $t('page.review.remittance.columns.task-code'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.review.remittance.columns.created-at'),
    },
    {
      field: 'payment_attachments',
      minWidth: 180,
      slots: { default: 'payment_attachments' },
      title: $t('page.review.remittance.columns.payment-attachments'),
    },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.review.remittance.columns.kol-id'),
    },
    {
      field: 'remark',
      minWidth: 180,
      slots: { default: 'remark' },
      title: $t('page.review.remittance.columns.remark'),
    },
    {
      field: 'kol_link',
      minWidth: 180,
      slots: { default: 'kol_link' },
      title: $t('page.review.remittance.columns.kol-link'),
    },
    {
      field: 'influencer_fee',
      minWidth: 140,
      slots: { default: 'influencer_fee' },
      title: $t('page.review.remittance.columns.influencer-fee'),
    },
    {
      field: 'video_url',
      minWidth: 180,
      slots: { default: 'video_url' },
      title: $t('page.review.remittance.columns.video-url'),
    },
    {
      field: 'video_ads_code',
      minWidth: 160,
      slots: { default: 'video_ads_code' },
      title: $t('page.review.remittance.columns.video-ads-code'),
    },
    {
      field: 'chat_attachments',
      minWidth: 180,
      slots: { default: 'chat_attachments' },
      title: $t('page.review.remittance.columns.chat-attachments'),
    },
    {
      field: 'bank_card_no',
      minWidth: 200,
      slots: { default: 'bank_card_no' },
      title: $t('page.review.remittance.columns.bank-card-no'),
    },
    {
      field: 'has_budget',
      minWidth: 100,
      slots: { default: 'has_budget' },
      title: $t('page.review.remittance.columns.has-budget'),
    },
    {
      field: 'default_amount',
      minWidth: 130,
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
      minWidth: 130,
      slots: { default: 'amount' },
      title: $t('page.review.remittance.columns.amount'),
    },
    {
      field: 'status',
      minWidth: 100,
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
          bd_code: Array.isArray(formValues.bd_code)
            ? formValues.bd_code.join(',')
            : formValues.bd_code?.trim() || undefined,
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
    isHover: true,
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
          class="cursor-pointer text-blue-500 hover:underline"
        ></a>
      </template>

      <template #task_code="{ row }">
        <span class="font-mono text-xs">{{ row.task_code }}</span>
      </template>

      <template #created_at="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatTimestamp(row.created_at) }}
        </span>
      </template>

      <template #payment_attachments="{ row }">
        <span
          v-if="!row.payment_attachments?.length"
          class="text-xs text-muted-foreground"
          >-</span>
        <Space v-else wrap :size="4">
          <Image
            v-for="(item, idx) in row.payment_attachments"
            :key="idx"
            :height="40"
            :src="item.access_url"
            :preview="{
              mask: $t('page.review.remittance.actions.preview'),
            }"
            alt="payment"
            class="cursor-pointer rounded"
            fallback="data:image/svg+xml,%3Csvg viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3EIMG%3C/text%3E%3C/svg%3E"
            @click="handlePreviewImage(item.access_url, `payment-${idx + 1}`)"
          />
        </Space>
      </template>

      <template #remark="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatOptionalText(row.remark) }}
        </span>
      </template>

      <template #kol_link="{ row }">
        <a
          :href="row.kol_link"
          target="_blank"
          rel="noreferrer"
          class="cursor-pointer text-blue-500 hover:underline"
        >
          {{ row.kol_id }}
        </a>
      </template>

      <template #influencer_fee="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatAmount(row.influencer_fee) }}
        </span>
      </template>

      <template #video_url="{ row }">
        <a
          :href="row.video_url"
          target="_blank"
          rel="noreferrer"
          class="cursor-pointer text-blue-500 hover:underline"
        >
          {{ $t('page.review.remittance.columns.video-url') }}
        </a>
      </template>

      <template #video_ads_code="{ row }">
        <span class="font-mono text-xs">{{
          formatOptionalText(row.video_ads_code)
        }}</span>
      </template>

      <template #chat_attachments="{ row }">
        <span
          v-if="!row.chat_attachments?.length"
          class="text-xs text-muted-foreground"
          >-</span>
        <Space v-else wrap :size="4">
          <Image
            v-for="(item, idx) in row.chat_attachments"
            :key="idx"
            :height="40"
            :src="item.access_url"
            :preview="{
              mask: $t('page.review.remittance.actions.preview'),
            }"
            alt="chat"
            class="cursor-pointer rounded"
            fallback="data:image/svg+xml,%3Csvg viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3EIMG%3C/text%3E%3C/svg%3E"
            @click="handlePreviewImage(item.access_url, `chat-${idx + 1}`)"
          />
        </Space>
      </template>

      <template #bank_card_no="{ row }">
        <span class="font-mono text-xs">{{
          formatOptionalText(row.bank_card_no)
        }}</span>
      </template>

      <template #has_budget="{ row }">
        <Tag :color="getBudgetColor(row.has_budget)">
          {{ getBudgetText(row.has_budget) }}
        </Tag>
      </template>

      <template #default_amount="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatAmount(row.default_amount) }}
        </span>
      </template>

      <template #sop_status="{ row }">
        <Tag :color="getSopStatusColor(row.sop_status)">
          {{ getSopStatusText(row.sop_status) }}
        </Tag>
      </template>

      <template #amount="{ row }">
        <span
          class="font-mono text-sm font-semibold text-green-600 dark:text-green-400"
        >
          {{ formatAmount(row.amount) }}
        </span>
      </template>

      <template #status="{ row }">
        <Tag :color="getRemittanceStatusColor(row.status)">
          {{ getRemittanceStatusText(row.status) }}
        </Tag>
      </template>

      <template #review_remark="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatOptionalText(row.review_remark) }}
        </span>
      </template>

      <template #operation="{ row }">
        <Space wrap>
          <Button
            size="small"
            type="link"
            @click="openDetailDrawer(row.remittance_id)"
          >
            {{ $t('page.review.remittance.actions.detail') }}
          </Button>
          <Button
            v-if="canReviewRow(row)"
            size="small"
            type="link"
            @click="openReviewModal('review', row)"
          >
            {{ $t('page.review.remittance.actions.review') }}
          </Button>
          <Button
            v-if="canPaymentRow(row)"
            size="small"
            type="link"
            @click="openPaymentModal(row)"
          >
            {{ $t('page.review.remittance.actions.payment') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.review.remittance.messages.no-data')" />
      </template>
    </Grid>

    <!-- 详情抽屉 -->
    <Drawer
      v-model:open="detailDrawerOpen"
      :title="$t('page.review.remittance.detail.title')"
      placement="right"
      width="520"
      :closable="true"
    >
      <Spin :spinning="detailLoading">
        <template v-if="detailError">
          <Alert
            :message="$t('page.review.remittance.messages.detail-load-error')"
            :description="detailError"
            type="error"
            show-icon
          />
        </template>
        <template v-if="remittanceDetail">
          <Descriptions :column="1" bordered size="small">
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.task-code')"
            >
              {{ remittanceDetail.task_code }}
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
              :label="$t('page.review.remittance.columns.remark')"
            >
              {{ formatOptionalText(remittanceDetail.remark) }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.bank-card-no')"
            >
              <span class="font-mono text-xs">
                {{ formatOptionalText(remittanceDetail.bank_card_no) }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.influencer-fee')"
            >
              {{ formatAmount(remittanceDetail.influencer_fee) }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.default-amount')"
            >
              {{ formatAmount(remittanceDetail.default_amount) }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.amount')"
            >
              <span class="font-semibold">
                {{ formatAmount(remittanceDetail.amount) }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.status')"
            >
              <Tag :color="getRemittanceStatusColor(remittanceDetail.status)">
                {{ getRemittanceStatusText(remittanceDetail.status) }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.review-remark')"
            >
              {{ formatOptionalText(remittanceDetail.review_remark) }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.reviewer-name')"
            >
              {{ formatOptionalText(remittanceDetail.reviewer_name) }}
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
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.sop-status')"
            >
              <Tag :color="getSopStatusColor(remittanceDetail.sop_status)">
                {{ getSopStatusText(remittanceDetail.sop_status) }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.remittance.columns.payment-attachments')"
            >
              <div
                v-if="remittanceDetail.payment_attachments?.length"
                class="flex flex-wrap gap-1"
              >
                <Image
                  v-for="(url, idx) in remittanceDetail.payment_attachments"
                  :key="idx"
                  :height="60"
                  :src="url"
                  :preview="{
                    mask: $t('page.review.remittance.actions.preview'),
                  }"
                  alt="payment"
                  class="cursor-pointer rounded"
                  fallback="data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EIMG%3C/text%3E%3C/svg%3E"
                  @click="handlePreviewImage(url, `detail-payment-${idx + 1}`)"
                />
              </div>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </Descriptions.Item>
          </Descriptions>
        </template>
      </Spin>
    </Drawer>

    <!-- 审核/付款弹窗 -->
    <Modal
      v-model:open="reviewModalOpen"
      :title="reviewModalTitle"
      :on-before-ok="
        () => handleReview(isPaymentMode ? 'payment' : 'review', () => {})
      "
      :ok-button-props="{
        loading: reviewSubmitting,
        disabled: reviewSubmitting,
      }"
      :confirm-loading="reviewSubmitting"
      @cancel="reviewTargetRows = []"
    >
      <Form layout="vertical">
        <FormItem :label="$t('page.review.remittance.columns.target-count')">
          <Input :value="String(reviewTargetRows.length)" disabled />
        </FormItem>
        <FormItem
          v-if="showUploadField && isPaymentMode"
          :label="$t('page.review.remittance.columns.payment-attachments')"
        >
          <Upload
            v-model:file-list="uploadFileList"
            :before-upload="beforeUpload"
            :custom-request="handleCustomRequest"
            :max-count="3"
            :multiple="true"
            list-type="picture-card"
            @change="handleUploadChange"
          >
            <div>
              <div style="margin-top: 8px">
                {{ $t('page.review.remittance.actions.upload') }}
              </div>
            </div>
          </Upload>
        </FormItem>
        <FormItem
          v-if="canEditAmount && !isPaymentMode"
          :label="$t('page.review.remittance.columns.amount')"
        >
          <InputNumber
            v-model:value="reviewForm.amount"
            :min="0"
            :placeholder="
              $t('page.review.remittance.payment-modal.amount-placeholder')
            "
            style="width: 100%"
          />
        </FormItem>
        <FormItem
          v-if="!isPaymentMode"
          :label="$t('page.review.remittance.columns.status')"
        >
          <Select
            v-model:value="reviewForm.status"
            :options="paymentStatusOptions"
          />
        </FormItem>
        <FormItem :label="$t('page.review.remittance.columns.review-remark')">
          <Input.TextArea
            v-model:value="reviewForm.review_remark"
            :placeholder="
              $t('page.review.remittance.review-modal.remark-placeholder')
            "
            :rows="3"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 图片预览弹窗 -->
    <Modal
      v-model:open="previewModalOpen"
      :title="previewImageTitle"
      :footer="null"
      width="640px"
      @cancel="previewModalOpen = false"
    >
      <div class="flex items-center justify-center">
        <Image
          :src="previewImageSrc"
          style="max-width: 100%; max-height: 70vh"
        />
      </div>
    </Modal>
  </Page>
</template>

<style>
.review-sample-modal {
  min-width: 520px;
}

.review-sample-modal .ant-modal-body {
  padding-bottom: 0;
  overflow-y: hidden;
}

.review-form-scroll {
  max-height: calc(80vh - 180px);
  padding-right: 8px;
  padding-bottom: 24px;
  overflow-y: auto;
}
</style>
