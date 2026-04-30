<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Modal, Space } from 'ant-design-vue';

import { BDSopApi, getBDSopContactDetail } from '#/api/bd/sop';
import { $t } from '#/locales';
import { useBDSopStore } from '#/store';

import SopStepContent from './SopStepContent.vue';
import SopSteps from './SopSteps.vue';

const route = useRoute();
const bdSopStore = useBDSopStore();
const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailError = ref('');
const sopDetail = ref<BDSopApi.ContactDetail | null>(null);

const sopId = computed(() => {
  const routeSopId =
    route.params.sop_id ?? route.params.id ?? route.query.task_sop_id;
  return Number(routeSopId ?? route.query.sop_id ?? '-1');
});
const currentSopRecord = computed(() =>
  bdSopStore.getCurrentSopById(sopId.value),
);
const resolvedStatus = computed(() => {
  if (sopDetail.value) {
    return sopDetail.value.sop_status;
  }
  if (currentSopRecord.value) {
    return currentSopRecord.value.status;
  }
  const status = Number(route.query.status ?? route.query.sop_status);
  return Number.isInteger(status) ? status : BDSopApi.Status.CONTACT;
});
const hasBudget = computed(() => {
  if (sopDetail.value) {
    return Number(sopDetail.value.task_budget) === 1;
  }
  if (currentSopRecord.value) {
    return Number(currentSopRecord.value.task_budget) === 1;
  }
  return Number(route.query.budget) === 1;
});

const workflowSteps = computed(() => {
  const steps = [
    {
      status: BDSopApi.Status.CONTACT,
      title: $t('page.bd.sop.status-text.contact'),
    },
    {
      status: BDSopApi.Status.SAMPLE,
      title: $t('page.bd.sop.status-text.sample'),
    },
    {
      status: BDSopApi.Status.RECOVER,
      title: $t('page.bd.sop.status-text.recover'),
    },
  ];

  if (hasBudget.value) {
    steps.push({
      status: BDSopApi.Status.REMITTANCE,
      title: $t('page.bd.sop.status-text.remittance'),
    });
  }

  steps.push({
    status: BDSopApi.Status.COMPLETED,
    title: $t('page.bd.sop.status-text.completed'),
  });

  return steps;
});

function resolveDefaultStep() {
  const index = workflowSteps.value.findIndex(
    (step) => step.status === resolvedStatus.value,
  );
  return Math.max(index, 0);
}

const actualStepIndex = computed<null | number>(() =>
  resolvedStatus.value === BDSopApi.Status.TERMINATED
    ? null
    : resolveDefaultStep(),
);
const currentStep = ref(0);
const isTerminated = ref(resolvedStatus.value === BDSopApi.Status.TERMINATED);
const showTerminatedContent = ref(false);

watch(
  [workflowSteps, resolvedStatus],
  () => {
    currentStep.value = actualStepIndex.value ?? 0;
    isTerminated.value = resolvedStatus.value === BDSopApi.Status.TERMINATED;
    showTerminatedContent.value = false;
  },
  { immediate: true },
);

const activeStep = computed(
  () =>
    workflowSteps.value[currentStep.value] ??
    (workflowSteps.value[0] as (typeof workflowSteps.value)[number]),
);

const actualStatusStep = computed(() => {
  if (actualStepIndex.value === null) {
    return null;
  }
  return workflowSteps.value[actualStepIndex.value] ?? workflowSteps.value[0];
});

const currentStatusLabel = computed(() => {
  if (isTerminated.value) {
    return $t('page.bd.sop.status-text.terminated');
  }
  return actualStatusStep.value?.title ?? $t('page.bd.sop.status-text.contact');
});

const canTerminate = computed(
  () =>
    !isTerminated.value && resolvedStatus.value !== BDSopApi.Status.COMPLETED,
);

function extractErrorMessage(error: any) {
  return (
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    $t('page.bd.sop.detail.contact.load-failed')
  );
}

function syncStoreDetail(detail: BDSopApi.ContactDetail) {
  bdSopStore.setCurrentSop({
    bd_code: detail.bd_code,
    brief_url: detail.brief_url,
    id: Number(detail.contact?.task_sop_id ?? sopId.value),
    kol_id: detail.kol_id,
    product_id: detail.product_id,
    product_url: detail.product_url,
    status: detail.sop_status,
    task_bd_id: detail.task_bd_id,
    task_budget: detail.task_budget,
    task_commission: detail.task_commission,
    task_created_at: detail.task_created_at,
    task_deadline: detail.task_deadline,
    task_id: detail.task_id,
    task_type: detail.task_type,
  });
}

async function loadSopDetail() {
  if (!sopId.value) {
    sopDetail.value = null;
    detailLoaded.value = true;
    detailError.value = $t('page.bd.sop.detail.contact.missing-sop-id');
    return;
  }

  try {
    detailLoading.value = true;
    detailError.value = '';
    const detail = await getBDSopContactDetail({ task_sop_id: sopId.value });
    sopDetail.value = detail;
    syncStoreDetail(detail);
  } catch (error) {
    detailError.value = extractErrorMessage(error);
  } finally {
    detailLoaded.value = true;
    detailLoading.value = false;
  }
}

watch(
  sopId,
  () => {
    detailLoaded.value = false;
    sopDetail.value = null;
    loadSopDetail();
  },
  { immediate: true },
);

function handleStepChange(stepIndex: number) {
  currentStep.value = stepIndex;
  showTerminatedContent.value = false;
}

function showTerminatedView() {
  if (isTerminated.value) {
    showTerminatedContent.value = true;
  }
}

function confirmTerminate() {
  Modal.confirm({
    content: $t('page.bd.sop.detail.terminate-confirm-content'),
    okButtonProps: {
      danger: true,
    },
    okText: $t('page.bd.sop.detail.terminate'),
    title: $t('page.bd.sop.detail.terminate-confirm-title'),
    onOk() {
      isTerminated.value = true;
      showTerminatedContent.value = true;
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Space direction="vertical" :size="16" class="w-full">
      <SopSteps
        :actual-step="actualStepIndex"
        :can-terminate="canTerminate"
        :current-status-label="currentStatusLabel"
        :current-step="currentStep"
        :is-terminated="isTerminated"
        :show-terminated-content="showTerminatedContent"
        :step-items="workflowSteps"
        @show-terminated="showTerminatedView"
        @terminate="confirmTerminate"
        @update:current-step="handleStepChange"
      />

      <SopStepContent
        :detail="sopDetail"
        :detail-error="detailError"
        :detail-loaded="detailLoaded"
        :detail-loading="detailLoading"
        :has-budget="hasBudget"
        :is-terminated="isTerminated"
        :show-terminated-content="showTerminatedContent"
        :sop-id="sopId"
        :step="activeStep"
        @refresh-detail="loadSopDetail"
      />
    </Space>
  </Page>
</template>
