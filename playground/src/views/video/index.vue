<!-- eslint-disable unicorn/prefer-add-event-listener -->
<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminVideoApi } from '#/api/video';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Button, InputNumber, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdminVideoList, updateAdminVideos } from '#/api/video';
import { $t } from '#/locales';
import NumberRangeField from '#/views/kol/modules/NumberRangeField.vue';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const { componentProps: bdCodeSelectProps } = useAdminBdSelect();

// --- Edit Modal State ---
const editModalOpen = ref(false);
const editSubmitting = ref(false);
const editingRow = ref<AdminVideoApi.ListItem | null>(null);

const editForm = reactive({
  score: undefined as number | undefined,
  play_count: undefined as number | undefined,
  gmv: undefined as number | undefined,
});

const editOriginals = reactive({
  play_count: undefined as number | undefined,
  gmv: undefined as number | undefined,
});

function openEditModal(row: AdminVideoApi.ListItem) {
  editingRow.value = row;
  editForm.score = row.score ?? undefined;
  editForm.play_count = row.play_count ?? undefined;
  editForm.gmv = row.gmv ?? undefined;
  editOriginals.play_count = row.play_count ?? undefined;
  editOriginals.gmv = row.gmv ?? undefined;
  editModalOpen.value = true;
}

function closeEditModal() {
  if (editSubmitting.value) return;
  editModalOpen.value = false;
  editingRow.value = null;
}

async function submitEdit() {
  const row = editingRow.value;
  if (!row) return;

  if (
    editForm.score === undefined ||
    editForm.score === null ||
    Number.isNaN(Number(editForm.score))
  ) {
    message.warning($t('page.video.edit-modal.score-required'));
    return;
  }

  const payload: AdminVideoApi.UpdateItem = {
    video_id: row.id,
    score: Number(editForm.score),
  };

  // Only include play_count / gmv when the value actually changed
  if (
    editForm.play_count !== undefined &&
    editForm.play_count !== editOriginals.play_count
  ) {
    payload.play_count = editForm.play_count;
  }
  if (editForm.gmv !== undefined && editForm.gmv !== editOriginals.gmv) {
    payload.gmv = editForm.gmv;
  }

  try {
    editSubmitting.value = true;
    const result = await updateAdminVideos({ list: [payload] });
    const item = result[0];
    if (item && item.success) {
      message.success($t('page.video.messages.update-success'));
    } else {
      message.error(item?.reason || $t('page.video.messages.update-failed'));
    }
    closeEditModal();
    await gridApi.reload();
  } catch (error: any) {
    message.error(
      error?.response?.data?.message ||
        error?.message ||
        $t('page.video.messages.update-failed'),
    );
  } finally {
    editSubmitting.value = false;
  }
}

// --- Formatters ---
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

// --- Form Options ---
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
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.yes'), value: 1 },
          { label: $t('common.no'), value: 0 },
        ],
      },
      fieldName: 'has_ads_code',
      label: $t('page.video.filters.has-ads-code'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

// --- Grid ---
const gridOptions: VxeTableGridOptions<AdminVideoApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
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
      minWidth: 100,
      slots: { default: 'operation' },
      title: $t('page.video.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const uploadTimeRange = resolveDateRange(formValues.upload_time_range);
        const scoreRange = resolveNumberRange(formValues.score_range);
        const playCountRange = resolveNumberRange(formValues.play_count_range);
        const gmvRange = resolveNumberRange(formValues.gmv_range);

        const result = await getAdminVideoList({
          bd_code: formValues.bd_code?.trim() || undefined,
          gmv_max: gmvRange.end,
          gmv_min: gmvRange.start,
          has_ads_code:
            formValues.has_ads_code !== undefined &&
            formValues.has_ads_code !== ''
              ? Number(formValues.has_ads_code)
              : undefined,
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
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.video.list-title')">
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

      <template #operation="{ row }">
        <Button type="link" size="small" @click="openEditModal(row)">
          {{ $t('page.video.actions.edit') }}
        </Button>
      </template>
    </Grid>

    <!-- Single-Edit Modal -->
    <Modal
      :open="editModalOpen"
      :confirm-loading="editSubmitting"
      :ok-text="$t('page.video.actions.confirm-edit')"
      :cancel-text="$t('common.cancel')"
      :title="$t('page.video.edit-modal.title')"
      @cancel="closeEditModal"
      @ok="submitEdit"
    >
      <template v-if="editingRow">
        <!-- Video Identity -->
        <div class="mb-4 rounded-xl border border-border bg-muted/30 p-4">
          <div class="space-y-1 text-sm leading-6">
            <div class="text-muted-foreground">
              KOL ID：{{ editingRow.kol_id }}
            </div>
            <div class="text-muted-foreground">
              BD：{{ editingRow.bd_code }}
            </div>
          </div>
          <a
            :href="editingRow.video_url"
            target="_blank"
            rel="noreferrer"
            class="mt-1 inline-block text-sm text-blue-500 hover:underline"
          >
            {{ editingRow.video_url }}
          </a>
        </div>

        <!-- Current Values -->
        <div class="mb-5 grid grid-cols-3 gap-3">
          <div
            class="rounded-lg border border-border bg-muted/20 p-3 text-center"
          >
            <div class="text-xs text-muted-foreground">
              {{ $t('page.video.edit-modal.current-score') }}
            </div>
            <div class="mt-1 text-lg font-semibold text-foreground">
              {{ editingRow.score ?? '-' }}
            </div>
          </div>
          <div
            class="rounded-lg border border-border bg-muted/20 p-3 text-center"
          >
            <div class="text-xs text-muted-foreground">
              {{ $t('page.video.edit-modal.current-play-count') }}
            </div>
            <div class="mt-1 text-lg font-semibold text-foreground">
              {{ formatInteger(editingRow.play_count) }}
            </div>
          </div>
          <div
            class="rounded-lg border border-border bg-muted/20 p-3 text-center"
          >
            <div class="text-xs text-muted-foreground">
              {{ $t('page.video.edit-modal.current-gmv') }}
            </div>
            <div class="mt-1 text-lg font-semibold text-foreground">
              {{ formatDecimal(editingRow.gmv) }}
            </div>
          </div>
        </div>

        <!-- Edit Fields -->
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="text-sm font-medium text-foreground">
              {{ $t('page.video.edit-modal.field-score') }}
              <span class="text-red-500">*</span>
            </div>
            <InputNumber
              v-model:value="editForm.score"
              class="w-full"
              :min="0"
              :max="100"
              :precision="0"
              :placeholder="$t('page.video.edit-modal.score-placeholder')"
            />
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium text-foreground">
              {{ $t('page.video.edit-modal.field-play-count') }}
            </div>
            <InputNumber
              v-model:value="editForm.play_count"
              class="w-full"
              :min="0"
              :precision="0"
              :placeholder="$t('page.video.edit-modal.play-count-placeholder')"
            />
          </div>

          <div class="space-y-2">
            <div class="text-sm font-medium text-foreground">
              {{ $t('page.video.edit-modal.field-gmv') }}
            </div>
            <InputNumber
              v-model:value="editForm.gmv"
              class="w-full"
              :min="0"
              :precision="2"
              :placeholder="$t('page.video.edit-modal.gmv-placeholder')"
            />
          </div>
        </div>

        <div class="mt-4 text-xs text-muted-foreground">
          {{ $t('page.video.edit-modal.unchanged-hint') }}
        </div>
      </template>
    </Modal>
  </Page>
</template>
