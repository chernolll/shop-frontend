<script lang="ts" setup>
import type { BdDashboardApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { usePreferences } from '@vben/preferences';

import {
  Card,
  DatePicker,
  Empty,
  Progress,
  Radio,
  Skeleton,
} from 'ant-design-vue';

import { getBdDashboard } from '#/api';
import { $t } from '#/locales';

const { isDark } = usePreferences();
const loading = ref(true);
const mounted = ref(false);
const data = ref<BdDashboardApi.DashboardResult | null>(null);

// --- Time Range ---
type TimePreset = 'custom' | 'this_month' | 'this_week' | 'today';

const timeRange = ref<TimePreset>('this_month');
const customRange = ref<any>();

const RADIO_OPTIONS: { label: string; value: TimePreset }[] = [
  { label: '本月', value: 'this_month' },
  { label: '本周', value: 'this_week' },
  { label: '今日', value: 'today' },
  { label: '自定义', value: 'custom' },
];

// --- Fetch ---
async function fetchDashboard() {
  loading.value = true;
  try {
    const params: BdDashboardApi.DashboardParams = {
      time_range: timeRange.value,
    };
    if (
      timeRange.value === 'custom' &&
      customRange.value?.[0] &&
      customRange.value?.[1]
    ) {
      params.start_time = Number(customRange.value[0].valueOf());
      params.end_time = Number(customRange.value[1].valueOf());
    }
    data.value = await getBdDashboard(params);
  } catch {
    data.value = null;
  } finally {
    loading.value = false;
    if (!mounted.value) {
      requestAnimationFrame(() => {
        mounted.value = true;
      });
    }
  }
}

onMounted(() => {
  fetchDashboard();
});

watch(timeRange, (val) => {
  if (val !== 'custom') {
    customRange.value = undefined;
    fetchDashboard();
  }
});

watch(customRange, (val) => {
  if (timeRange.value === 'custom' && val?.[0] && val?.[1]) {
    fetchDashboard();
  }
});

// --- Derived ---
const overview = computed(() => data.value?.overview);

const kolRanking = computed(() => data.value?.kol_rank ?? []);
const bdRanking = computed(() => data.value?.bd_rank ?? []);
const kolRest = computed(() => kolRanking.value.slice(3));

// SOP segmented progress: running / completed / terminated
const sopSegments = computed(() => {
  const running = overview.value?.sop_running ?? 0;
  const completed = overview.value?.sop_completed ?? 0;
  const terminated = overview.value?.sop_terminated ?? 0;
  const total = running + completed + terminated;
  if (total <= 0) return { running: 0, completed: 0, terminated: 0, total: 0 };
  return {
    completed: Math.round((completed / total) * 100),
    running: Math.round((running / total) * 100),
    terminated: Math.round((terminated / total) * 100),
    total,
  };
});

function recycleRateColor(rate: number): string {
  if (rate >= 80) return '#22c55e';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
}

// --- Formatting ---
function formatCurrency(value: number): string {
  if (value >= 10_000) {
    return `฿${(value / 10_000).toFixed(1)}万`;
  }
  return `฿${value.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `฿${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `฿${(value / 1000).toFixed(1)}K`;
  }
  return `฿${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}
</script>

<template>
  <Page auto-content-height>
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <Skeleton active :paragraph="{ rows: 0 }" :title="{ width: '30%' }" />
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Skeleton
          v-for="i in 8"
          :key="i"
          active
          :paragraph="{ rows: 1 }"
          :title="{ width: '60%' }"
        />
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton
          v-for="i in 2"
          :key="`sk-${i}`"
          active
          :paragraph="{ rows: 6 }"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!data"
      class="flex min-h-[400px] items-center justify-center"
    >
      <Empty :description="$t('page.bd.analytics.load-failed')" />
    </div>

    <!-- Dashboard content -->
    <div
      v-else
      :class="{ 'animate-ready': mounted, dark: isDark }"
      class="analytics-root space-y-6"
    >
      <!-- ================================================================
           Time Range Filter
           ================================================================ -->
      <div class="flex flex-wrap items-center gap-4">
        <Radio.Group
          v-model:value="timeRange"
          :options="RADIO_OPTIONS"
          option-type="button"
          button-style="solid"
          size="small"
        />
        <DatePicker.RangePicker
          v-if="timeRange === 'custom'"
          v-model:value="customRange"
          size="small"
          class="!w-[260px]"
          :placeholder="['开始日期', '结束日期']"
        />
      </div>

      <!-- ================================================================
           Row 1 — Core KPIs (4 cols)
           ================================================================ -->
      <div class="stat-grid">
        <!-- Monthly GMV -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:currency-usd" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.monthly-gmv') }}
              </div>
              <div class="card-value">
                {{ formatCurrency(overview?.month_gmv ?? 0) }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.monthly-gmv-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Completed Tasks -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:check-circle-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.monthly-tasks') }}
              </div>
              <div class="card-value">
                {{ overview?.completed_task_count ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.monthly-tasks-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Total Active Tasks -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:clipboard-list-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.total-tasks') }}
              </div>
              <div class="card-value">
                {{ overview?.total_task_count ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.total-tasks-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Total KOLs -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:account-group-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.total-kols') }}
              </div>
              <div class="card-value">
                {{ overview?.kol_total ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.total-kols-sub') }}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- ================================================================
           Row 2 — SOP Status + Deadline Warning (4 cols)
           ================================================================ -->
      <div class="stat-grid">
        <!-- Deadline 14 Days — Warning -->
        <Card :bordered="false" class="analytics-card enter-y card-warning">
          <div class="card-inner">
            <div class="card-icon card-icon-amber">
              <IconifyIcon icon="mdi:clock-alert-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.deadline-14d') }}
              </div>
              <div class="card-value card-value-amber">
                {{ overview?.deadline_14days ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.deadline-14d-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- SOP Running -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-teal">
              <IconifyIcon icon="mdi:progress-check" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.sop-running') }}
              </div>
              <div class="card-value">
                {{ overview?.sop_running ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.sop-running-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- SOP Completed -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-green">
              <IconifyIcon icon="mdi:check-all" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.sop-completed') }}
              </div>
              <div class="card-value">
                {{ overview?.sop_completed ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.sop-completed-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- SOP Terminated -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-red">
              <IconifyIcon icon="mdi:cancel" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.sop-terminated') }}
              </div>
              <div class="card-value">
                {{ overview?.sop_terminated ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.sop-terminated-sub') }}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- SOP Segmented Progress Bar -->
      <div v-if="sopSegments.total > 0" class="sop-segmented-bar enter-y">
        <div class="sop-segmented-header">
          <!-- <span class="sop-segmented-label">
            SOP
            {{ overview?.sop_total ?? sopSegments.total }}
          </span> -->
          <span class="sop-segmented-legend">
            <span class="legend-dot legend-dot-running"></span>
            {{ overview?.sop_running ?? 0 }} 进行中
            <span class="legend-dot legend-dot-completed"></span>
            {{ overview?.sop_completed ?? 0 }} 已完成
            <span class="legend-dot legend-dot-terminated"></span>
            {{ overview?.sop_terminated ?? 0 }} 已终止
          </span>
        </div>
        <div class="sop-segmented-track">
          <div
            v-if="sopSegments.running > 0"
            class="sop-segmented-fill sop-fill-running"
            :style="{ width: `${sopSegments.running}%` }"
          ></div>
          <div
            v-if="sopSegments.completed > 0"
            class="sop-segmented-fill sop-fill-completed"
            :style="{ width: `${sopSegments.completed}%` }"
          ></div>
          <div
            v-if="sopSegments.terminated > 0"
            class="sop-segmented-fill sop-fill-terminated"
            :style="{ width: `${sopSegments.terminated}%` }"
          ></div>
        </div>
      </div>

      <!-- ================================================================
           Row 3 — Shipment & Video (4 cols)
           ================================================================ -->
      <div class="stat-grid">
        <!-- Shipment Count -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-indigo">
              <IconifyIcon icon="mdi:package-variant-closed" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.shipment-count') }}
              </div>
              <div class="card-value">
                {{ overview?.shipment_count ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.shipment-count-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Shipment Wait Receive -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-indigo">
              <IconifyIcon icon="mdi:truck-delivery-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.shipment-wait-receive') }}
              </div>
              <div class="card-value">
                {{ overview?.shipment_wait_receive ?? 0 }}
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.shipment-wait-receive-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Video Wait Recycle -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-violet">
              <IconifyIcon icon="mdi:filmstrip-box-multiple" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">
                {{ $t('page.bd.analytics.video-wait-recycle') }}
              </div>
              <div class="card-value">
                {{ overview?.video_wait_recycle ?? 0 }}
                <span class="card-value-suffix">
                  / {{ overview?.video_total_recycle ?? 0 }}
                </span>
              </div>
              <div class="card-sub">
                {{ $t('page.bd.analytics.video-wait-recycle-sub') }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Recycle Rate — Circular Progress -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner card-inner-recycle">
            <Progress
              type="circle"
              :percent="overview?.recycle_rate ?? 0"
              :stroke-color="recycleRateColor(overview?.recycle_rate ?? 0)"
              :width="72"
              :stroke-width="8"
              :format="(p?: number) => `${(p ?? 0).toFixed(1)}%`"
            >
              <template #default>
                <span class="recycle-percent-label">
                  {{ (overview?.recycle_rate ?? 0).toFixed(1) }}%
                </span>
              </template>
            </Progress>
            <div class="card-text ml-3">
              <div class="card-label">
                {{ $t('page.bd.analytics.recycle-rate') }}
              </div>
              <div class="card-sub !mt-1">
                {{ $t('page.bd.analytics.recycle-rate-sub') }}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- ================================================================
           Row 4 — Rankings (2 cols)
           ================================================================ -->
      <div class="ranking-grid">
        <!-- KOL Sales Ranking -->
        <Card
          :bordered="false"
          :title="$t('page.bd.analytics.kol-ranking-title')"
          class="analytics-card ranking-card-shell"
        >
          <template #extra>
            <span class="card-extra">{{
              $t('page.bd.analytics.kol-ranking-extra')
            }}</span>
          </template>

          <div v-if="kolRanking.length === 0" class="empty-placeholder">
            <Empty :description="$t('page.bd.analytics.no-sales-data')" />
          </div>
          <div v-else class="podium-wrapper">
            <!-- Podium: top 3 -->
            <div class="podium-stage">
              <!-- 2nd place (left) -->
              <div
                v-if="kolRanking.length >= 2"
                class="podium-col podium-col-side podium-enter"
                :style="{ animationDelay: '0.15s' }"
              >
                <div class="podium-header">
                  <div class="podium-medal medal-silver">2</div>
                  <div
                    class="podium-name"
                    :title="kolRanking[1]?.kol_name || kolRanking[1]?.kol_id"
                  >
                    {{ kolRanking[1]?.kol_name || kolRanking[1]?.kol_id }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(kolRanking[1]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-silver">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">2</span>
                </div>
              </div>

              <!-- 1st place (center, tallest) -->
              <div
                class="podium-col podium-col-center podium-enter"
                :style="{ animationDelay: '0s' }"
              >
                <div class="podium-header">
                  <div class="podium-crown">
                    <IconifyIcon icon="mdi:crown" class="size-6" />
                  </div>
                  <div class="podium-medal medal-gold">1</div>
                  <div
                    class="podium-name podium-name-hero"
                    :title="kolRanking[0]?.kol_name || kolRanking[0]?.kol_id"
                  >
                    {{ kolRanking[0]?.kol_name || kolRanking[0]?.kol_id }}
                  </div>
                  <div class="podium-gmv podium-gmv-hero">
                    {{ formatCompactCurrency(kolRanking[0]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-gold">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">1</span>
                </div>
              </div>

              <!-- 3rd place (right) -->
              <div
                v-if="kolRanking.length >= 3"
                class="podium-col podium-col-side podium-enter"
                :style="{ animationDelay: '0.3s' }"
              >
                <div class="podium-header">
                  <div class="podium-medal medal-bronze">3</div>
                  <div
                    class="podium-name"
                    :title="kolRanking[2]?.kol_name || kolRanking[2]?.kol_id"
                  >
                    {{ kolRanking[2]?.kol_name || kolRanking[2]?.kol_id }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(kolRanking[2]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-bronze">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">3</span>
                </div>
              </div>
            </div>

            <!-- Ranks 4-10 list -->
            <div v-if="kolRanking.length > 3" class="ranking-list">
              <div
                v-for="(item, idx) in kolRest"
                :key="item.kol_id"
                class="ranking-row enter-y"
                :style="{ animationDelay: `${0.4 + idx * 0.05}s` }"
              >
                <div class="ranking-row-left">
                  <span class="ranking-row-rank">{{ item.rank }}</span>
                  <span class="ranking-row-name">
                    {{ item.kol_name || item.kol_id }}
                  </span>
                </div>
                <span class="ranking-row-gmv">
                  {{ formatCompactCurrency(item.gmv) }}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- BD Sales Ranking -->
        <Card
          :bordered="false"
          :title="$t('page.bd.analytics.bd-ranking-title')"
          class="analytics-card ranking-card-shell"
        >
          <template #extra>
            <span class="card-extra">{{
              $t('page.bd.analytics.bd-ranking-extra')
            }}</span>
          </template>

          <div v-if="bdRanking.length === 0" class="empty-placeholder">
            <Empty :description="$t('page.bd.analytics.no-sales-data')" />
          </div>
          <div v-else class="podium-wrapper">
            <!-- Podium: top 3 -->
            <div class="podium-stage podium-stage-bd">
              <!-- 2nd place (left) -->
              <div
                v-if="bdRanking.length >= 2"
                class="podium-col podium-col-side podium-enter"
                :style="{ animationDelay: '0.15s' }"
              >
                <div class="podium-header">
                  <div class="podium-medal medal-silver">2</div>
                  <div
                    class="podium-name"
                    :title="bdRanking[1]?.bd_code || bdRanking[1]?.bd_name"
                  >
                    {{ bdRanking[1]?.bd_code || bdRanking[1]?.bd_name }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(bdRanking[1]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-silver">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">2</span>
                </div>
              </div>

              <!-- 1st place (center, tallest) -->
              <div
                class="podium-col podium-col-center podium-enter"
                :style="{ animationDelay: '0s' }"
              >
                <div class="podium-header">
                  <div class="podium-crown">
                    <IconifyIcon icon="mdi:crown" class="size-6" />
                  </div>
                  <div class="podium-medal medal-gold">1</div>
                  <div
                    class="podium-name podium-name-hero"
                    :title="bdRanking[0]?.bd_code || bdRanking[0]?.bd_name"
                  >
                    {{ bdRanking[0]?.bd_code || bdRanking[0]?.bd_name }}
                  </div>
                  <div class="podium-gmv podium-gmv-hero">
                    {{ formatCompactCurrency(bdRanking[0]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-gold">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">1</span>
                </div>
              </div>

              <!-- 3rd place (right) -->
              <div
                v-if="bdRanking.length >= 3"
                class="podium-col podium-col-side podium-enter"
                :style="{ animationDelay: '0.3s' }"
              >
                <div class="podium-header">
                  <div class="podium-medal medal-bronze">3</div>
                  <div
                    class="podium-name"
                    :title="bdRanking[2]?.bd_code || bdRanking[2]?.bd_name"
                  >
                    {{ bdRanking[2]?.bd_code || bdRanking[2]?.bd_name }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(bdRanking[2]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-bronze">
                  <div class="podium-block-glare"></div>
                  <span class="podium-block-num">3</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* ================================================
   CSS Custom Properties — Light / Dark
   ================================================ */
.analytics-root {
  /* Stat card icon backgrounds */
  --icon-blue-bg: #eff6ff;
  --icon-blue-fg: #3b82f6;
  --icon-amber-bg: #fffbeb;
  --icon-amber-fg: #f59e0b;
  --icon-teal-bg: #f0fdfa;
  --icon-teal-fg: #14b8a6;
  --icon-green-bg: #f0fdf4;
  --icon-green-fg: #22c55e;
  --icon-red-bg: #fef2f2;
  --icon-red-fg: #ef4444;
  --icon-indigo-bg: #eef2ff;
  --icon-indigo-fg: #6366f1;
  --icon-violet-bg: #f5f3ff;
  --icon-violet-fg: #8b5cf6;

  /* Card surfaces */
  --card-border-color: #e5e7eb;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 8%);

  /* Warning card */
  --card-warning-bg: #fff7ed;
  --card-warning-border: #fdba74;

  /* SOP segmented bar */
  --seg-running: #0ea5e9;
  --seg-completed: #22c55e;
  --seg-terminated: #94a3b8;

  /* Podium block gold */
  --podium-gold-stop-1: #fbbf24;
  --podium-gold-stop-2: #f59e0b;
  --podium-gold-stop-3: #d97706;
  --podium-gold-stop-4: #b45309;
  --podium-gold-glare: #fde68a;
  --podium-gold-shadow:
    0 4px 20px rgb(180 83 9 / 25%), 0 1px 0 rgb(255 255 255 / 25%) inset;

  /* Podium block silver */
  --podium-silver-stop-1: #e2e8f0;
  --podium-silver-stop-2: #cbd5e1;
  --podium-silver-stop-3: #94a3b8;
  --podium-silver-stop-4: #64748b;
  --podium-silver-glare: #f1f5f9;
  --podium-silver-shadow:
    0 4px 16px rgb(100 116 139 / 20%), 0 1px 0 rgb(255 255 255 / 30%) inset;

  /* Podium block bronze */
  --podium-bronze-stop-1: #fbbf7c;
  --podium-bronze-stop-2: #ea8c44;
  --podium-bronze-stop-3: #c2410c;
  --podium-bronze-stop-4: #9a3412;
  --podium-bronze-glare: #fed7aa;
  --podium-bronze-shadow:
    0 4px 16px rgb(154 52 18 / 22%), 0 1px 0 rgb(255 255 255 / 20%) inset;

  /* Medal badges */
  --medal-gold-from: #fbbf24;
  --medal-gold-to: #d97706;
  --medal-silver-from: #e2e8f0;
  --medal-silver-to: #94a3b8;
  --medal-bronze-from: #fbbf7c;
  --medal-bronze-to: #c2410c;

  /* Text colors */
  --text-label: #6b7280;
  --text-value: #1e293b;
  --text-sub: #9ca3af;
  --text-podium-name: #475569;
  --text-podium-hero: #1e293b;
  --text-podium-gmv: #64748b;
  --text-podium-gmv-hero: #b45309;
  --text-ranking-name: #334155;
  --text-ranking-gmv: #475569;

  /* Misc */
  --divider-color: #f1f5f9;
  --ranking-row-hover: #f8fafc;
  --ranking-rank-bg: #f1f5f9;
  --ranking-rank-fg: #64748b;
}

/* Dark mode overrides */
.analytics-root.dark {
  --icon-blue-bg: #1e3a5f;
  --icon-blue-fg: #60a5fa;
  --icon-amber-bg: #3d2e0a;
  --icon-amber-fg: #fbbf24;
  --icon-teal-bg: #134e4a;
  --icon-teal-fg: #2dd4bf;
  --icon-green-bg: #14532d;
  --icon-green-fg: #4ade80;
  --icon-red-bg: #450a0a;
  --icon-red-fg: #f87171;
  --icon-indigo-bg: #1e1b4b;
  --icon-indigo-fg: #818cf8;
  --icon-violet-bg: #2e1065;
  --icon-violet-fg: #a78bfa;
  --card-border-color: #1e293b;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 20%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 40%);
  --card-warning-bg: #3d2e0a;
  --card-warning-border: #92400e;
  --seg-running: #38bdf8;
  --seg-completed: #4ade80;
  --seg-terminated: #64748b;

  /* Gold pops brighter against dark bg */
  --podium-gold-stop-1: #fcd34d;
  --podium-gold-stop-2: #fbbf24;
  --podium-gold-stop-3: #f59e0b;
  --podium-gold-stop-4: #b45309;
  --podium-gold-glare: #fef3c7;
  --podium-gold-shadow:
    0 4px 24px rgb(251 191 36 / 35%), 0 1px 0 rgb(255 255 255 / 20%) inset;

  /* Silver stays visible */
  --podium-silver-stop-1: #cbd5e1;
  --podium-silver-stop-2: #94a3b8;
  --podium-silver-stop-3: #64748b;
  --podium-silver-stop-4: #475569;
  --podium-silver-glare: #e2e8f0;
  --podium-silver-shadow:
    0 4px 20px rgb(148 163 184 / 25%), 0 1px 0 rgb(255 255 255 / 15%) inset;

  /* Bronze with brighter warmth */
  --podium-bronze-stop-1: #fed7aa;
  --podium-bronze-stop-2: #fbbf7c;
  --podium-bronze-stop-3: #ea8c44;
  --podium-bronze-stop-4: #9a3412;
  --podium-bronze-glare: #ffedd5;
  --podium-bronze-shadow:
    0 4px 20px rgb(234 140 68 / 28%), 0 1px 0 rgb(255 255 255 / 15%) inset;
  --medal-gold-from: #fcd34d;
  --medal-gold-to: #f59e0b;
  --medal-silver-from: #cbd5e1;
  --medal-silver-to: #64748b;
  --medal-bronze-from: #fed7aa;
  --medal-bronze-to: #ea8c44;
  --text-label: #94a3b8;
  --text-value: #f1f5f9;
  --text-sub: #64748b;
  --text-podium-name: #94a3b8;
  --text-podium-hero: #f1f5f9;
  --text-podium-gmv: #94a3b8;
  --text-podium-gmv-hero: #fbbf24;
  --text-ranking-name: #cbd5e1;
  --text-ranking-gmv: #94a3b8;
  --divider-color: #1e293b;
  --ranking-row-hover: #1e293b;
  --ranking-rank-bg: #1e293b;
  --ranking-rank-fg: #94a3b8;
}

/* ================================================
   Responsive Grids
   ================================================ */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ranking-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .stat-grid {
    gap: 16px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .ranking-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ================================================
   Card
   ================================================ */
.analytics-card {
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--card-border-color) !important;
  border-radius: 24px !important;
  box-shadow: var(--card-shadow);
  transition:
    box-shadow 0.25s ease-out,
    transform 0.25s ease-out;
}

.analytics-card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

.analytics-card :deep(.ant-card-body) {
  padding: 20px;
}

@media (min-width: 768px) {
  .analytics-card :deep(.ant-card-body) {
    padding: 24px;
  }
}

/* Warning card — amber background */
.card-warning {
  background: var(--card-warning-bg) !important;
  border-color: var(--card-warning-border) !important;
}

/* ================================================
   Card Inner
   ================================================ */
.card-inner {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .card-inner {
    gap: 16px;
  }
}

/* Recycle rate card — row layout with circle progress */
.card-inner-recycle {
  align-items: center;
}

.card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
}

@media (min-width: 768px) {
  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }
}

.card-icon-blue {
  color: var(--icon-blue-fg);
  background: var(--icon-blue-bg);
}

.card-icon-amber {
  color: var(--icon-amber-fg);
  background: var(--icon-amber-bg);
}

.card-icon-teal {
  color: var(--icon-teal-fg);
  background: var(--icon-teal-bg);
}

.card-icon-green {
  color: var(--icon-green-fg);
  background: var(--icon-green-bg);
}

.card-icon-red {
  color: var(--icon-red-fg);
  background: var(--icon-red-bg);
}

.card-icon-indigo {
  color: var(--icon-indigo-fg);
  background: var(--icon-indigo-bg);
}

.card-icon-violet {
  color: var(--icon-violet-fg);
  background: var(--icon-violet-bg);
}

.card-text {
  min-width: 0;
}

.card-label {
  font-size: 12px;
  line-height: 1;
  color: var(--text-label);
}

@media (min-width: 768px) {
  .card-label {
    font-size: 13px;
  }
}

.card-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-value);
  letter-spacing: -0.5px;
}

@media (min-width: 768px) {
  .card-value {
    font-size: 28px;
  }
}

.card-value-amber {
  color: #d97706;
}

.dark .card-value-amber {
  color: #fbbf24;
}

.card-value-suffix {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-sub);
}

@media (min-width: 768px) {
  .card-value-suffix {
    font-size: 16px;
  }
}

.card-sub {
  margin-top: 2px;
  font-size: 10px;
  color: var(--text-sub);
  letter-spacing: 0.3px;
}

@media (min-width: 768px) {
  .card-sub {
    font-size: 11px;
  }
}

/* ================================================
   SOP Segmented Progress Bar
   ================================================ */
.sop-segmented-bar {
  padding: 0 2px;
}

.sop-segmented-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: baseline;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.sop-segmented-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-value);
}

.sop-segmented-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: center;
  font-size: 12px;
  color: var(--text-sub);
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-dot-running {
  background: var(--seg-running);
}

.legend-dot-completed {
  background: var(--seg-completed);
}

.legend-dot-terminated {
  background: var(--seg-terminated);
}

.sop-segmented-track {
  display: flex;
  height: 12px;
  overflow: hidden;
  background: hsl(var(--border) / 25%);
  border-radius: 6px;
}

.sop-segmented-fill {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sop-fill-running {
  background: var(--seg-running);
  border-radius: 6px 0 0 6px;
}

.sop-fill-completed {
  background: var(--seg-completed);
}

.sop-fill-terminated {
  background: var(--seg-terminated);
  border-radius: 0 6px 6px 0;
}

/* First segment should have left radius */
.sop-fill-running:first-child {
  border-radius: 6px 0 0 6px;
}

/* Last segment should have right radius */
.sop-segmented-fill:last-child {
  border-radius: 0 6px 6px 0;
}

/* Only one segment: full radius */
.sop-segmented-fill:only-child {
  border-radius: 6px;
}

/* ================================================
   Recycle Rate
   ================================================ */
.recycle-percent-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-value);
}

/* ================================================
   Ranking Card Shell
   ================================================ */
.ranking-card-shell :deep(.ant-card-head) {
  padding: 14px 20px;
  border-bottom: 1px solid var(--divider-color);
}

@media (min-width: 768px) {
  .ranking-card-shell :deep(.ant-card-head) {
    padding: 16px 24px;
  }
}

.ranking-card-shell :deep(.ant-card-head-title) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-value);
}

.ranking-card-shell :deep(.ant-card-body) {
  padding: 20px 16px 16px;
}

@media (min-width: 768px) {
  .ranking-card-shell :deep(.ant-card-body) {
    padding: 24px 20px 20px;
  }
}

.card-extra {
  font-size: 11px;
  color: var(--text-sub);
}

.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.podium-wrapper {
  min-height: 260px;
}

/* ================================================
   Podium Stage — Olympic-style 3-step layout
   ================================================ */
.podium-stage {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  justify-content: center;
  min-height: 240px;
  padding: 0 2px 8px;
}

@media (min-width: 480px) {
  .podium-stage {
    gap: 14px;
    padding: 0 8px 8px;
  }
}

.podium-stage-bd {
  min-height: 270px;
}

/* ================================================
   Podium Column
   ================================================ */
.podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32%;
  max-width: 120px;
}

.podium-col-center {
  z-index: 2;
  width: 36%;
  max-width: 140px;
}

/* ================================================
   Podium Header — name / rank / GMV above block
   ================================================ */
.podium-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  text-align: center;
}

@media (min-width: 480px) {
  .podium-header {
    margin-bottom: 12px;
  }
}

/* Crown */
.podium-crown {
  margin-bottom: 2px;
  color: #f59e0b;
  filter: drop-shadow(0 2px 4px rgb(245 158 11 / 35%));
}

.dark .podium-crown {
  color: #fbbf24;
  filter: drop-shadow(0 2px 6px rgb(251 191 36 / 50%));
}

/* Medal badge */
.podium-medal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 15%);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
}

@media (min-width: 480px) {
  .podium-medal {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
}

.medal-gold {
  background: linear-gradient(
    135deg,
    var(--medal-gold-from),
    var(--medal-gold-to)
  );
}

.medal-silver {
  background: linear-gradient(
    135deg,
    var(--medal-silver-from),
    var(--medal-silver-to)
  );
}

.medal-bronze {
  background: linear-gradient(
    135deg,
    var(--medal-bronze-from),
    var(--medal-bronze-to)
  );
}

/* Name */
.podium-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--text-podium-name);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .podium-name {
    max-width: 120px;
    font-size: 12px;
  }
}

.podium-name-hero {
  max-width: 120px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-podium-hero);
}

@media (min-width: 480px) {
  .podium-name-hero {
    max-width: 140px;
    font-size: 14px;
  }
}

/* GMV */
.podium-gmv {
  margin-top: 1px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-podium-gmv);
}

.podium-gmv-hero {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-podium-gmv-hero);
}

/* ================================================
   Podium Block — metallic gradient step
   ================================================ */
.podium-block {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
}

@media (min-width: 480px) {
  .podium-block {
    border-radius: 10px 10px 0 0;
  }
}

.podium-col-center .podium-block {
  height: 90px;
}

@media (min-width: 480px) {
  .podium-col-center .podium-block {
    height: 120px;
  }
}

.podium-col-side .podium-block {
  height: 66px;
}

@media (min-width: 480px) {
  .podium-col-side .podium-block {
    height: 88px;
  }
}

/* Glare strip */
.podium-block-glare {
  position: absolute;
  top: 0;
  right: 10%;
  left: 10%;
  height: 4px;
  border-radius: 0 0 6px 6px;
  opacity: 0.6;
}

/* Gold block */
.podium-block-gold {
  background: linear-gradient(
    180deg,
    var(--podium-gold-stop-1) 0%,
    var(--podium-gold-stop-2) 30%,
    var(--podium-gold-stop-3) 70%,
    var(--podium-gold-stop-4) 100%
  );
  box-shadow: var(--podium-gold-shadow);
}

.podium-block-gold .podium-block-glare {
  background: var(--podium-gold-glare);
}

/* Silver block */
.podium-block-silver {
  background: linear-gradient(
    180deg,
    var(--podium-silver-stop-1) 0%,
    var(--podium-silver-stop-2) 30%,
    var(--podium-silver-stop-3) 70%,
    var(--podium-silver-stop-4) 100%
  );
  box-shadow: var(--podium-silver-shadow);
}

.podium-block-silver .podium-block-glare {
  background: var(--podium-silver-glare);
}

/* Bronze block */
.podium-block-bronze {
  background: linear-gradient(
    180deg,
    var(--podium-bronze-stop-1) 0%,
    var(--podium-bronze-stop-2) 30%,
    var(--podium-bronze-stop-3) 70%,
    var(--podium-bronze-stop-4) 100%
  );
  box-shadow: var(--podium-bronze-shadow);
}

.podium-block-bronze .podium-block-glare {
  background: var(--podium-bronze-glare);
}

/* Rank number watermark on block */
.podium-block-num {
  font-size: 34px;
  font-weight: 900;
  color: rgb(255 255 255 / 22%);
  letter-spacing: -2px;
  text-shadow: 0 2px 4px rgb(0 0 0 / 8%);
  user-select: none;
}

.podium-col-center .podium-block-num {
  font-size: 44px;
}

@media (min-width: 480px) {
  .podium-col-center .podium-block-num {
    font-size: 56px;
  }

  .podium-col-side .podium-block-num {
    font-size: 40px;
  }
}

/* ================================================
   Animation — Podium enter (rises from bottom)
   ================================================ */
.podium-enter {
  opacity: 0;
  transform: translateY(40px);
}

.animate-ready .podium-enter {
  animation: podium-rise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes podium-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ================================================
   Ranking List (4-10)
   ================================================ */
.ranking-list {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid var(--divider-color);
}

.ranking-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  opacity: 0;
  transform: translateY(12px);
  transition: background-color 0.2s;
}

.animate-ready .ranking-row {
  animation: row-fade-in 0.35s ease-out forwards;
}

@keyframes row-fade-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ranking-row:hover {
  background: var(--ranking-row-hover);
}

.ranking-row-left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.ranking-row-rank {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ranking-rank-fg);
  background: var(--ranking-rank-bg);
  border-radius: 6px;
}

.ranking-row-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--text-ranking-name);
  white-space: nowrap;
}

.ranking-row-gmv {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-ranking-gmv);
}

/* ================================================
   Accessibility — Reduced Motion
   ================================================ */
@media (prefers-reduced-motion: reduce) {
  .podium-enter,
  .animate-ready .podium-enter,
  .ranking-row,
  .animate-ready .ranking-row {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .analytics-card {
    transition: none;
  }
}
</style>
