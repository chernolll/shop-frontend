<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  message,
  Progress,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { BdTaskApi, getBdTaskList } from '#/api';
import { getBriefAccessUrl } from '#/api/core';
import { $t } from '#/locales';

import { useColumns } from './data';

const router = useRouter();
const briefLoadingRowIds = ref<number[]>([]);

// TODO: 替换为真实 API 调用 - getMyTaskList()
async function fetchMyTaskList({
  formValues,
  page,
}: {
  formValues?: Record<string, any>;
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
    const deadlineRange = Array.isArray(formValues?.deadlineRange)
      ? formValues?.deadlineRange
      : [];
    result = await getBdTaskList({
      deadlineEnd: deadlineRange[1] ? Number(deadlineRange[1]) : undefined,
      deadlineStart: deadlineRange[0] ? Number(deadlineRange[0]) : undefined,
      page: currentPage,
      pageSize,
      task_code: formValues?.task_code?.trim() || undefined,
      taskStatus:
        formValues?.taskStatus === undefined
          ? undefined
          : Number(formValues.taskStatus),
    });
  } catch {}
  // 模拟分页

  return {
    items: result.list,
    total: result.total,
  };
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'task_code',
      label: $t('page.bd.my-task.filters.task-code'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'deadlineRange',
      label: $t('page.bd.my-task.filters.deadline-range'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.my-task.placeholders.all-task-status'),
            value: undefined,
          },
          {
            label: $t('page.bd.my-task.task-status.normal'),
            value: BdTaskApi.TaskStatus.NORMAL,
          },
          {
            label: $t('page.bd.my-task.task-status.abandoned'),
            value: BdTaskApi.TaskStatus.ABANDONED,
          },
        ],
      },
      fieldName: 'taskStatus',
      label: $t('page.bd.my-task.filters.task-status'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const [Grid] = useVbenVxeGrid<BdTaskApi.BDTaskRow>({
  formOptions,
  gridOptions: {
    columns: useColumns(),
    maxHeight: 560,
    proxyConfig: {
      ajax: {
        query: async (
          {
            page,
          }: {
            formValues?: Record<string, any>;
            page: { currentPage: number; pageSize: number };
          },
          formValues: Record<string, any> = {},
        ) => {
          return await fetchMyTaskList({ formValues, page });
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

function goPrepare(_row: BdTaskApi.BDTaskRow) {
  router.push({ path: '/bd/kol-prepare' });
}

function resolveTaskStatus(row: BdTaskApi.BDTaskRow) {
  return Number(row.taskStatus ?? row.task_status ?? 0);
}

function isTaskAbandoned(row: BdTaskApi.BDTaskRow) {
  return resolveTaskStatus(row) === 1;
}

function getTaskStatusText(row: BdTaskApi.BDTaskRow) {
  return isTaskAbandoned(row)
    ? $t('page.bd.my-task.task-status.abandoned')
    : $t('page.bd.my-task.task-status.normal');
}

function getTaskStatusColor(row: BdTaskApi.BDTaskRow) {
  return isTaskAbandoned(row) ? 'error' : 'success';
}

function hasMainSkuInfo(row: BdTaskApi.BDTaskRow) {
  return Boolean(
    row.main_sku_code || row.main_sku_name || row.main_sku_status !== undefined,
  );
}

function getMainSkuStatusText(status?: number) {
  return status === 1
    ? $t('page.bd.task-center.product-status.on-sale')
    : $t('page.bd.task-center.product-status.off-shelf');
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
      <template #empty>
        <div class="flex min-h-[220px] items-center justify-center px-6 py-10">
          <Empty
            :description="$t('page.bd.my-task.empty.description')"
            class="max-w-[360px]"
          >
            <template #image>
              <div class="mb-4 text-base font-medium text-foreground">
                {{ $t('page.bd.my-task.empty.title') }}
              </div>
            </template>
          </Empty>
        </div>
      </template>
      <template #task_code="{ row }">
        <Tooltip v-if="hasMainSkuInfo(row)">
          <template #title>
            <div class="space-y-1">
              <div>
                {{ $t('page.bd.task-center.main-sku.code') }}:
                {{ row.main_sku_code || '-' }}
              </div>
              <div>
                {{ $t('page.bd.task-center.main-sku.name') }}:
                {{ row.main_sku_name || '-' }}
              </div>
              <div>
                {{ $t('page.bd.task-center.main-sku.status') }}:
                {{ getMainSkuStatusText(row.main_sku_status) }}
              </div>
            </div>
          </template>
          <span class="cursor-help text-blue-500 hover:underline">
            {{ row.task_code || '-' }}
          </span>
        </Tooltip>
        <span v-else>{{ row.task_code || '-' }}</span>
      </template>
      <template #taskName="{ row }">
        <span>{{ row.taskName || '-' }}</span>
      </template>
      <template #taskTags="{ row }">
        <Space v-if="row.taskTags?.length" :size="[4, 4]" wrap>
          <Tag v-for="tag in row.taskTags" :key="tag" color="blue">
            {{ tag }}
          </Tag>
        </Space>
        <span v-else>-</span>
      </template>
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
      <template #taskStatus="{ row }">
        <Tag :color="getTaskStatusColor(row)">
          {{ getTaskStatusText(row) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space :size="[4, 4]" wrap>
          <Button type="link" @click="goPrepare(row)">
            {{ $t('page.bd.my-task.actions.upload-prepare') }}
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
