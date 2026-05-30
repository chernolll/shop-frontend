<script lang="ts" setup>
import type { BdAnalyticsApi } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';

import { usePreferences } from '@vben/preferences';
import { Card, Empty, Skeleton } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { getBDAnalytics } from '#/api';

const { isDark } = usePreferences();
const loading = ref(true);
const mounted = ref(false);
const data = ref<BdAnalyticsApi.BDAnalyticsResult | null>(null);

onMounted(async () => {
  try {
    data.value = await getBDAnalytics();
  } catch {
    data.value = null;
  } finally {
    loading.value = false;
    // Trigger enter animations after mount
    requestAnimationFrame(() => {
      mounted.value = true;
    });
  }
});

const kolRanking = computed(() => data.value?.kol_sales_ranking ?? []);
const bdRanking = computed(() => data.value?.bd_sales_ranking ?? []);
const kolRest = computed(() => kolRanking.value.slice(3));

function formatCurrency(value: number): string {
  if (value >= 10_000) {
    return `¥${(value / 10_000).toFixed(1)}万`;
  }
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `¥${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `¥${(value / 1000).toFixed(1)}K`;
  }
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}
</script>

<template>
  <Page auto-content-height>
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Skeleton
          v-for="i in 4"
          :key="i"
          active
          :paragraph="{ rows: 1 }"
          :title="{ width: '60%' }"
        />
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton v-for="i in 2" :key="'sk-' + i" active :paragraph="{ rows: 6 }" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!data"
      class="flex min-h-[400px] items-center justify-center"
    >
      <Empty description="数据加载失败，请稍后重试" />
    </div>

    <!-- Dashboard content -->
    <div v-else :class="{ 'animate-ready': mounted, dark: isDark }" class="analytics-root space-y-6">
      <!-- Stat cards: mobile 2-col → lg 4-col -->
      <div class="stat-grid">
        <!-- Monthly GMV -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:currency-usd" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">月度GMV</div>
              <div class="card-value">
                {{ formatCurrency(data.monthly_gmv) }}
              </div>
              <div class="card-sub">GMV MTH.</div>
            </div>
          </div>
        </Card>

        <!-- Monthly completed tasks -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-blue">
              <IconifyIcon icon="mdi:check-circle-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">月度任务完成数</div>
              <div class="card-value">
                {{ data.monthly_completed_tasks }}
              </div>
              <div class="card-sub">Tasks completed MTH.</div>
            </div>
          </div>
        </Card>

        <!-- Deadline 14 days -->
        <Card :bordered="false" class="analytics-card enter-y">
          <div class="card-inner">
            <div class="card-icon card-icon-amber">
              <IconifyIcon icon="mdi:clock-alert-outline" class="size-5" />
            </div>
            <div class="card-text">
              <div class="card-label">14天内到期任务</div>
              <div class="card-value card-value-amber">
                {{ data.deadline_14days_tasks }}
              </div>
              <div class="card-sub">Deadline 14 days Tasks</div>
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
              <div class="card-label">达人总数</div>
              <div class="card-value">
                {{ data.total_kols }}
              </div>
              <div class="card-sub">Total KOL</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Ranking sections: mobile 1-col → lg 2-col -->
      <div class="ranking-grid">
        <!-- KOL Sales Ranking -->
        <Card
          :bordered="false"
          title="KOL 月度销售额排名"
          class="analytics-card ranking-card-shell"
        >
          <template #extra>
            <span class="card-extra">Top 10 · 当月</span>
          </template>

          <div v-if="kolRanking.length === 0" class="empty-placeholder">
            <Empty description="本月暂无销售数据" />
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
                  <div class="podium-name" :title="kolRanking[1]?.kol_name || kolRanking[1]?.kol_id">
                    {{ kolRanking[1]?.kol_name || kolRanking[1]?.kol_id }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(kolRanking[1]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-silver">
                  <div class="podium-block-glare" />
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
                  <div class="podium-name podium-name-hero" :title="kolRanking[0]?.kol_name || kolRanking[0]?.kol_id">
                    {{ kolRanking[0]?.kol_name || kolRanking[0]?.kol_id }}
                  </div>
                  <div class="podium-gmv podium-gmv-hero">
                    {{ formatCompactCurrency(kolRanking[0]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-gold">
                  <div class="podium-block-glare" />
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
                  <div class="podium-name" :title="kolRanking[2]?.kol_name || kolRanking[2]?.kol_id">
                    {{ kolRanking[2]?.kol_name || kolRanking[2]?.kol_id }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(kolRanking[2]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-bronze">
                  <div class="podium-block-glare" />
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
          title="BD 月度销售额排名"
          class="analytics-card ranking-card-shell"
        >
          <template #extra>
            <span class="card-extra">Top 3 · 当月</span>
          </template>

          <div v-if="bdRanking.length === 0" class="empty-placeholder">
            <Empty description="本月暂无销售数据" />
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
                  <div class="podium-name" :title="bdRanking[1]?.bd_name || bdRanking[1]?.bd_code">
                    {{ bdRanking[1]?.bd_name || bdRanking[1]?.bd_code }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(bdRanking[1]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-silver">
                  <div class="podium-block-glare" />
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
                  <div class="podium-name podium-name-hero" :title="bdRanking[0]?.bd_name || bdRanking[0]?.bd_code">
                    {{ bdRanking[0]?.bd_name || bdRanking[0]?.bd_code }}
                  </div>
                  <div class="podium-gmv podium-gmv-hero">
                    {{ formatCompactCurrency(bdRanking[0]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-gold">
                  <div class="podium-block-glare" />
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
                  <div class="podium-name" :title="bdRanking[2]?.bd_name || bdRanking[2]?.bd_code">
                    {{ bdRanking[2]?.bd_name || bdRanking[2]?.bd_code }}
                  </div>
                  <div class="podium-gmv">
                    {{ formatCompactCurrency(bdRanking[2]?.gmv ?? 0) }}
                  </div>
                </div>
                <div class="podium-block podium-block-bronze">
                  <div class="podium-block-glare" />
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

  /* Card surfaces */
  --card-border-color: #e5e7eb;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 4%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 8%);

  /* Podium block gold */
  --podium-gold-stop-1: #fbbf24;
  --podium-gold-stop-2: #f59e0b;
  --podium-gold-stop-3: #d97706;
  --podium-gold-stop-4: #b45309;
  --podium-gold-glare: #fde68a;
  --podium-gold-shadow: 0 4px 20px rgb(180 83 9 / 25%),
    0 1px 0 rgb(255 255 255 / 25%) inset;

  /* Podium block silver */
  --podium-silver-stop-1: #e2e8f0;
  --podium-silver-stop-2: #cbd5e1;
  --podium-silver-stop-3: #94a3b8;
  --podium-silver-stop-4: #64748b;
  --podium-silver-glare: #f1f5f9;
  --podium-silver-shadow: 0 4px 16px rgb(100 116 139 / 20%),
    0 1px 0 rgb(255 255 255 / 30%) inset;

  /* Podium block bronze */
  --podium-bronze-stop-1: #fbbf7c;
  --podium-bronze-stop-2: #ea8c44;
  --podium-bronze-stop-3: #c2410c;
  --podium-bronze-stop-4: #9a3412;
  --podium-bronze-glare: #fed7aa;
  --podium-bronze-shadow: 0 4px 16px rgb(154 52 18 / 22%),
    0 1px 0 rgb(255 255 255 / 20%) inset;

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

  --card-border-color: #1e293b;
  --card-shadow: 0 1px 3px rgb(0 0 0 / 20%);
  --card-shadow-hover: 0 8px 24px rgb(0 0 0 / 40%);

  /* Gold pops brighter against dark bg */
  --podium-gold-stop-1: #fcd34d;
  --podium-gold-stop-2: #fbbf24;
  --podium-gold-stop-3: #f59e0b;
  --podium-gold-stop-4: #b45309;
  --podium-gold-glare: #fef3c7;
  --podium-gold-shadow: 0 4px 24px rgb(251 191 36 / 35%),
    0 1px 0 rgb(255 255 255 / 20%) inset;

  /* Silver stays visible */
  --podium-silver-stop-1: #cbd5e1;
  --podium-silver-stop-2: #94a3b8;
  --podium-silver-stop-3: #64748b;
  --podium-silver-stop-4: #475569;
  --podium-silver-glare: #e2e8f0;
  --podium-silver-shadow: 0 4px 20px rgb(148 163 184 / 25%),
    0 1px 0 rgb(255 255 255 / 15%) inset;

  /* Bronze with brighter warmth */
  --podium-bronze-stop-1: #fed7aa;
  --podium-bronze-stop-2: #fbbf7c;
  --podium-bronze-stop-3: #ea8c44;
  --podium-bronze-stop-4: #9a3412;
  --podium-bronze-glare: #ffedd5;
  --podium-bronze-shadow: 0 4px 20px rgb(234 140 68 / 28%),
    0 1px 0 rgb(255 255 255 / 15%) inset;

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
  border-radius: 24px !important;
  border: 1px solid var(--card-border-color) !important;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.25s ease-out, transform 0.25s ease-out;
  cursor: pointer;
  overflow: hidden;
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

/* ================================================
   Card Inner
   ================================================ */
.card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

@media (min-width: 768px) {
  .card-inner {
    gap: 16px;
  }
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }
}

.card-icon-blue {
  background: var(--icon-blue-bg);
  color: var(--icon-blue-fg);
}

.card-icon-amber {
  background: var(--icon-amber-bg);
  color: var(--icon-amber-fg);
}

.card-text {
  min-width: 0;
}

.card-label {
  font-size: 12px;
  color: var(--text-label);
  line-height: 1;
}

@media (min-width: 768px) {
  .card-label {
    font-size: 13px;
  }
}

.card-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-value);
  line-height: 1.2;
  margin-top: 6px;
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

.card-sub {
  font-size: 10px;
  color: var(--text-sub);
  margin-top: 2px;
  letter-spacing: 0.3px;
}

@media (min-width: 768px) {
  .card-sub {
    font-size: 11px;
  }
}

/* ================================================
   Ranking Card Shell
   ================================================ */
.ranking-card-shell :deep(.ant-card-head) {
  border-bottom: 1px solid var(--divider-color);
  padding: 14px 20px;
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
  min-height: 260px;
  align-items: center;
  justify-content: center;
}

.podium-wrapper {
  min-height: 260px;
}

/* ================================================
   Podium Stage — Olympic-style 3-step layout
   ================================================ */
.podium-stage {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  padding: 0 2px 8px;
  min-height: 240px;
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
  width: 36%;
  max-width: 140px;
  z-index: 2;
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
  color: #f59e0b;
  margin-bottom: 2px;
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
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
  text-shadow: 0 1px 2px rgb(0 0 0 / 15%);
}

@media (min-width: 480px) {
  .podium-medal {
    width: 30px;
    height: 30px;
    font-size: 13px;
  }
}

.medal-gold {
  background: linear-gradient(135deg, var(--medal-gold-from), var(--medal-gold-to));
}

.medal-silver {
  background: linear-gradient(135deg, var(--medal-silver-from), var(--medal-silver-to));
}

.medal-bronze {
  background: linear-gradient(135deg, var(--medal-bronze-from), var(--medal-bronze-to));
}

/* Name */
.podium-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-podium-name);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

@media (min-width: 480px) {
  .podium-name {
    font-size: 12px;
    max-width: 120px;
  }
}

.podium-name-hero {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-podium-hero);
  max-width: 120px;
}

@media (min-width: 480px) {
  .podium-name-hero {
    font-size: 14px;
    max-width: 140px;
  }
}

/* GMV */
.podium-gmv {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-podium-gmv);
  margin-top: 1px;
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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
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
  left: 10%;
  right: 10%;
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
  user-select: none;
  text-shadow: 0 2px 4px rgb(0 0 0 / 8%);
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
  border-top: 1px solid var(--divider-color);
  padding-top: 12px;
  margin-top: 4px;
}

.ranking-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 10px;
  transition: background-color 0.2s;
  opacity: 0;
  transform: translateY(12px);
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
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ranking-row-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--ranking-rank-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--ranking-rank-fg);
  flex-shrink: 0;
}

.ranking-row-name {
  font-size: 13px;
  color: var(--text-ranking-name);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-row-gmv {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-ranking-gmv);
  flex-shrink: 0;
  margin-left: 12px;
  font-variant-numeric: tabular-nums;
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
