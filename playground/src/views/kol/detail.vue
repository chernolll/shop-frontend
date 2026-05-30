<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { AdminKolApi, getAdminKolDetail } from '#/api/kol';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const detail = ref<AdminKolApi.DetailResult | null>(null);

const kolId = computed(() => String(route.params.kol_id ?? ''));

function getStatusText(status?: number) {
  switch (status) {
    case AdminKolApi.KolStatus.BLACKLIST: {
      return $t('page.kol.status.blacklist');
    }
    case AdminKolApi.KolStatus.LOST: {
      return $t('page.kol.status.lost');
    }
    default: {
      return $t('page.kol.status.normal');
    }
  }
}

function getStatusColor(status?: number) {
  switch (status) {
    case AdminKolApi.KolStatus.BLACKLIST: {
      return 'error';
    }
    case AdminKolApi.KolStatus.LOST: {
      return 'warning';
    }
    default: {
      return 'success';
    }
  }
}

function getPaidText(value?: number) {
  return value === AdminKolApi.PaidStatus.YES
    ? $t('page.kol.paid.yes')
    : $t('page.kol.paid.no');
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatMetricValue(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

async function loadDetail() {
  if (!kolId.value) {
    detail.value = null;
    return;
  }

  try {
    loading.value = true;
    detail.value = await getAdminKolDetail({
      kol_id: kolId.value,
    });
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/kol/list');
}

onMounted(() => {
  void loadDetail();
});
</script>

<template>
  <Page auto-content-height>
    <Space direction="vertical" :size="16" class="w-full">
      <Card :bordered="false" class="rounded-2xl shadow-sm">
        <Space direction="vertical" :size="16" class="w-full">
          <Space class="flex w-full items-start justify-between" wrap>
            <div>
              <div class="text-xl font-semibold text-foreground">
                {{ $t('page.kol.detail-title') }}
              </div>
              <div class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ $t('page.kol.detail-description') }}
              </div>
            </div>
            <Tag :color="detail ? getStatusColor(detail.status) : 'default'">
              {{ detail ? getStatusText(detail.status) : '-' }}
            </Tag>
          </Space>

          <Alert
            show-icon
            type="info"
            :message="$t('page.kol.detail-summary.title')"
            :description="$t('page.kol.detail-summary.description')"
            class="rounded-xl"
          />

          <Spin :spinning="loading">
            <Empty
              v-if="!loading && !detail"
              :description="$t('page.kol.messages.detail-empty')"
            />

            <Descriptions v-else-if="detail" bordered size="small" :column="1">
              <Descriptions.Item :label="$t('page.kol.columns.kol-id')">
                {{ detail.kol_id }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.kol-link')">
                <a
                  v-if="detail.kol_link"
                  :href="detail.kol_link"
                  target="_blank"
                  rel="noreferrer"
                  class="cursor-pointer text-blue-500 hover:underline"
                >
                  {{ detail.kol_link }}
                </a>
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.tags')">
                <Space v-if="detail.tags?.length" wrap :size="[4, 4]">
                  <Tag v-for="tag in detail.tags" :key="tag.id">
                    {{ tag.name }}
                  </Tag>
                </Space>
                <span v-else>-</span>
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.followers')">
                {{ detail.followers }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.is-paid')">
                {{ getPaidText(detail.is_paid) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.columns.cooperation-fee')"
              >
                {{ detail.cooperation_fee }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.contact-info')">
                {{ detail.contact_info || '-' }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.belong-bd-code')">
                {{ detail.belong_bd_code || '-' }}
                <template v-if="detail.belong_bd_name">
                  / {{ detail.belong_bd_name }}
                </template>
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.columns.current-prepare-bd-code')"
              >
                {{ detail.current_prepare_bd_code || '-' }}
                <template v-if="detail.current_prepare_bd_name">
                  / {{ detail.current_prepare_bd_name }}
                </template>
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.status')">
                {{ getStatusText(detail.status) }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.score')">
                {{ detail.score }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.notes')">
                {{ detail.notes || '-' }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.entry-time')">
                {{ formatTimestamp(detail.entry_time) }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.created-at')">
                {{ formatTimestamp(detail.created_at) }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('page.kol.columns.updated-at')">
                {{ formatTimestamp(detail.updated_at) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.prepare-pending-count')"
              >
                {{ detail.prepare_pending_count }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.sop-total-count')"
              >
                {{ detail.sop_total_count }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.sop-active-count')"
              >
                {{ detail.sop_active_count }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.video-count')"
              >
                {{ detail.video_count }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.participated-task-count')"
              >
                {{ formatMetricValue(detail.participated_task_count) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.completed-task-count')"
              >
                {{ formatMetricValue(detail.completed_task_count) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.current-month-gmv')"
              >
                {{ formatMetricValue(detail.current_month_gmv) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.current-month-video-count')"
              >
                {{ formatMetricValue(detail.current_month_video_count) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="$t('page.kol.detail-summary.recent-two-month-gmv')"
              >
                {{ formatMetricValue(detail.recent_two_month_gmv) }}
              </Descriptions.Item>
              <Descriptions.Item
                :label="
                  $t('page.kol.detail-summary.recent-two-month-video-count')
                "
              >
                {{ formatMetricValue(detail.recent_two_month_video_count) }}
              </Descriptions.Item>
            </Descriptions>
          </Spin>

          <Space wrap>
            <Button @click="goBack">
              {{ $t('page.kol.actions.back-to-list') }}
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  </Page>
</template>
