<script lang="ts" setup>
import type {
  TableColumnsType,
  UploadChangeParam,
  UploadFile,
} from 'ant-design-vue';

import { computed, h, reactive, ref, watch } from 'vue';

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
  Space,
  Spin,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  abandonBDSopRemittance,
  advanceStageBDSop,
  BDSopApi,
  completeBDSop,
  createBDSopRemittance,
  getBDSopRemittanceDetail,
  getBDSopRemittanceList,
} from '#/api/bd/sop';
import { getFileUploadUrl, registerUploadedFile } from '#/api/core';
import { $t } from '#/locales';

const props = defineProps<{
  sopId: number;
}>();

const emit = defineEmits<{
  refreshDetail: [];
}>();

const listLoading = ref(false);
const listLoaded = ref(false);
const listError = ref('');
const remittanceList = ref<BDSopApi.RemittanceListResult | null>(null);

const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailError = ref('');
const remittanceDetail = ref<BDSopApi.RemittanceDetail | null>(null);
const selectedRemittanceId = ref<null | number>(null);
const detailAutoReloaded = ref(false);
const detailDrawerOpen = ref(false);

const createModalOpen = ref(false);
const createSubmitting = ref(false);
const advancing = ref(false);
const completing = ref(false);
const actionSubmittingIds = ref<number[]>([]);
const uploadFileList = ref<UploadFile[]>([]);
const previewModalOpen = ref(false);
const previewImageSrc = ref('');
const previewImageTitle = ref('');

const createForm = reactive<{
  amount: number | undefined;
  bank_card_no: string;
  bank_name: string;
  payee_name: string;
}>({
  amount: undefined,
  bank_card_no: '',
  bank_name: '',
  payee_name: '',
});

const hasBudget = computed(
  () => Number(remittanceList.value?.has_budget ?? 0) === 1,
);
const isRemittanceStage = computed(
  () => remittanceList.value?.sop_status === BDSopApi.Status.REMITTANCE,
);
const canCreate = computed(
  () =>
    Boolean(remittanceList.value) && hasBudget.value && isRemittanceStage.value,
);
const canCompleteSop = computed(
  () =>
    Boolean(remittanceList.value) && hasBudget.value && isRemittanceStage.value,
);
const hasApprovedRemittance = computed(() =>
  (remittanceList.value?.list ?? []).some(
    (r) => r.status === BDSopApi.RemittanceStatus.APPROVED,
  ),
);
const canAdvance = computed(
  () =>
    Boolean(remittanceList.value) &&
    hasBudget.value &&
    isRemittanceStage.value &&
    hasApprovedRemittance.value,
);

const allowedUploadMimeTypes = new Set(['image/jpeg', 'image/png']);
const allowedUploadNamePattern = /\.(jpe?g|png)$/i;

const requestColumns = computed<TableColumnsType<BDSopApi.RemittanceItem>>(
  () => [
    {
      dataIndex: 'submit_at',
      key: 'submit_at',
      title: $t('page.bd.sop.detail.remittance.record-columns.submit-at'),
      customRender: ({ value }) => formatTimestamp(value),
      width: 180,
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      title: $t('page.bd.sop.detail.remittance.record-columns.amount'),
      customRender: ({ value }) => formatAmount(value),
      width: 120,
    },
    {
      dataIndex: 'payee_name',
      key: 'payee_name',
      title: $t('page.bd.sop.detail.remittance.record-columns.payee-name'),
      ellipsis: true,
      width: 140,
    },
    {
      dataIndex: 'bank_name',
      key: 'bank_name',
      title: $t('page.bd.sop.detail.remittance.record-columns.bank-name'),
      ellipsis: true,
      width: 180,
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: $t('page.bd.sop.detail.remittance.record-columns.status'),
      width: 120,
      customRender: ({ record }) =>
        h(
          Tag,
          { color: getRemittanceStatusColor(record.status) },
          {
            default: () => getRemittanceStatusText(record.status),
          },
        ),
    },
    {
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      title: $t('page.bd.sop.detail.remittance.record-columns.reviewed-at'),
      customRender: ({ value }) => formatTimestamp(value),
      width: 180,
    },
    {
      key: 'action',
      title: $t('page.bd.sop.detail.remittance.record-columns.action'),
      fixed: 'right',
      width: 180,
      customRender: ({ record }) =>
        h(
          Space,
          { size: 'small' },
          {
            default: () => [
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => openDetailDrawer(record.id),
                },
                {
                  default: () => $t('page.bd.sop.detail.remittance.view'),
                },
              ),
              record.status === BDSopApi.RemittanceStatus.PENDING &&
              hasBudget.value &&
              isRemittanceStage.value
                ? h(
                    Button,
                    {
                      danger: true,
                      loading: actionSubmittingIds.value.includes(record.id),
                      size: 'small',
                      type: 'link',
                      onClick: () => confirmAbandon(record),
                    },
                    {
                      default: () =>
                        $t('page.bd.sop.detail.remittance.abandon'),
                    },
                  )
                : null,
            ],
          },
        ),
    },
  ],
);

function formatAmount(value?: null | number) {
  return value === null || value === undefined ? '-' : String(value);
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getSopStatusText(status?: number) {
  switch (status) {
    case BDSopApi.Status.COMPLETED: {
      return $t('page.bd.sop.status-text.completed');
    }
    case BDSopApi.Status.CONTACT: {
      return $t('page.bd.sop.status-text.contact');
    }
    case BDSopApi.Status.RECOVER: {
      return $t('page.bd.sop.status-text.recover');
    }
    case BDSopApi.Status.REMITTANCE: {
      return $t('page.bd.sop.status-text.remittance');
    }
    case BDSopApi.Status.SAMPLE: {
      return $t('page.bd.sop.status-text.sample');
    }
    case BDSopApi.Status.TERMINATED: {
      return $t('page.bd.sop.status-text.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case BDSopApi.Status.COMPLETED: {
      return 'success';
    }
    case BDSopApi.Status.CONTACT: {
      return 'default';
    }
    case BDSopApi.Status.RECOVER: {
      return 'warning';
    }
    case BDSopApi.Status.REMITTANCE: {
      return 'processing';
    }
    case BDSopApi.Status.SAMPLE: {
      return 'processing';
    }
    case BDSopApi.Status.TERMINATED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function getRemittanceStatusText(status: BDSopApi.RemittanceStatus) {
  switch (status) {
    case BDSopApi.RemittanceStatus.ABANDONED: {
      return $t('page.bd.sop.detail.remittance.status.abandoned');
    }
    case BDSopApi.RemittanceStatus.APPROVED: {
      return $t('page.bd.sop.detail.remittance.status.approved');
    }
    case BDSopApi.RemittanceStatus.REJECTED: {
      return $t('page.bd.sop.detail.remittance.status.rejected');
    }
    default: {
      return $t('page.bd.sop.detail.remittance.status.pending');
    }
  }
}

function getRemittanceStatusColor(status: BDSopApi.RemittanceStatus) {
  switch (status) {
    case BDSopApi.RemittanceStatus.ABANDONED: {
      return 'default';
    }
    case BDSopApi.RemittanceStatus.APPROVED: {
      return 'success';
    }
    case BDSopApi.RemittanceStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function extractErrorCode(error: any) {
  return error?.response?.data?.error;
}

function extractErrorMessage(error: any, fallbackKey: string) {
  return (
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    $t(fallbackKey)
  );
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
  message.warning($t('page.bd.sop.detail.remittance.upload-type-invalid'));
  return Upload.LIST_IGNORE;
}

function resetCreateForm() {
  createForm.amount =
    remittanceList.value?.default_amount === null ||
    remittanceList.value?.default_amount === undefined
      ? undefined
      : Number(remittanceList.value.default_amount);
  createForm.payee_name = '';
  createForm.bank_name = '';
  createForm.bank_card_no = '';
  uploadFileList.value = [];
}

function updateUploadFile(uid: string, patch: Partial<UploadFile>) {
  uploadFileList.value = uploadFileList.value.map((file) =>
    file.uid === uid ? { ...file, ...patch } : file,
  );
}

async function loadRemittanceDetail(remittanceId: number) {
  try {
    detailLoading.value = true;
    detailError.value = '';
    remittanceDetail.value = await getBDSopRemittanceDetail({
      id: remittanceId,
    });
    detailAutoReloaded.value = false;
  } catch (error) {
    remittanceDetail.value = null;
    detailError.value = extractErrorMessage(
      error,
      'page.bd.sop.detail.remittance.detail-load-failed',
    );
  } finally {
    detailLoaded.value = true;
    detailLoading.value = false;
  }
}

async function loadRemittanceList() {
  if (props.sopId <= 0) {
    remittanceList.value = null;
    detailLoaded.value = true;
    listLoaded.value = true;
    listError.value = $t('page.bd.sop.detail.remittance.missing-sop-id');
    return;
  }

  try {
    listLoading.value = true;
    listError.value = '';
    remittanceList.value = await getBDSopRemittanceList({
      task_sop_id: props.sopId,
    });
  } catch (error) {
    remittanceList.value = null;
    listError.value = extractErrorMessage(
      error,
      'page.bd.sop.detail.remittance.load-failed',
    );
  } finally {
    listLoaded.value = true;
    listLoading.value = false;
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

function openCreateModal() {
  if (!canCreate.value) {
    return;
  }
  resetCreateForm();
  createModalOpen.value = true;
}

function closeCreateModal() {
  if (createSubmitting.value) {
    return;
  }
  createModalOpen.value = false;
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

async function uploadChatAttachment(file: UploadFile) {
  const rawFile = file.originFileObj;
  if (!rawFile) {
    throw new Error($t('page.bd.sop.detail.remittance.upload-file-invalid'));
  }

  updateUploadFile(file.uid, {
    percent: 0,
    status: 'uploading',
  });

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
    throw new Error($t('page.bd.sop.detail.remittance.upload-failed'));
  }

  const registeredFile = await registerUploadedFile({
    file_key: uploadData.file_key,
    file_name: uploadData.file_name,
  });

  updateUploadFile(file.uid, {
    percent: 100,
    status: 'done',
  });

  return registeredFile.id;
}

async function uploadChatAttachments() {
  const fileIds: number[] = [];

  for (const file of uploadFileList.value) {
    try {
      fileIds.push(await uploadChatAttachment(file));
    } catch (error) {
      updateUploadFile(file.uid, {
        percent: 0,
        status: 'error',
      });
      throw error;
    }
  }

  return fileIds;
}

function confirmCreate() {
  if (!canCreate.value) {
    return;
  }

  const amount = Number(createForm.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    message.warning($t('page.bd.sop.detail.remittance.amount-required'));
    return;
  }

  const payeeName = createForm.payee_name.trim();
  if (!payeeName) {
    message.warning($t('page.bd.sop.detail.remittance.payee-name-required'));
    return;
  }

  const bankName = createForm.bank_name.trim();
  if (!bankName) {
    message.warning($t('page.bd.sop.detail.remittance.bank-name-required'));
    return;
  }

  const bankCardNo = createForm.bank_card_no.trim();
  if (!bankCardNo) {
    message.warning($t('page.bd.sop.detail.remittance.bank-card-required'));
    return;
  }

  if (uploadFileList.value.length === 0) {
    message.warning($t('page.bd.sop.detail.remittance.upload-required'));
    return;
  }

  Modal.confirm({
    content: $t('page.bd.sop.detail.remittance.create-confirm-content'),
    okText: $t('page.bd.sop.detail.remittance.create'),
    title: $t('page.bd.sop.detail.remittance.create-confirm-title'),
    async onOk() {
      try {
        createSubmitting.value = true;
        const chatAttachmentFileIds = await uploadChatAttachments();
        const result = await createBDSopRemittance({
          amount,
          bank_card_no: bankCardNo,
          bank_name: bankName,
          chat_attachment_file_ids: chatAttachmentFileIds,
          payee_name: payeeName,
          task_sop_id: props.sopId,
        });
        message.success($t('page.bd.sop.detail.remittance.create-success'));
        createModalOpen.value = false;
        resetCreateForm();
        await loadRemittanceList();
        emit('refreshDetail');
        await openDetailDrawer(result.id);
      } catch (error) {
        if (extractErrorCode(error) === 'sop.remittance_stage_only') {
          await loadRemittanceList();
          emit('refreshDetail');
        }
      } finally {
        createSubmitting.value = false;
      }
    },
  });
}

function confirmAbandon(record: BDSopApi.RemittanceItem) {
  Modal.confirm({
    content: $t('page.bd.sop.detail.remittance.abandon-confirm-content'),
    okButtonProps: { danger: true },
    okText: $t('page.bd.sop.detail.remittance.abandon'),
    title: $t('page.bd.sop.detail.remittance.abandon-confirm-title'),
    async onOk() {
      try {
        actionSubmittingIds.value = [...actionSubmittingIds.value, record.id];
        await abandonBDSopRemittance({
          remittance_id: record.id,
          task_sop_id: props.sopId,
        });
        message.success($t('page.bd.sop.detail.remittance.abandon-success'));
        await loadRemittanceList();
        emit('refreshDetail');
        if (
          detailDrawerOpen.value &&
          selectedRemittanceId.value === record.id
        ) {
          await loadRemittanceDetail(record.id);
        }
      } finally {
        actionSubmittingIds.value = actionSubmittingIds.value.filter(
          (id) => id !== record.id,
        );
      }
    },
  });
}

function confirmCompleteSop() {
  if (!canCompleteSop.value) {
    return;
  }

  Modal.confirm({
    content: $t('page.bd.sop.detail.remittance.complete-confirm-content'),
    okText: $t('page.bd.sop.detail.remittance.complete'),
    title: $t('page.bd.sop.detail.remittance.complete-confirm-title'),
    async onOk() {
      try {
        completing.value = true;
        await completeBDSop({ task_sop_id: props.sopId });
        message.success($t('page.bd.sop.detail.remittance.complete-success'));
        await loadRemittanceList();
        emit('refreshDetail');
      } finally {
        completing.value = false;
      }
    },
  });
}

function confirmAdvanceStage() {
  if (!canAdvance.value) return;

  Modal.confirm({
    content: $t('page.bd.sop.detail.remittance.advance-confirm-content'),
    okText: $t('page.bd.sop.detail.remittance.advance-button'),
    title: $t('page.bd.sop.detail.remittance.advance-confirm-title'),
    async onOk() {
      try {
        advancing.value = true;
        await advanceStageBDSop({ task_sop_id: props.sopId });
        message.success($t('page.bd.sop.detail.advance-success'));
        await loadRemittanceList();
        emit('refreshDetail');
      } finally {
        advancing.value = false;
      }
    },
  });
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

watch(
  () => props.sopId,
  () => {
    listLoaded.value = false;
    detailLoaded.value = false;
    listError.value = '';
    detailError.value = '';
    remittanceList.value = null;
    remittanceDetail.value = null;
    selectedRemittanceId.value = null;
    detailDrawerOpen.value = false;
    loadRemittanceList();
  },
  { immediate: true },
);
</script>

<template>
  <Card :bordered="false" class="min-h-[360px] rounded-2xl shadow-sm">
    <Spin :spinning="listLoading">
      <Space direction="vertical" :size="16" class="w-full">
        <template v-if="remittanceList">
          <Card size="small" class="rounded-2xl border border-border">
            <Space direction="vertical" :size="12" class="w-full">
              <Space class="flex w-full items-start justify-between" wrap>
                <div>
                  <div class="text-xl font-semibold text-foreground">
                    {{ $t('page.bd.sop.status-text.remittance') }}
                  </div>
                  <div
                    class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
                  >
                    {{
                      !hasBudget
                        ? $t('page.bd.sop.detail.remittance.no-budget-tip')
                        : isRemittanceStage
                          ? $t('page.bd.sop.detail.remittance.editable-tip')
                          : $t('page.bd.sop.detail.remittance.readonly-tip')
                    }}
                  </div>
                </div>
                <Space wrap>
                  <Tag color="processing">SOP #{{ sopId }}</Tag>
                  <Tag :color="getSopStatusColor(remittanceList.sop_status)">
                    {{ getSopStatusText(remittanceList.sop_status) }}
                  </Tag>
                  <Tag :color="hasBudget ? 'blue' : 'default'">
                    {{
                      hasBudget
                        ? $t('page.bd.sop.detail.budget-tag')
                        : $t('page.bd.sop.detail.no-budget-tag')
                    }}
                  </Tag>
                </Space>
              </Space>
            </Space>
          </Card>

          <Alert
            v-if="hasBudget && !isRemittanceStage"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.remittance.stage-changed-title')"
            :description="
              $t('page.bd.sop.detail.remittance.stage-changed-description', [
                getSopStatusText(remittanceList.sop_status),
              ])
            "
            class="rounded-xl"
          />

          <Alert
            v-if="listError"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.remittance.load-failed')"
            :description="listError"
            class="rounded-xl"
          />

          <Card
            size="small"
            class="rounded-2xl border border-border"
            v-if="hasBudget"
          >
            <template #title>
              <span class="text-sm font-semibold text-foreground">
                {{ $t('page.bd.sop.detail.remittance.summary-card-title') }}
              </span>
            </template>

            <Space direction="vertical" :size="12" class="w-full">
              <div class="text-sm leading-6 text-muted-foreground">
                {{
                  hasBudget
                    ? $t('page.bd.sop.detail.remittance.complete-ready-tip')
                    : $t('page.bd.sop.detail.remittance.no-budget-tip')
                }}
              </div>
              <Space wrap>
                <Button
                  v-if="hasBudget"
                  type="primary"
                  :disabled="!canCreate"
                  @click="openCreateModal"
                >
                  {{ $t('page.bd.sop.detail.remittance.create') }}
                </Button>
                <Button @click="loadRemittanceList()">
                  {{ $t('page.bd.sop.detail.remittance.refresh') }}
                </Button>
                <Button
                  v-if="hasBudget"
                  type="primary"
                  :disabled="!canAdvance"
                  :loading="advancing"
                  @click="confirmAdvanceStage"
                >
                  {{ $t('page.bd.sop.detail.remittance.advance-button') }}
                </Button>
                <Button
                  v-if="hasBudget"
                  :disabled="!canCompleteSop"
                  :loading="completing"
                  @click="confirmCompleteSop"
                >
                  {{ $t('page.bd.sop.detail.remittance.complete') }}
                </Button>
              </Space>
            </Space>
          </Card>

          <Card size="small" class="rounded-2xl border border-border">
            <template #title>
              <span class="text-sm font-semibold text-foreground">
                {{ $t('page.bd.sop.detail.remittance.list-card-title') }}
              </span>
            </template>

            <Space direction="vertical" :size="12" class="w-full">
              <div class="text-sm leading-6 text-muted-foreground">
                {{ $t('page.bd.sop.detail.remittance.list-card-description') }}
              </div>

              <Table
                v-if="remittanceList.list.length > 0"
                :columns="requestColumns"
                :data-source="remittanceList.list"
                :pagination="false"
                :row-key="(record) => record.id"
                :scroll="{ x: 1080 }"
                size="small"
              />
              <Empty
                v-else-if="listLoaded"
                :description="
                  $t('page.bd.sop.detail.remittance.records-empty-description')
                "
              />
            </Space>
          </Card>
        </template>

        <Empty
          v-else-if="listLoaded"
          :description="$t('page.bd.sop.detail.remittance.empty-description')"
        />
      </Space>
    </Spin>

    <Drawer
      :open="detailDrawerOpen"
      :title="$t('page.bd.sop.detail.remittance.detail-card-title')"
      :width="720"
      @close="closeDetailDrawer"
    >
      <Spin :spinning="detailLoading">
        <Space direction="vertical" :size="16" class="w-full">
          <Alert
            v-if="detailError"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.remittance.detail-load-failed')"
            :description="detailError"
            class="rounded-xl"
          />

          <template v-if="remittanceDetail">
            <Space wrap>
              <Tag :color="getRemittanceStatusColor(remittanceDetail.status)">
                {{ getRemittanceStatusText(remittanceDetail.status) }}
              </Tag>
              <Tag color="default">#{{ remittanceDetail.id }}</Tag>
            </Space>

            <Descriptions bordered size="small" :column="1">
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.amount-label')"
              >
                {{ formatAmount(remittanceDetail.amount) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.payee-name-label')"
              >
                {{ remittanceDetail.payee_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.bank-name-label')"
              >
                {{ remittanceDetail.bank_name || '-' }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.bank-card-label')"
              >
                <span class="break-all">
                  {{ remittanceDetail.bank_card_no || '-' }}
                </span>
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.submit-at-label')"
              >
                {{ formatTimestamp(remittanceDetail.submit_at) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.bd.sop.detail.remittance.reviewed-at-label')"
              >
                {{ formatTimestamp(remittanceDetail.reviewed_at) }}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{ $t('page.bd.sop.detail.remittance.review-remark-label') }}
                </span>
              </template>
              <div class="break-words text-sm leading-6 text-muted-foreground">
                {{ remittanceDetail.review_remark || '-' }}
              </div>
            </Card>

            <Alert
              show-icon
              type="info"
              :message="
                $t('page.bd.sop.detail.remittance.attachment-tip-title')
              "
              :description="
                $t('page.bd.sop.detail.remittance.attachment-tip-content')
              "
              class="rounded-xl"
            />

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{
                    $t('page.bd.sop.detail.remittance.chat-attachments-title')
                  }}
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
                :description="
                  $t('page.bd.sop.detail.remittance.chat-attachments-empty')
                "
              />
            </Card>

            <Card size="small" class="rounded-2xl border border-border">
              <template #title>
                <span class="text-sm font-semibold text-foreground">
                  {{
                    $t(
                      'page.bd.sop.detail.remittance.payment-attachments-title',
                    )
                  }}
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
                :description="
                  $t('page.bd.sop.detail.remittance.payment-attachments-empty')
                "
              />
            </Card>
          </template>

          <Empty
            v-else-if="detailLoaded"
            :description="
              $t('page.bd.sop.detail.remittance.detail-empty-description')
            "
          />
        </Space>
      </Spin>
    </Drawer>

    <Modal
      :open="createModalOpen"
      :confirm-loading="createSubmitting"
      :ok-text="$t('page.bd.sop.detail.remittance.create-submit')"
      :cancel-text="$t('page.bd.sop.detail.remittance.cancel')"
      :title="$t('page.bd.sop.detail.remittance.create-modal-title')"
      @cancel="closeCreateModal"
      @ok="confirmCreate"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <div class="text-sm leading-6 text-muted-foreground">
          {{ $t('page.bd.sop.detail.remittance.create-modal-description') }}
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.remittance.amount-label') }}
          </div>
          <InputNumber
            v-model:value="createForm.amount"
            :min="0"
            :precision="2"
            class="w-full"
            :placeholder="
              $t('page.bd.sop.detail.remittance.amount-placeholder')
            "
          />
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.remittance.payee-name-label') }}
          </div>
          <Input
            v-model:value="createForm.payee_name"
            :maxlength="100"
            :placeholder="
              $t('page.bd.sop.detail.remittance.payee-name-placeholder')
            "
          />
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.remittance.bank-name-label') }}
          </div>
          <Input
            v-model:value="createForm.bank_name"
            :maxlength="100"
            :placeholder="
              $t('page.bd.sop.detail.remittance.bank-name-placeholder')
            "
          />
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.remittance.bank-card-label') }}
          </div>
          <Input
            v-model:value="createForm.bank_card_no"
            :maxlength="100"
            :placeholder="
              $t('page.bd.sop.detail.remittance.bank-card-placeholder')
            "
          />
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.remittance.chat-attachments-title') }}
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
              {{ $t('page.bd.sop.detail.remittance.upload-button') }}
            </div>
          </Upload>
          <div class="text-xs leading-5 text-muted-foreground">
            {{ $t('page.bd.sop.detail.remittance.upload-helper') }}
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
  </Card>
</template>
