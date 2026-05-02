<script lang="ts" setup>
import { Alert, Button, Card, Space, Tag } from 'ant-design-vue';

defineProps<{
  actualStep: null | number;
  canTerminate: boolean;
  currentStatusLabel: string;
  currentStep: number;
  isTerminated: boolean;
  showTerminatedContent: boolean;
  stepItems: Array<{
    title: string;
  }>;
  terminatedRemark?: null | string;
}>();

const emit = defineEmits<{
  showTerminated: [];
  terminate: [];
  'update:currentStep': [value: number];
}>();

function handleStepChange(current: number) {
  emit('update:currentStep', current);
}

function getStepState(
  index: number,
  actualStep: null | number,
  currentStep: number,
) {
  if (actualStep === null) {
    return index === currentStep ? 'active' : 'upcoming';
  }
  if (index === currentStep) return 'active';
  if (index === actualStep) return 'current';
  if (index < actualStep) return 'completed';
  return 'upcoming';
}
</script>

<template>
  <Card :bordered="false" class="rounded-2xl shadow-sm">
    <Space direction="vertical" :size="20" class="w-full">
      <Space class="flex w-full items-start justify-between" wrap>
        <div>
          <div class="text-lg font-semibold text-foreground">
            {{ $t('page.bd.sop.detail.steps-title') }}
          </div>
          <div class="mt-1 text-sm text-muted-foreground">
            {{ $t('page.bd.sop.detail.steps-subtitle') }}
          </div>
        </div>
        <Space wrap>
          <Tag color="processing">
            {{ $t('page.bd.sop.detail.current-status') }}:
            {{ currentStatusLabel }}
          </Tag>
          <Button
            v-if="canTerminate"
            danger
            type="primary"
            @click="emit('terminate')"
          >
            {{ $t('page.bd.sop.detail.terminate') }}
          </Button>
          <Button v-else-if="isTerminated" @click="emit('showTerminated')">
            {{ $t('page.bd.sop.detail.terminated-entry') }}
          </Button>
        </Space>
      </Space>

      <div class="overflow-x-auto pb-2">
        <div class="sop-step-track min-w-[760px]">
          <button
            v-for="(step, index) in stepItems"
            :key="step.title"
            type="button"
            class="sop-step-item"
            :class="`is-${getStepState(index, actualStep, currentStep)}`"
            @click="handleStepChange(index)"
          >
            <span class="sop-step-dot"></span>
            <span class="sop-step-title">
              {{ step.title }}
            </span>
          </button>
        </div>
      </div>

      <Alert
        v-if="isTerminated"
        show-icon
        type="error"
        :message="$t('page.bd.sop.detail.terminated-banner')"
        :description="
          showTerminatedContent
            ? terminatedRemark
              ? $t('page.bd.sop.detail.terminated-description-with-remark', [
                  terminatedRemark,
                ])
              : $t('page.bd.sop.detail.terminated-description')
            : $t('page.bd.sop.detail.terminated-tip')
        "
        class="rounded-xl"
      />
    </Space>
  </Card>
</template>

<style scoped>
.sop-step-track {
  display: flex;
  gap: 18px;
  align-items: center;
}

.sop-step-item {
  position: relative;
  display: flex;
  flex: 1 0 160px;
  gap: 14px;
  align-items: center;
  min-width: 160px;
  padding: 18px 26px 18px 34px;
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
  border: 0;
  clip-path: polygon(
    0 0,
    calc(100% - 18px) 0,
    100% 50%,
    calc(100% - 18px) 100%,
    0 100%,
    12px 50%
  );
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.sop-step-item::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  opacity: 0;
  clip-path: inherit;
  transition: opacity 0.2s ease;
}

.sop-step-item:hover {
  transform: translateY(-1px);
}

.sop-step-dot,
.sop-step-title {
  position: relative;
  z-index: 1;
}

.sop-step-dot {
  flex: none;
  width: 14px;
  height: 14px;
  border: 2px solid currentcolor;
  border-radius: 9999px;
  opacity: 0.9;
}

.sop-step-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  overflow-wrap: break-word;
  -webkit-box-orient: vertical;
}

.sop-step-item.is-upcoming {
  color: hsl(var(--foreground) / 78%);
  background: hsl(var(--muted));
  box-shadow: inset 0 0 0 1px hsl(var(--border));
}

.sop-step-item.is-completed {
  color: hsl(var(--primary-foreground));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-success) 88%, black 8%),
    color-mix(in srgb, var(--color-success) 72%, black 18%)
  );
  box-shadow: 0 10px 24px hsl(var(--success) / 18%);
}

.sop-step-item.is-current {
  color: hsl(var(--primary-foreground));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 84%, white 6%),
    color-mix(in srgb, var(--color-primary) 70%, black 8%)
  );
  box-shadow: 0 10px 24px hsl(var(--primary) / 22%);
}

.sop-step-item.is-active {
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 70%, white 8%),
    0 10px 24px hsl(var(--primary) / 16%);
}

.sop-step-item.is-active::before {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 12%, transparent),
    color-mix(in srgb, var(--color-primary) 3%, transparent)
  );
  opacity: 1;
}

:deep(.ant-alert) {
  border-radius: 12px;
}

@media (max-width: 900px) {
  .sop-step-track {
    gap: 14px;
  }

  .sop-step-item {
    flex-basis: 144px;
    min-width: 144px;
    padding: 16px 22px 16px 30px;
  }

  .sop-step-title {
    font-size: 14px;
  }
}
</style>
