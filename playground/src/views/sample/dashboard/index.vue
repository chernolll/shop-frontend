<script lang="ts" setup>
import type { SampleDashboardApi } from '#/api/review/sample';

import { onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { usePreferences } from '@vben/preferences';

import { Card, Empty, Skeleton } from 'ant-design-vue';

import { getSampleDashboardStats } from '#/api/review/sample';
import { $t } from '#/locales';

const { isDark } = usePreferences();
const loading = ref(true);
const mounted = ref(false);
const stats = ref<null | SampleDashboardApi.Stats>(null);

onMounted(async () => {
  try {
    stats.value = await getSampleDashboardStats();
  } catch {
    stats.value = null;
  } finally {
    loading.value = false;
    requestAnimationFrame(() => {
      mounted.value = true;
    });
  }
});

interface StatCard {
  color: 'blue' | 'cyan' | 'gray' | 'green' | 'orange' | 'red';
  icon: string;
  key: string;
  label: string;
  value: null | number;
}

const cards = ref<StatCard[]>([]);

watch(
  stats,
  (val) => {
    if (!val) {
      cards.value = [];
      return;
    }
    cards.value = [
      {
        key: 'not-sent',
        icon: 'lucide:package-x',
        value: val.not_sent,
        label: $t('page.sample.dashboard.not-sent'),
        color: 'orange',
      },
      {
        key: 'not-received',
        icon: 'lucide:truck',
        value: val.not_received,
        label: $t('page.sample.dashboard.not-received'),
        color: 'blue',
      },
      {
        key: 'overdue',
        icon: 'lucide:alert-triangle',
        value: val.overdue,
        label: $t('page.sample.dashboard.overdue'),
        color: 'red',
      },
      {
        key: 'month-sent',
        icon: 'lucide:package-check',
        value: val.month_sent,
        label: $t('page.sample.dashboard.month-sent'),
        color: 'green',
      },
      {
        key: 'prev-month-sent',
        icon: 'lucide:calendar-arrow-up',
        value: val.prev_month_sent,
        label: $t('page.sample.dashboard.prev-month-sent'),
        color: 'cyan',
      },
      {
        key: 'total-sent',
        icon: 'lucide:archive',
        value: val.total_sent,
        label: $t('page.sample.dashboard.total-sent'),
        color: 'gray',
      },
    ];
  },
  { immediate: true },
);
</script>

<template>
  <Page auto-content-height>
    <!-- Loading skeleton -->
    <div v-if="loading" class="dash-loading">
      <Skeleton
        v-for="i in 6"
        :key="i"
        active
        :paragraph="{ rows: 1 }"
        :title="{ width: '60%' }"
      />
    </div>

    <!-- Error / empty state -->
    <div v-else-if="!stats" class="dash-empty">
      <Empty
        :description="$t('page.sample.empty')"
        class="flex flex-col items-center"
      />
    </div>

    <!-- Dashboard content -->
    <div
      v-else
      :class="{ 'animate-ready': mounted, dark: isDark }"
      class="dash-root"
    >
      <!-- Section header -->
      <!-- <div class="dash-header">
        <h2 class="dash-title">
          {{ $t('page.sample.dashboard-title') }}
        </h2>
        <p class="dash-subtitle">
          {{ $t('page.sample.list-title') }}
        </p>
      </div> -->

      <!-- Stat cards: mobile 2-col, tablet 3-col -->
      <div class="dash-grid">
        <div
          v-for="(card, idx) in cards"
          :key="card.key"
          class="dash-card-wrapper enter-y"
          :style="{ animationDelay: `${idx * 80}ms` }"
        >
          <Card :bordered="false" class="dash-card">
            <div class="dash-card-inner">
              <div class="dash-icon" :class="[`dash-icon-${card.color}`]">
                <IconifyIcon :icon="card.icon" class="size-5" />
              </div>
              <div class="dash-card-text">
                <div class="dash-card-label">
                  {{ card.label }}
                </div>
                <div class="dash-card-value">
                  {{ card.value?.toLocaleString() ?? '-' }}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* ================================================
   CSS Custom Properties — Light / Dark
   ================================================ */
.dash-root {
  --icon-blue-bg: #eff6ff;
  --icon-blue-fg: #3b82f6;
  --icon-cyan-bg: #ecfeff;
  --icon-cyan-fg: #06b6d4;
  --icon-gray-bg: #f8fafc;
  --icon-gray-fg: #64748b;
  --icon-green-bg: #f0fdf4;
  --icon-green-fg: #22c55e;
  --icon-orange-bg: #fff7ed;
  --icon-orange-fg: #f97316;
  --icon-red-bg: #fef2f2;
  --icon-red-fg: #ef4444;
  --card-border-color: #e5e7eb;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 8%);
  --text-label: #6b7280;
  --text-subtitle: #64748b;
  --text-title: #1e293b;
  --text-value: #1e293b;
}

.dash-root.dark {
  --icon-blue-bg: #1e3a5f;
  --icon-blue-fg: #60a5fa;
  --icon-cyan-bg: #0a2a2e;
  --icon-cyan-fg: #22d3ee;
  --icon-gray-bg: #1e293b;
  --icon-gray-fg: #94a3b8;
  --icon-green-bg: #0d2818;
  --icon-green-fg: #4ade80;
  --icon-orange-bg: #3d2a0a;
  --icon-orange-fg: #fb923c;
  --icon-red-bg: #3d1a1a;
  --icon-red-fg: #f87171;
  --card-border-color: #1e293b;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 20%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 40%);
  --text-label: #94a3b8;
  --text-subtitle: #94a3b8;
  --text-title: #f1f5f9;
  --text-value: #f1f5f9;
}

/* Loading & Empty */
.dash-loading {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 24px 0;
}

@media (min-width: 768px) {
  .dash-loading {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dash-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Header */
.dash-header {
  margin-bottom: 24px;
}

.dash-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-title);
}

.dash-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-subtitle);
}

/* Stat Grid — mobile 2-col, tablet 3-col */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (min-width: 768px) {
  .dash-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* Card */
.dash-card-wrapper {
  opacity: 0;
  transform: translateY(16px);
}

.animate-ready .dash-card-wrapper {
  animation: card-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes card-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dash-card {
  cursor: default;
  border: 1px solid var(--card-border-color) !important;
  border-radius: 16px !important;
  box-shadow: var(--card-shadow);
  transition:
    box-shadow 0.25s,
    transform 0.25s;
}

.dash-card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

.dash-card :deep(.ant-card-body) {
  padding: 20px;
}

@media (min-width: 768px) {
  .dash-card :deep(.ant-card-body) {
    padding: 24px;
  }
}

/* Card Inner (icon + text) */
.dash-card-inner {
  display: flex;
  gap: 16px;
  align-items: center;
}

.dash-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  transition: transform 0.25s;
}

.dash-card:hover .dash-icon {
  transform: scale(1.1);
}

/* Icon color variants */
.dash-icon-blue {
  color: var(--icon-blue-fg);
  background: var(--icon-blue-bg);
}

.dash-icon-cyan {
  color: var(--icon-cyan-fg);
  background: var(--icon-cyan-bg);
}

.dash-icon-gray {
  color: var(--icon-gray-fg);
  background: var(--icon-gray-bg);
}

.dash-icon-green {
  color: var(--icon-green-fg);
  background: var(--icon-green-bg);
}

.dash-icon-orange {
  color: var(--icon-orange-fg);
  background: var(--icon-orange-bg);
}

.dash-icon-red {
  color: var(--icon-red-fg);
  background: var(--icon-red-bg);
}

/* Card Text */
.dash-card-text {
  min-width: 0;
}

.dash-card-label {
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.2;
  color: var(--text-label);
}

@media (min-width: 768px) {
  .dash-card-label {
    font-size: 14px;
  }
}

.dash-card-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-value);
  letter-spacing: -0.5px;
}

@media (min-width: 768px) {
  .dash-card-value {
    font-size: 30px;
  }
}

/* Motion preferences */
@media (prefers-reduced-motion: reduce) {
  .dash-card-wrapper,
  .animate-ready .dash-card-wrapper {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .dash-card:hover {
    transform: none;
  }
}
</style>
