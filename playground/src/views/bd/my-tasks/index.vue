<script lang="ts" setup>
import type { BdTaskApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, message, Progress, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBdTaskList } from '#/api';
import { getBriefAccessUrl } from '#/api/core';
import { $t } from '#/locales';

import { useColumns } from './data';

const router = useRouter();
const briefLoadingRowIds = ref<number[]>([]);

// TODO: 替换为真实 API 调用 - getMyTaskList()
async function fetchMyTaskList({
  page,
}: {
  page: { currentPage: number; pageSize: number };
}) {
  // const mockData: MyTaskItem[] = [
  //   {
  //     briefUrl: 'https://docs.example.com/brief/skincare.pdf',
  //     commission: 15,
  //     completedVideos: 2,
  //     deadline: Date.parse('2025-06-30'),
  //     hasBudget: 1,
  //     productUrl:
  //       'https://www.tiktok.com/@beauty_guru_th/video/123456',
  //     relationId: 1,
  //     taskId: 1,
  //     totalVideos: 3,
  //   },
  //   {
  //     briefUrl: 'https://docs.example.com/brief/phonecase.pdf',
  //     commission: 12,
  //     completedVideos: 0,
  //     deadline: Date.parse('2025-05-15'),
  //     hasBudget: 0,
  //     productUrl:
  //       'https://www.tiktok.com/@tech_review_th/video/789012',
  //     relationId: 2,
  //     taskId: 2,
  //     totalVideos: 2,
  //   },
  //   {
  //     briefUrl: 'https://docs.example.com/brief/powerbank.pdf',
  //     commission: 18,
  //     completedVideos: 1,
  //     deadline: Date.parse('2025-08-20'),
  //     hasBudget: 1,
  //     productUrl:
  //       'https://www.tiktok.com/@mom_life_th/video/345678',
  //     relationId: 3,
  //     taskId: 3,
  //     totalVideos: 1,
  //   },
  // ];
  let result: BdTaskApi.BdTasListResult = { total: 0, list: [] };
  try {
    const { currentPage, pageSize } = page;
    result = await getBdTaskList({ page: currentPage, pageSize });
  } catch {}
  // 模拟分页

  return {
    items: result.list,
    total: result.total,
  };
}

const [Grid] = useVbenVxeGrid<BdTaskApi.BDTaskRow>({
  gridOptions: {
    columns: useColumns(),
    maxHeight: 560,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          return await fetchMyTaskList({ page });
        },
      },
    },
    rowConfig: { keyField: 'relationId' },
    scrollY: {
      enabled: true,
      gt: 0,
    },
    toolbarConfig: { refresh: true, zoom: true },
  },
});

function resolveProductListingId(row: BdTaskApi.BDTaskRow) {
  return Number(row.productListingId ?? row.product_listing_id ?? 0);
}

function isBriefLoading(row: BdTaskApi.BDTaskRow) {
  return briefLoadingRowIds.value.includes(row.relationId);
}

async function openBriefPreview(row: BdTaskApi.BDTaskRow) {
  const productListingId = resolveProductListingId(row);
  if (productListingId <= 0) {
    message.warning($t('page.bd.my-task.messages.preview-pdf-unavailable'));
    return;
  }

  const previewTab = window.open('', '_blank', 'noopener');

  try {
    briefLoadingRowIds.value = [...briefLoadingRowIds.value, row.relationId];
    const result = await getBriefAccessUrl({
      product_listing_id: productListingId,
    });
    if (previewTab) {
      previewTab.location.href = result.access_url;
      return;
    }
    window.open(result.access_url, '_blank', 'noopener');
  } catch {
    previewTab?.close();
  } finally {
    briefLoadingRowIds.value = briefLoadingRowIds.value.filter(
      (id) => id !== row.relationId,
    );
  }
}

function goPrepare(row: BdTaskApi.BDTaskRow) {
  router.push(`/bd/my-task/${row.relationId}`);
}

function getVideoProgressPercent(row: BdTaskApi.BDTaskRow) {
  const total = Number(row.totalVideos ?? 0);
  const completed = Number(row.completedVideos ?? 0);
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

function isVideoCompleted(row: BdTaskApi.BDTaskRow) {
  const total = Number(row.totalVideos ?? 0);
  return total > 0 && Number(row.completedVideos ?? 0) >= total;
}

function getPrepareSummaryText(row: BdTaskApi.BDTaskRow) {
  if (Number(row.hasPrepareRecords ?? 0) !== 1) {
    return $t('page.bd.my-task.prepare-status.not-submitted');
  }
  return $t('page.bd.my-task.prepare-status.summary', [
    row.prepareTotalCount ?? 0,
    row.preparePendingCount ?? 0,
    row.prepareApprovedCount ?? 0,
    row.prepareRejectedCount ?? 0,
  ]);
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.bd.my-task.title')">
      <template #productUrl="{ row }">
        <a
          :href="row.productUrl"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.productUrl }}
        </a>
      </template>
      <template #briefUrl="{ row }">
        <Button
          type="link"
          size="small"
          :loading="isBriefLoading(row)"
          @click="openBriefPreview(row)"
        >
          {{ $t('page.bd.my-task.actions.preview-pdf') }}
        </Button>
      </template>
      <template #videoProgress="{ row }">
        <div class="min-w-[136px] pr-2 text-center">
          <span
            :class="
              isVideoCompleted(row)
                ? 'font-medium text-success'
                : 'text-foreground'
            "
          >
            {{ row.completedVideos }} / {{ row.totalVideos }}
          </span>
          <Progress
            class="mt-1"
            :percent="getVideoProgressPercent(row)"
            :show-info="false"
            :status="isVideoCompleted(row) ? 'success' : 'active'"
            size="small"
          />
        </div>
      </template>
      <template #prepareSummary="{ row }">
        <template v-if="row.hasPrepareRecords === 1">
          <Space wrap :size="[4, 4]">
            <Tag color="default">
              {{
                $t('page.bd.my-task.prepare-status.total-short', [
                  row.prepareTotalCount,
                ])
              }}
            </Tag>
            <Tag v-if="row.preparePendingCount > 0" color="warning">
              {{
                $t('page.bd.my-task.prepare-status.pending-short', [
                  row.preparePendingCount,
                ])
              }}
            </Tag>
            <Tag v-if="row.prepareApprovedCount > 0" color="success">
              {{
                $t('page.bd.my-task.prepare-status.approved-short', [
                  row.prepareApprovedCount,
                ])
              }}
            </Tag>
            <Tag v-if="row.prepareRejectedCount > 0" color="error">
              {{
                $t('page.bd.my-task.prepare-status.rejected-short', [
                  row.prepareRejectedCount,
                ])
              }}
            </Tag>
            <Tag
              v-if="
                row.preparePendingCount === 0 &&
                row.prepareApprovedCount === 0 &&
                row.prepareRejectedCount === 0
              "
              color="default"
            >
              {{ getPrepareSummaryText(row) }}
            </Tag>
          </Space>
        </template>
        <Tag v-else color="default">
          {{ $t('page.bd.my-task.prepare-status.not-submitted') }}
        </Tag>
      </template>
      <template #hasBudget="{ row }">
        <Tag :color="row.hasBudget ? 'green' : 'default'">
          {{
            row.hasBudget
              ? $t('page.bd.my-task.budget-text.yes')
              : $t('page.bd.my-task.budget-text.no')
          }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="link" @click="goPrepare(row)">
          {{ $t('page.bd.my-task.actions.upload-prepare') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
