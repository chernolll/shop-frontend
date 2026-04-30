<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  message,
  Row,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { BDSopApi, updateBDSopContact } from '#/api/bd/sop';
import { $t } from '#/locales';

const props = defineProps<{
  detail: BDSopApi.ContactDetail | null;
  detailError: string;
  detailLoaded: boolean;
  detailLoading: boolean;
  sopId: number;
}>();

const emit = defineEmits<{
  refreshDetail: [];
}>();

const formState = reactive<{
  budget: number | undefined;
  contact_information: string;
}>({
  budget: undefined,
  contact_information: '',
});

const submitting = ref(false);

const hasBudget = computed(() => Number(props.detail?.task_budget ?? 0) === 1);
const canEdit = computed(
  () => props.detail?.sop_status === BDSopApi.Status.CONTACT,
);
const budgetAmount = computed(() => Number(props.detail?.contact?.budget ?? 0));
const hasSavedContact = computed(() => Boolean(props.detail?.contact));
const hasContactContent = computed(() => {
  const information = props.detail?.contact?.contact_information?.trim();
  return Boolean(information) || budgetAmount.value > 0;
});

const budgetReviewMeta = computed(() => {
  if (budgetAmount.value <= 0) {
    return {
      color: 'default',
      text: $t('page.bd.sop.detail.contact.budget-status-none'),
    };
  }

  const reviewStatus =
    props.detail?.remittance_status ??
    props.detail?.contact?.budget_status ??
    BDSopApi.BudgetReviewStatus.PENDING;

  switch (reviewStatus) {
    case BDSopApi.BudgetReviewStatus.APPROVED: {
      return {
        color: 'success',
        text: $t('page.bd.sop.detail.contact.budget-status-approved'),
      };
    }
    case BDSopApi.BudgetReviewStatus.REJECTED: {
      return {
        color: 'error',
        text: $t('page.bd.sop.detail.contact.budget-status-rejected'),
      };
    }
    default: {
      return {
        color: 'processing',
        text: $t('page.bd.sop.detail.contact.budget-status-pending'),
      };
    }
  }
});

watch(
  () => props.detail,
  (detail) => {
    formState.contact_information = detail?.contact?.contact_information ?? '';
    const budget = Number(detail?.contact?.budget ?? 0);
    formState.budget = budget > 0 ? budget : undefined;
  },
  { immediate: true },
);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function resetForm() {
  formState.contact_information =
    props.detail?.contact?.contact_information ?? '';
  const budget = Number(props.detail?.contact?.budget ?? 0);
  formState.budget = budget > 0 ? budget : undefined;
}

function resolveTaskSopId() {
  return props.detail?.contact?.task_sop_id ?? props.sopId;
}

function extractErrorCode(error: any) {
  return error?.response?.data?.error;
}

async function handleSubmit() {
  if (!props.detail || !canEdit.value) {
    return;
  }

  const contactInformation = formState.contact_information.trim();
  if (!contactInformation) {
    message.warning($t('page.bd.sop.detail.contact.contact-required'));
    return;
  }

  const budget = Number(formState.budget ?? 0);

  try {
    submitting.value = true;
    await updateBDSopContact({
      budget: Math.max(budget, 0),
      contact_information: contactInformation,
      task_sop_id: resolveTaskSopId(),
    });
    message.success($t('page.bd.sop.detail.contact.submit-success'));
    emit('refreshDetail');
  } catch (error) {
    if (extractErrorCode(error) === 'sop.contact_stage_only') {
      emit('refreshDetail');
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Card :bordered="false" class="min-h-[360px] rounded-2xl shadow-sm">
    <Spin :spinning="detailLoading">
      <Space direction="vertical" :size="20" class="w-full">
        <template v-if="detail">
          <Space class="flex w-full items-start justify-between" wrap>
            <div>
              <div class="text-xl font-semibold text-foreground">
                {{ $t('page.bd.sop.status-text.contact') }}
              </div>
              <div
                class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
              >
                {{
                  canEdit
                    ? $t('page.bd.sop.detail.contact.editable-tip')
                    : $t('page.bd.sop.detail.contact.readonly-tip')
                }}
              </div>
            </div>
            <Space wrap>
              <Tag color="processing">SOP #{{ sopId }}</Tag>
              <Tag :color="canEdit ? 'success' : 'default'">
                {{
                  canEdit
                    ? $t('page.bd.sop.detail.contact.editable-tag')
                    : $t('page.bd.sop.detail.contact.readonly-tag')
                }}
              </Tag>
              <Tag :color="hasBudget ? 'blue' : 'default'">
                {{
                  hasBudget
                    ? $t('page.bd.sop.detail.budget-tag')
                    : $t('page.bd.sop.detail.no-budget-tag')
                }}
              </Tag>
              <Tag :color="budgetReviewMeta.color">
                {{ budgetReviewMeta.text }}
              </Tag>
            </Space>
          </Space>

          <Alert
            v-if="detailError"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.contact.load-failed')"
            :description="detailError"
            class="rounded-xl"
          />

          <Row :gutter="[16, 16]">
            <Col :lg="14" :span="24">
              <Card
                size="small"
                class="h-full rounded-2xl border border-border"
              >
                <template #title>
                  <span class="text-sm font-semibold text-foreground">
                    {{ $t('page.bd.sop.detail.contact.info-card-title') }}
                  </span>
                </template>

                <Space direction="vertical" :size="18" class="w-full">
                  <Alert
                    show-icon
                    :type="canEdit ? 'info' : 'warning'"
                    :message="
                      canEdit
                        ? $t('page.bd.sop.detail.contact.editable-tag')
                        : $t('page.bd.sop.detail.contact.readonly-tag')
                    "
                    :description="
                      canEdit
                        ? $t('page.bd.sop.detail.contact.editing-hint')
                        : $t('page.bd.sop.detail.contact.readonly-hint')
                    "
                    class="rounded-xl"
                  />

                  <div class="space-y-2">
                    <div class="text-sm font-medium text-foreground">
                      {{ $t('page.bd.sop.detail.contact.contact-information') }}
                    </div>
                    <Input.TextArea
                      v-model:value="formState.contact_information"
                      :auto-size="{ minRows: 4, maxRows: 8 }"
                      :disabled="!canEdit"
                      :placeholder="
                        $t('page.bd.sop.detail.contact.contact-placeholder')
                      "
                    />
                  </div>

                  <div class="space-y-2">
                    <div class="text-sm font-medium text-foreground">
                      {{ $t('page.bd.sop.detail.contact.budget-label') }}
                    </div>
                    <InputNumber
                      v-model:value="formState.budget"
                      class="w-full"
                      :disabled="!canEdit"
                      :min="0"
                      :precision="2"
                      :placeholder="
                        $t('page.bd.sop.detail.contact.budget-placeholder')
                      "
                    />
                    <div class="text-xs leading-5 text-muted-foreground">
                      {{ $t('page.bd.sop.detail.contact.budget-helper') }}
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div
                      class="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t('page.bd.sop.detail.contact.budget-status-label')
                        }}
                      </div>
                      <div class="mt-2">
                        <Tag :color="budgetReviewMeta.color">
                          {{ budgetReviewMeta.text }}
                        </Tag>
                      </div>
                    </div>
                    <div
                      class="rounded-xl border border-border bg-muted/40 p-4"
                    >
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.detail.contact.saved-at-label') }}
                      </div>
                      <div class="mt-2 text-sm text-foreground">
                        {{
                          hasSavedContact
                            ? formatTimestamp(detail.contact?.updated_at)
                            : $t('page.bd.sop.detail.contact.not-saved-yet')
                        }}
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="!hasContactContent && !canEdit"
                    class="rounded-xl border border-dashed border-border p-6"
                  >
                    <Empty
                      :description="
                        $t('page.bd.sop.detail.contact.no-contact-record')
                      "
                    />
                  </div>

                  <Space v-if="canEdit" wrap>
                    <Button
                      type="primary"
                      :loading="submitting"
                      @click="handleSubmit"
                    >
                      {{ $t('page.bd.sop.detail.contact.submit') }}
                    </Button>
                    <Button :disabled="submitting" @click="resetForm">
                      {{ $t('page.bd.sop.detail.contact.reset') }}
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>

            <Col :lg="10" :span="24">
              <Card
                size="small"
                class="h-full rounded-2xl border border-border"
              >
                <template #title>
                  <span class="text-sm font-semibold text-foreground">
                    {{ $t('page.bd.sop.detail.contact.summary-card-title') }}
                  </span>
                </template>

                <div class="space-y-4 text-sm">
                  <div class="space-y-1">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{ $t('page.bd.sop.columns.product-url') }}
                    </div>
                    <a
                      v-if="detail.product_url"
                      :href="detail.product_url"
                      target="_blank"
                      rel="noreferrer"
                      class="break-all text-blue-500 hover:underline"
                    >
                      {{ detail.product_url }}
                    </a>
                    <div v-else class="text-foreground">-</div>
                  </div>

                  <div class="space-y-1">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{ $t('page.bd.sop.columns.brief-url') }}
                    </div>
                    <a
                      v-if="detail.brief_url"
                      :href="detail.brief_url"
                      target="_blank"
                      rel="noreferrer"
                      class="break-all text-blue-500 hover:underline"
                    >
                      {{ detail.brief_url }}
                    </a>
                    <div v-else class="text-foreground">-</div>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.columns.commission') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ detail.task_commission }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.columns.deadline') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ formatTimestamp(detail.task_deadline) }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.columns.kol-id') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ detail.kol_id }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{ $t('page.bd.sop.detail.contact.bd-code-label') }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ detail.bd_code }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t('page.bd.sop.detail.contact.task-created-at-label')
                        }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ formatTimestamp(detail.task_created_at) }}
                      </div>
                    </div>
                    <div>
                      <div
                        class="text-xs uppercase tracking-wide text-muted-foreground"
                      >
                        {{
                          $t(
                            'page.bd.sop.detail.contact.contact-created-at-label',
                          )
                        }}
                      </div>
                      <div class="mt-1 text-foreground">
                        {{ formatTimestamp(detail.contact?.created_at) }}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </template>

        <template v-else-if="detailLoaded">
          <Alert
            v-if="detailError"
            show-icon
            type="error"
            :message="$t('page.bd.sop.detail.contact.load-failed')"
            :description="detailError"
            class="rounded-xl"
          />
          <Empty
            :description="$t('page.bd.sop.detail.contact.empty-description')"
          />
          <Button type="primary" ghost @click="emit('refreshDetail')">
            {{ $t('page.bd.sop.detail.contact.retry') }}
          </Button>
        </template>
      </Space>
    </Spin>
  </Card>
</template>
