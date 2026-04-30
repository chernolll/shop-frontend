<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Modal, Space } from 'ant-design-vue';

import { $t } from '#/locales';
import { useBDSopStore } from '#/store';

import SopStepContent from './SopStepContent.vue';
import SopSteps from './SopSteps.vue';

enum BDSOPStatus {
  CONTACT = 0,
  SAMPLE = 1,
  RECOVER = 2,
  COMPLETED = 3,
  REMITTANCE = 4,
  TERMINATED = 5,
}

const route = useRoute();
const bdSopStore = useBDSopStore();
const sopId = computed(() => String(route.params.sop_id ?? ''));
const currentSopRecord = computed(() =>
  bdSopStore.getCurrentSopById(sopId.value),
);
const initialStatus = computed(() => {
  if (currentSopRecord.value) {
    return currentSopRecord.value.status;
  }
  const status = Number(route.query.status);
  return Number.isInteger(status) ? status : BDSOPStatus.CONTACT;
});
const hasBudget = computed(() => {
  if (currentSopRecord.value) {
    return Number(currentSopRecord.value.task_budget) === 1;
  }
  return Number(route.query.budget) === 1;
});

const workflowSteps = computed(() => {
  const steps = [
    {
      status: BDSOPStatus.CONTACT,
      title: $t('page.bd.sop.status-text.contact'),
    },
    {
      status: BDSOPStatus.SAMPLE,
      title: $t('page.bd.sop.status-text.sample'),
    },
    {
      status: BDSOPStatus.RECOVER,
      title: $t('page.bd.sop.status-text.recover'),
    },
  ];

  if (hasBudget.value) {
    steps.push({
      status: BDSOPStatus.REMITTANCE,
      title: $t('page.bd.sop.status-text.remittance'),
    });
  }

  steps.push({
    status: BDSOPStatus.COMPLETED,
    title: $t('page.bd.sop.status-text.completed'),
  });

  return steps;
});

function resolveDefaultStep() {
  const index = workflowSteps.value.findIndex(
    (step) => step.status === initialStatus.value,
  );
  return Math.max(index, 0);
}

const actualStepIndex = computed<null | number>(() =>
  initialStatus.value === BDSOPStatus.TERMINATED ? null : resolveDefaultStep(),
);
const currentStep = ref(0);
const isTerminated = ref(initialStatus.value === BDSOPStatus.TERMINATED);
const showTerminatedContent = ref(false);

watch(
  [workflowSteps, initialStatus],
  () => {
    currentStep.value = actualStepIndex.value ?? 0;
    isTerminated.value = initialStatus.value === BDSOPStatus.TERMINATED;
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
  () => !isTerminated.value && initialStatus.value !== BDSOPStatus.COMPLETED,
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
        :has-budget="hasBudget"
        :is-terminated="isTerminated"
        :show-terminated-content="showTerminatedContent"
        :sop-id="sopId"
        :step="activeStep"
      />
    </Space>
  </Page>
</template>
