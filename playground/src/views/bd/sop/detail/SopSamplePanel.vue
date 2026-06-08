<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { ThailandAddress } from './ThailandAddressSelect.vue';

import { computed, h, reactive, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  abandonBDSopSampleRequest,
  advanceStageBDSop,
  BDSopApi,
  confirmBDSopSampleReceived,
  createBDSopSampleRequest,
  getBDSopSampleDetail,
  getBDSopSampleRequests,
} from '#/api/bd/sop';
import { $t } from '#/locales';

import ThailandAddressSelect from './ThailandAddressSelect.vue';

const props = defineProps<{
  sopId: number;
}>();

const emit = defineEmits<{
  refreshDetail: [];
}>();

const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailError = ref('');
const sampleDetail = ref<BDSopApi.SampleDetail | null>(null);

const requestsLoading = ref(false);
const requestsLoaded = ref(false);
const requestsError = ref('');
const requestList = ref<BDSopApi.SampleRequestItem[]>([]);

const createModalOpen = ref(false);
const createSubmitting = ref(false);
const actionSubmittingIds = ref<number[]>([]);
const confirmReceivedSubmitting = ref(false);
const advancing = ref(false);

const createForm = reactive<{
  address: ThailandAddress;
  quantity: number | undefined;
}>({
  address: {},
  quantity: undefined,
});

const canCreateRequest = computed(() => Boolean(sampleDetail.value));

function formatAddressForCopy(detail?: BDSopApi.SampleDetail | null) {
  if (!detail) return '';
  const name = detail.contact_name ?? '';
  const addr = detail.detail_address ?? detail.address ?? '';
  const city = detail.city ?? '';
  const province = detail.province ?? '';
  const postcode = detail.postcode ?? '';
  const phone = detail.contact_phone ?? '';
  const lines = [
    name,
    addr,
    [city, province].filter(Boolean).join(' '),
    postcode,
    phone,
  ];
  return lines.join('\n').trim();
}

async function copyAddressToClipboard(detail?: BDSopApi.SampleDetail | null) {
  const text = formatAddressForCopy(detail);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success($t('page.bd.sop.detail.sample.copy-address-success'));
  } catch {
    message.error($t('page.bd.sop.detail.sample.copy-address-failed'));
  }
}
const hasReceiptAddress = computed(() =>
  Boolean(sampleDetail.value?.address?.trim()),
);
const hasReceiptTrackingNumber = computed(() =>
  Boolean(sampleDetail.value?.tracking_number?.trim()),
);
const isPackageReceived = computed(
  () => sampleDetail.value?.package_received === 1,
);
const canConfirmPackageReceived = computed(
  () =>
    Boolean(sampleDetail.value) &&
    !isPackageReceived.value &&
    hasReceiptAddress.value &&
    hasReceiptTrackingNumber.value,
);
const confirmReceivedHint = computed(() => {
  if (!sampleDetail.value) {
    return $t('page.bd.sop.detail.sample.confirm-received-empty-tip');
  }
  if (isPackageReceived.value) {
    return $t('page.bd.sop.detail.sample.confirm-received-done-tip');
  }
  if (!hasReceiptAddress.value && !hasReceiptTrackingNumber.value) {
    return $t('page.bd.sop.detail.sample.confirm-received-missing-both-tip');
  }
  if (!hasReceiptAddress.value) {
    return $t('page.bd.sop.detail.sample.confirm-received-missing-address-tip');
  }
  if (!hasReceiptTrackingNumber.value) {
    return $t(
      'page.bd.sop.detail.sample.confirm-received-missing-tracking-tip',
    );
  }
  return $t('page.bd.sop.detail.sample.confirm-received-ready-tip');
});

const canAdvance = computed(
  () => sampleDetail.value?.sop_status === BDSopApi.Status.SAMPLE,
);
const hasCurrentSampleData = computed(() => {
  if (!sampleDetail.value) {
    return false;
  }
  return (
    Boolean(sampleDetail.value.address) ||
    Number(sampleDetail.value.quantity) > 0 ||
    Boolean(sampleDetail.value.tracking_number) ||
    sampleDetail.value.delivered_at !== null
  );
});

const requestColumns = computed<TableColumnsType<BDSopApi.SampleRequestItem>>(
  () => [
    // {
    //   dataIndex: 'request_id',
    //   key: 'request_id',
    //   title: $t('page.bd.sop.detail.sample.request-columns.request-id'),
    //   width: 100,
    // },
    {
      dataIndex: 'contact_name',
      key: 'contact_name',
      title: $t('page.bd.sop.detail.sample.request-columns.contact-name'),
      customRender: ({ value }) => value || '-',
      width: 100,
    },
    {
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      title: $t('page.bd.sop.detail.sample.request-columns.contact-phone'),
      customRender: ({ value }) => value || '-',
      width: 130,
    },
    {
      key: 'address',
      title: $t('page.bd.sop.detail.sample.request-columns.address'),
      ellipsis: true,
      minWidth: 200,
      customRender: ({ record }) => {
        const detail = record.detail_address || record.address || '-';
        const parts = [
          record.district,
          record.city,
          record.province,
          record.postcode,
        ].filter(Boolean);
        if (parts.length === 0) {
          return detail;
        }
        return h(
          Tooltip,
          { title: parts.join(' ') },
          {
            default: () => detail,
          },
        );
      },
    },
    {
      dataIndex: 'quantity',
      key: 'quantity',
      title: $t('page.bd.sop.detail.sample.request-columns.quantity'),
      width: 80,
    },
    {
      dataIndex: 'product_listing_id',
      key: 'product_listing_id',
      title: $t('page.bd.sop.detail.sample.request-columns.product-listing-id'),
      width: 130,
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: $t('page.bd.sop.detail.sample.request-columns.status'),
      width: 100,
      customRender: ({ record }) =>
        h(
          Tag,
          { color: getRequestStatusColor(record.status) },
          {
            default: () => getRequestStatusText(record.status),
          },
        ),
    },
    {
      dataIndex: 'review_reason',
      key: 'review_reason',
      title: $t('page.bd.sop.detail.sample.request-columns.review-reason'),
      ellipsis: true,
      customRender: ({ value }) => value || '-',
    },
    {
      dataIndex: 'created_at',
      key: 'created_at',
      title: $t('page.bd.sop.detail.sample.request-columns.created-at'),
      customRender: ({ value }) => formatTimestamp(value),
      width: 160,
    },
    // {
    //   dataIndex: 'updated_at',
    //   key: 'updated_at',
    //   title: $t('page.bd.sop.detail.sample.request-columns.updated-at'),
    //   customRender: ({ value }) => formatTimestamp(value),
    //   width: 160,
    // },
    {
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      title: $t('page.bd.sop.detail.sample.request-columns.reviewed-at'),
      customRender: ({ value }) => formatTimestamp(value),
      width: 160,
    },
    {
      key: 'action',
      title: $t('page.bd.sop.detail.sample.request-columns.action'),
      width: 100,
      customRender: ({ record }) => {
        if (record.status !== BDSopApi.SampleRequestStatus.PENDING) {
          return '-';
        }
        return h(
          Button,
          {
            danger: true,
            loading: actionSubmittingIds.value.includes(record.request_id),
            size: 'small',
            type: 'link',
            onClick: () => confirmAbandon(record),
          },
          {
            default: () => $t('page.bd.sop.detail.sample.abandon'),
          },
        );
      },
    },
  ],
);

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

function getRequestStatusText(status: BDSopApi.SampleRequestStatus) {
  switch (status) {
    case BDSopApi.SampleRequestStatus.ABANDONED: {
      return $t('page.bd.sop.detail.sample.request-status.abandoned');
    }
    case BDSopApi.SampleRequestStatus.APPROVED: {
      return $t('page.bd.sop.detail.sample.request-status.approved');
    }
    case BDSopApi.SampleRequestStatus.REJECTED: {
      return $t('page.bd.sop.detail.sample.request-status.rejected');
    }
    default: {
      return $t('page.bd.sop.detail.sample.request-status.pending');
    }
  }
}

function getRequestStatusColor(status: BDSopApi.SampleRequestStatus) {
  switch (status) {
    case BDSopApi.SampleRequestStatus.ABANDONED: {
      return 'default';
    }
    case BDSopApi.SampleRequestStatus.APPROVED: {
      return 'success';
    }
    case BDSopApi.SampleRequestStatus.REJECTED: {
      return 'error';
    }
    default: {
      return 'processing';
    }
  }
}

function getPackageReceivedText(value?: 0 | 1) {
  return value === 1
    ? $t('page.bd.sop.detail.sample.package-received-yes')
    : $t('page.bd.sop.detail.sample.package-received-no');
}

function getPackageReceivedColor(value?: 0 | 1) {
  return value === 1 ? 'success' : 'default';
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

function resetCreateForm() {
  createForm.address = {};
  createForm.quantity = undefined;
}

function openCreateModal() {
  resetCreateForm();
  createModalOpen.value = true;
}

function closeCreateModal() {
  if (createSubmitting.value) {
    return;
  }
  createModalOpen.value = false;
}

async function loadSampleDetail() {
  if (props.sopId <= 0) {
    sampleDetail.value = null;
    detailLoaded.value = true;
    detailError.value = $t('page.bd.sop.detail.sample.missing-sop-id');
    return;
  }

  try {
    detailLoading.value = true;
    detailError.value = '';
    sampleDetail.value = await getBDSopSampleDetail({
      task_sop_id: props.sopId,
    });
  } catch (error) {
    sampleDetail.value = null;
    detailError.value = extractErrorMessage(
      error,
      'page.bd.sop.detail.sample.load-failed',
    );
  } finally {
    detailLoaded.value = true;
    detailLoading.value = false;
  }
}

async function loadSampleRequests() {
  if (props.sopId <= 0) {
    requestList.value = [];
    requestsLoaded.value = true;
    requestsError.value = $t('page.bd.sop.detail.sample.missing-sop-id');
    return;
  }

  try {
    requestsLoading.value = true;
    requestsError.value = '';
    const result = await getBDSopSampleRequests({ task_sop_id: props.sopId });
    requestList.value = result.list;
  } catch (error) {
    requestList.value = [];
    requestsError.value = extractErrorMessage(
      error,
      'page.bd.sop.detail.sample.requests-load-failed',
    );
  } finally {
    requestsLoaded.value = true;
    requestsLoading.value = false;
  }
}

async function reloadAll() {
  await Promise.all([loadSampleDetail(), loadSampleRequests()]);
}

async function handleCreateRequest() {
  if (!canCreateRequest.value) {
    return;
  }

  const addr = createForm.address;
  const detailAddr = addr.detail_address?.trim();
  if (!detailAddr) {
    message.warning($t('page.bd.sop.detail.sample.detail-address-required'));
    return;
  }

  const quantity = Number(createForm.quantity ?? 0);
  if (!Number.isFinite(quantity) || quantity < 1) {
    message.warning($t('page.bd.sop.detail.sample.quantity-required'));
    return;
  }

  try {
    createSubmitting.value = true;
    await createBDSopSampleRequest({
      address: detailAddr,
      city: addr.city,
      contact_name: addr.contact_name,
      contact_phone: addr.contact_phone,
      detail_address: addr.detail_address,
      district: addr.district,
      postcode: addr.postcode,
      province: addr.province,
      quantity,
      task_sop_id: props.sopId,
    });
    message.success($t('page.bd.sop.detail.sample.create-success'));
    createModalOpen.value = false;
    await reloadAll();
    emit('refreshDetail');
  } catch (error) {
    if (extractErrorCode(error) === 'sop.sample_stage_only') {
      await reloadAll();
      emit('refreshDetail');
    }
  } finally {
    createSubmitting.value = false;
  }
}

function confirmAdvanceStage() {
  if (!canAdvance.value) return;

  Modal.confirm({
    content: $t('page.bd.sop.detail.sample.advance-confirm-content'),
    okText: $t('page.bd.sop.detail.sample.advance-button'),
    title: $t('page.bd.sop.detail.sample.advance-confirm-title'),
    async onOk() {
      try {
        advancing.value = true;
        await advanceStageBDSop({ task_sop_id: props.sopId });
        message.success($t('page.bd.sop.detail.advance-success'));
        await reloadAll();
        emit('refreshDetail');
      } finally {
        advancing.value = false;
      }
    },
  });
}

function confirmPackageReceived() {
  if (!canConfirmPackageReceived.value) {
    return;
  }

  Modal.confirm({
    content: $t('page.bd.sop.detail.sample.confirm-received-confirm-content'),
    okText: $t('page.bd.sop.detail.sample.confirm-received'),
    title: $t('page.bd.sop.detail.sample.confirm-received-confirm-title'),
    async onOk() {
      try {
        confirmReceivedSubmitting.value = true;
        await confirmBDSopSampleReceived({
          task_sop_id: props.sopId,
        });
        message.success(
          $t('page.bd.sop.detail.sample.confirm-received-success'),
        );
        await reloadAll();
        emit('refreshDetail');
      } catch (error) {
        message.error(
          extractErrorMessage(
            error,
            'page.bd.sop.detail.sample.confirm-received-failed',
          ),
        );
        if (extractErrorCode(error) === 'sop.sample_stage_only') {
          await reloadAll();
          emit('refreshDetail');
        }
        throw error;
      } finally {
        confirmReceivedSubmitting.value = false;
      }
    },
  });
}

function confirmAbandon(record: BDSopApi.SampleRequestItem) {
  Modal.confirm({
    content: $t('page.bd.sop.detail.sample.abandon-confirm-content'),
    okButtonProps: {
      danger: true,
    },
    okText: $t('page.bd.sop.detail.sample.abandon'),
    title: $t('page.bd.sop.detail.sample.abandon-confirm-title'),
    async onOk() {
      try {
        actionSubmittingIds.value = [
          ...actionSubmittingIds.value,
          record.request_id,
        ];
        await abandonBDSopSampleRequest({
          request_id: record.request_id,
          task_sop_id: props.sopId,
        });
        message.success($t('page.bd.sop.detail.sample.abandon-success'));
        await reloadAll();
        emit('refreshDetail');
      } catch (error) {
        if (extractErrorCode(error) === 'sop.sample_stage_only') {
          await reloadAll();
          emit('refreshDetail');
        }
      } finally {
        actionSubmittingIds.value = actionSubmittingIds.value.filter(
          (item) => item !== record.request_id,
        );
      }
    },
  });
}

watch(
  () => props.sopId,
  () => {
    detailLoaded.value = false;
    requestsLoaded.value = false;
    sampleDetail.value = null;
    requestList.value = [];
    closeCreateModal();
    reloadAll();
  },
  { immediate: true },
);
</script>

<template>
  <Space direction="vertical" :size="16" class="w-full">
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <Spin :spinning="detailLoading">
        <Space direction="vertical" :size="20" class="w-full">
          <Space class="flex w-full items-start justify-between" wrap>
            <div>
              <div class="text-xl font-semibold text-foreground">
                {{ $t('page.bd.sop.status-text.sample') }}
              </div>
              <div
                class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
              >
                {{ $t('page.bd.sop.detail.sample.panel-tip') }}
              </div>
            </div>
            <Space wrap>
              <Tag color="processing">SOP #{{ sopId }}</Tag>
              <Tag
                v-if="sampleDetail"
                :color="getSopStatusColor(sampleDetail.sop_status)"
              >
                {{ getSopStatusText(sampleDetail.sop_status) }}
              </Tag>
              <Button
                v-if="canCreateRequest"
                type="primary"
                @click="openCreateModal"
              >
                {{ $t('page.bd.sop.detail.sample.create-request') }}
              </Button>
              <Button
                v-if="canAdvance"
                type="primary"
                :loading="advancing"
                @click="confirmAdvanceStage"
              >
                {{ $t('page.bd.sop.detail.sample.advance-button') }}
              </Button>
            </Space>
          </Space>

          <Alert
            v-if="sampleDetail"
            show-icon
            type="info"
            :message="$t('page.bd.sop.detail.sample.panel-title')"
            :description="
              $t('page.bd.sop.detail.sample.panel-editable-description')
            "
            class="rounded-xl"
          />

          <Alert
            v-if="detailError"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.sample.load-failed')"
            :description="detailError"
            class="rounded-xl"
          />

          <template v-if="sampleDetail">
            <Row :gutter="[16, 16]">
              <Col :lg="14" :span="24">
                <Card
                  size="small"
                  class="h-full rounded-2xl border border-border"
                >
                  <template #title>
                    <span class="text-sm font-semibold text-foreground">
                      {{ $t('page.bd.sop.detail.sample.current-card-title') }}
                    </span>
                  </template>

                  <div
                    v-if="hasCurrentSampleData"
                    class="grid gap-4 text-sm sm:grid-cols-2"
                  >
                    <div class="sm:col-span-2">
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.columns.product-url') }}
                      </div>
                      <a
                        v-if="sampleDetail.product_url"
                        :href="sampleDetail.product_url"
                        target="_blank"
                        rel="noreferrer"
                        class="mt-1 block break-all text-blue-500 hover:underline"
                      >
                        {{ sampleDetail.product_url }}
                      </a>
                      <div v-else class="mt-1 text-foreground">-</div>
                    </div>

                    <div class="sm:col-span-2">
                      <div
                        class="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        <span>{{
                          $t('page.bd.sop.detail.sample.address-label')
                        }}</span>
                        <Button
                          type="link"
                          size="small"
                          @click="copyAddressToClipboard(sampleDetail)"
                        >
                          {{ $t('page.bd.sop.detail.sample.copy-address') }}
                        </Button>
                      </div>
                      <div
                        class="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground"
                      >
                        <template v-if="sampleDetail">
                          <div>
                            <span class="text-muted-foreground">{{
                              $t('page.bd.sop.detail.sample.contact-name-label')
                            }}</span>:
                            {{ sampleDetail.contact_name || '-' }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t('page.bd.sop.detail.sample.postcode-label')
                            }}</span>:
                            {{ sampleDetail.postcode || '-' }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t('page.bd.sop.detail.sample.district-label')
                            }}</span>:
                            {{ sampleDetail.district || '-' }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t('page.bd.sop.detail.sample.city-label')
                            }}</span>:
                            {{ sampleDetail.city || '-' }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t('page.bd.sop.detail.sample.province-label')
                            }}</span>:
                            {{ sampleDetail.province || '-' }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t(
                                'page.bd.sop.detail.sample.detail-address-label',
                              )
                            }}</span>:
                            {{
                              sampleDetail.detail_address ||
                              sampleDetail.address ||
                              '-'
                            }}
                          </div>
                          <div>
                            <span class="text-muted-foreground">{{
                              $t(
                                'page.bd.sop.detail.sample.contact-phone-label',
                              )
                            }}</span>:
                            {{ sampleDetail.contact_phone || '-' }}
                          </div>
                        </template>
                        <template v-else>-</template>
                      </div>
                    </div>

                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.detail.sample.quantity-label') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ sampleDetail.quantity || 0 }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t('page.bd.sop.detail.sample.package-received-label')
                        }}
                      </div>
                      <div class="mt-1">
                        <Tag
                          :color="
                            getPackageReceivedColor(
                              sampleDetail.package_received,
                            )
                          "
                        >
                          {{
                            getPackageReceivedText(
                              sampleDetail.package_received,
                            )
                          }}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.detail.sample.tracking-label') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ sampleDetail.tracking_number || '-' }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.detail.sample.delivered-at-label') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ formatTimestamp(sampleDetail.delivered_at) }}
                      </div>
                    </div>
                  </div>
                  <Empty
                    v-else
                    :description="
                      $t('page.bd.sop.detail.sample.current-empty-description')
                    "
                  />
                </Card>
              </Col>

              <Col :lg="10" :span="24">
                <Card
                  size="small"
                  class="h-full rounded-2xl border border-border"
                >
                  <template #title>
                    <span class="text-sm font-semibold text-foreground">
                      {{
                        $t(
                          'page.bd.sop.detail.sample.confirm-received-card-title',
                        )
                      }}
                    </span>
                  </template>

                  <div class="space-y-4 text-sm">
                    <div
                      class="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t('page.bd.sop.detail.sample.readonly-fields-title')
                        }}
                      </div>
                      <div class="mt-2 text-sm leading-6 text-muted-foreground">
                        {{
                          $t('page.bd.sop.detail.sample.readonly-fields-tip')
                        }}
                      </div>
                    </div>

                    <div
                      class="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t(
                            'page.bd.sop.detail.sample.confirm-received-card-title',
                          )
                        }}
                      </div>
                      <div class="mt-2 text-sm leading-6 text-muted-foreground">
                        {{ confirmReceivedHint }}
                      </div>
                      <Button
                        class="mt-4"
                        type="primary"
                        :disabled="!canConfirmPackageReceived"
                        :loading="confirmReceivedSubmitting"
                        @click="confirmPackageReceived"
                      >
                        {{ $t('page.bd.sop.detail.sample.confirm-received') }}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </template>

          <template v-else-if="detailLoaded">
            <Empty
              :description="$t('page.bd.sop.detail.sample.empty-description')"
            />
            <Button type="primary" ghost @click="loadSampleDetail">
              {{ $t('page.bd.sop.detail.sample.retry') }}
            </Button>
          </template>
        </Space>
      </Spin>
    </Card>

    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <Space direction="vertical" :size="16" class="w-full">
        <Space class="flex w-full items-start justify-between" wrap>
          <div>
            <div class="text-lg font-semibold text-foreground">
              {{ $t('page.bd.sop.detail.sample.request-card-title') }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ $t('page.bd.sop.detail.sample.request-card-description') }}
            </div>
          </div>
          <Button :loading="requestsLoading" @click="loadSampleRequests">
            {{ $t('page.bd.sop.detail.sample.refresh-requests') }}
          </Button>
        </Space>

        <Alert
          v-if="requestsError"
          show-icon
          type="warning"
          :message="$t('page.bd.sop.detail.sample.requests-load-failed')"
          :description="requestsError"
          class="rounded-xl"
        />

        <Table
          :columns="requestColumns"
          :data-source="requestList"
          :loading="requestsLoading"
          :pagination="false"
          :row-key="(record) => record.request_id"
          :scroll="{ x: 1300 }"
          size="middle"
          :locale="{
            emptyText: requestsLoaded
              ? $t('page.bd.sop.detail.sample.requests-empty-description')
              : '-',
          }"
        />
      </Space>
    </Card>

    <Modal
      :open="createModalOpen"
      :confirm-loading="createSubmitting"
      :ok-text="$t('page.bd.sop.detail.sample.submit-request')"
      :cancel-text="$t('page.bd.sop.detail.sample.cancel')"
      :title="$t('page.bd.sop.detail.sample.create-modal-title')"
      @cancel="closeCreateModal"
      @ok="handleCreateRequest"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <ThailandAddressSelect v-model="createForm.address" />

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">
            {{ $t('page.bd.sop.detail.sample.quantity-label') }}
          </div>
          <InputNumber
            v-model:value="createForm.quantity"
            class="w-full"
            :min="1"
            :precision="0"
            :placeholder="$t('page.bd.sop.detail.sample.quantity-placeholder')"
          />
        </div>

        <Alert
          show-icon
          type="info"
          :message="$t('page.bd.sop.detail.sample.readonly-fields-title')"
          :description="$t('page.bd.sop.detail.sample.modal-tip')"
          class="rounded-xl"
        />
      </Space>
    </Modal>
  </Space>
</template>
