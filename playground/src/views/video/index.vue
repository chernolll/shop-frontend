<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminVideoApi } from '#/api/video';

import { computed, h, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  InputNumber,
  message,
  Modal,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdminVideoList, scoreAdminVideos } from '#/api/video';
import { $t } from '#/locales';
import NumberRangeField from '#/views/kol/modules/NumberRangeField.vue';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const { componentProps: bdCodeSelectProps } = useAdminBdSelect();

const selectedRows = ref<AdminVideoApi.ListItem[]>([]);
const scoreModalOpen = ref(false);
const scoreSubmitting = ref(false);
const scoreDrafts = ref<
  Array<{
    bd_code: string;
    current_score: null | number;
    kol_id: string;
    score: number | undefined;
    video_id: number;
    video_url: string;
  }>
>([]);

const selectedCount = computed(() => selectedRows.value.length);
const scoreModalTitle = computed(() =>
  scoreDrafts.value.length > 1
    ? $t('page.video.score-modal.batch-title')
    : $t('page.video.score-modal.single-title'),
);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatInteger(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function resolveNumberRange(value: unknown) {
  if (!Array.isArray(value)) {
    return {};
  }
  return {
    end: toOptionalNumber(value[1]),
    start: toOptionalNumber(value[0]),
  };
}

function syncSelectedRows() {
  selectedRows.value =
    ((
      gridApi.grid as any
    )?.getCheckboxRecords?.() as AdminVideoApi.ListItem[]) ?? [];
}

function clearSelections() {
  selectedRows.value = [];
  (gridApi.grid as any)?.clearCheckboxRow?.();
  (gridApi.grid as any)?.clearCheckboxReserve?.();
}

function openScoreModal(rows = selectedRows.value) {
  if (rows.length === 0) {
    message.warning($t('page.video.messages.select-videos-first'));
    return;
  }

  scoreDrafts.value = rows.map((row) => ({
    bd_code: row.bd_code,
    current_score: row.score,
    kol_id: row.kol_id,
    score: row.score ?? undefined,
    video_id: row.id,
    video_url: row.video_url,
  }));
  scoreModalOpen.value = true;
}

function closeScoreModal() {
  if (scoreSubmitting.value) {
    return;
  }
  scoreModalOpen.value = false;
}

function showScoreFailures(result: AdminVideoApi.ScoreResultItem[]) {
  const failedItems = result.filter((item) => !item.success);
  if (failedItems.length === 0) {
    return;
  }

  Modal.warning({
    okText: $t('common.confirm'),
    title: $t('page.video.messages.partial-failed-title'),
    content: h(
      'div',
      { class: 'space-y-2 text-sm leading-6' },
      failedItems.map((item) =>
        h(
          'div',
          { key: item.video_id },
          `#${item.video_id} ${item.reason || $t('page.video.messages.unknown-failure')}`,
        ),
      ),
    ),
  });
}

async function submitScores() {
  if (scoreDrafts.value.length === 0) {
    return;
  }

  if (
    scoreDrafts.value.some(
      (item) =>
        item.score === undefined ||
        item.score === null ||
        Number.isNaN(Number(item.score)),
    )
  ) {
    message.warning($t('page.video.messages.score-required'));
    return;
  }

  try {
    scoreSubmitting.value = true;
    const result = await scoreAdminVideos({
      items: scoreDrafts.value.map((item) => ({
        score: Number(item.score),
        video_id: item.video_id,
      })),
    });

    const successCount = result.filter((item) => item.success).length;
    const failedCount = result.length - successCount;

    if (failedCount === 0) {
      message.success(
        $t('page.video.messages.score-success', [String(successCount)]),
      );
    } else if (successCount === 0) {
      message.warning(
        $t('page.video.messages.score-all-failed', [String(failedCount)]),
      );
    } else {
      message.warning(
        $t('page.video.messages.score-partial-success', [
          String(successCount),
          String(failedCount),
        ]),
      );
    }

    showScoreFailures(result);
    scoreModalOpen.value = false;
    scoreDrafts.value = [];
    clearSelections();
    await gridApi.query();
  } finally {
    scoreSubmitting.value = false;
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.video.filters.kol-id'),
    },
    {
      component: 'Select',
      componentProps: () => bdCodeSelectProps.value,
      fieldName: 'bd_code',
      label: $t('page.video.filters.bd-code'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'upload_time_range',
      label: $t('page.video.filters.upload-time-range'),
    },
    {
      component: NumberRangeField,
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'score_range',
      label: $t('page.video.filters.score-range'),
      componentProps: {
        max: 100,
        min: 0,
        placeholderEnd: $t('page.video.filters.range-end'),
        placeholderStart: $t('page.video.filters.range-start'),
        precision: 0,
      },
    },
    {
      component: NumberRangeField,
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'play_count_range',
      label: $t('page.video.filters.play-count-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.video.filters.range-end'),
        placeholderStart: $t('page.video.filters.range-start'),
        precision: 0,
      },
    },
    {
      component: NumberRangeField,
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'gmv_range',
      label: $t('page.video.filters.gmv-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.video.filters.range-end'),
        placeholderStart: $t('page.video.filters.range-start'),
        precision: 2,
      },
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminVideoApi.ListItem> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.video.columns.kol-id'),
    },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.video.columns.bd-code'),
    },
    {
      field: 'video_url',
      minWidth: 220,
      slots: { default: 'video_url' },
      title: $t('page.video.columns.video-url'),
    },
    {
      field: 'score',
      minWidth: 100,
      slots: { default: 'score' },
      title: $t('page.video.columns.score'),
    },
    {
      field: 'upload_time',
      minWidth: 180,
      slots: { default: 'upload_time' },
      title: $t('page.video.columns.upload-time'),
    },
    {
      field: 'ads_code',
      minWidth: 140,
      slots: { default: 'ads_code' },
      title: $t('page.video.columns.ads-code'),
    },
    {
      field: 'play_count',
      minWidth: 120,
      slots: { default: 'play_count' },
      title: $t('page.video.columns.play-count'),
    },
    {
      field: 'gmv',
      minWidth: 120,
      slots: { default: 'gmv' },
      title: $t('page.video.columns.gmv'),
    },
    {
      field: 'commission',
      minWidth: 120,
      slots: { default: 'commission' },
      title: $t('page.video.columns.commission'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'operation' },
      title: $t('page.video.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const uploadTimeRange = resolveDateRange(formValues.upload_time_range);
        const scoreRange = resolveNumberRange(formValues.score_range);
        const playCountRange = resolveNumberRange(formValues.play_count_range);
        const gmvRange = resolveNumberRange(formValues.gmv_range);

        const result = await getAdminVideoList({
          bd_code: formValues.bd_code?.trim() || undefined,
          gmv_max: gmvRange.end,
          gmv_min: gmvRange.start,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          play_count_max: playCountRange.end,
          play_count_min: playCountRange.start,
          score_max: scoreRange.end,
          score_min: scoreRange.start,
          upload_time_end: uploadTimeRange.end,
          upload_time_start: uploadTimeRange.start,
        });

        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridEvents: {
    'checkbox-all': syncSelectedRows,
    'checkbox-change': syncSelectedRows,
  } as any,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.video.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{ $t('page.video.selected-count', [String(selectedCount)]) }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openScoreModal()"
          >
            {{ $t('page.video.actions.batch-score') }}
          </Button>
        </Space>
      </template>

      <template #video_url="{ row }">
        <a
          :href="row.video_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.video_url }}
        </a>
      </template>

      <template #score="{ row }">
        <span>{{ row.score ?? '-' }}</span>
      </template>

      <template #upload_time="{ row }">
        <span>{{ formatTimestamp(row.upload_time) }}</span>
      </template>

      <template #ads_code="{ row }">
        <span>{{ row.ads_code || '-' }}</span>
      </template>

      <template #play_count="{ row }">
        <span>{{ formatInteger(row.play_count) }}</span>
      </template>

      <template #gmv="{ row }">
        <span>{{ formatDecimal(row.gmv) }}</span>
      </template>

      <template #commission="{ row }">
        <span>{{ formatDecimal(row.commission) }}</span>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Button type="link" size="small" @click="openScoreModal([row])">
          {{ $t('page.video.actions.score') }}
        </Button>
      </template>
    </Grid>

    <Modal
      :open="scoreModalOpen"
      :confirm-loading="scoreSubmitting"
      :ok-text="$t('page.video.actions.confirm-score')"
      :cancel-text="$t('common.cancel')"
      :title="scoreModalTitle"
      @cancel="closeScoreModal"
      @ok="submitScores"
    >
      <Space direction="vertical" :size="16" class="w-full pt-2">
        <div class="text-sm leading-6 text-muted-foreground">
          {{
            $t('page.video.score-modal.description', [
              String(scoreDrafts.length),
            ])
          }}
        </div>

        <div class="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          <div
            v-for="item in scoreDrafts"
            :key="item.video_id"
            class="rounded-xl border border-border bg-muted/30 p-4"
          >
            <div class="mb-3 space-y-1 text-sm leading-6">
              <div>
                {{ $t('page.video.score-modal.kol-id', [item.kol_id]) }}
              </div>
              <div>
                {{ $t('page.video.score-modal.bd-code', [item.bd_code]) }}
              </div>
              <div>
                {{
                  $t('page.video.score-modal.current-score', [
                    String(item.current_score ?? '-'),
                  ])
                }}
              </div>
              <a
                :href="item.video_url"
                target="_blank"
                rel="noreferrer"
                class="text-blue-500 hover:underline"
              >
                {{ item.video_url }}
              </a>
            </div>

            <div class="space-y-2">
              <div class="text-sm font-medium text-foreground">
                {{ $t('page.video.score-modal.score-label') }}
              </div>
              <InputNumber
                v-model:value="item.score"
                class="w-full"
                :min="0"
                :max="100"
                :precision="0"
              />
            </div>
          </div>
        </div>
      </Space>
    </Modal>
  </Page>
</template>
