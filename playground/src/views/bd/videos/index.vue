<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdVideoApi } from '#/api';

import { markRaw } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBdVideoList } from '#/api';
import { $t } from '#/locales';
import NumberRangeField from '#/views/kol/modules/NumberRangeField.vue';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';

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

function getSopStatusText(status?: number) {
  switch (status) {
    case 0: {
      return $t('page.bd.videos.sop-status.contact');
    }
    case 1: {
      return $t('page.bd.videos.sop-status.sample');
    }
    case 2: {
      return $t('page.bd.videos.sop-status.recover');
    }
    case 3: {
      return $t('page.bd.videos.sop-status.completed');
    }
    case 4: {
      return $t('page.bd.videos.sop-status.remittance');
    }
    case 5: {
      return $t('page.bd.videos.sop-status.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case 0: {
      return 'default';
    }
    case 1: {
      return 'processing';
    }
    case 2: {
      return 'warning';
    }
    case 3: {
      return 'success';
    }
    case 4: {
      return 'processing';
    }
    case 5: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.bd.videos.filters.kol-id'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'upload_time_range',
      label: $t('page.bd.videos.filters.upload-time-range'),
    },
    {
      component: markRaw(NumberRangeField),
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'score_range',
      label: $t('page.bd.videos.filters.score-range'),
      componentProps: {
        max: 100,
        min: 0,
        placeholderEnd: $t('page.bd.videos.filters.range-end'),
        placeholderStart: $t('page.bd.videos.filters.range-start'),
        precision: 0,
      },
    },
    {
      component: markRaw(NumberRangeField),
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'play_count_range',
      label: $t('page.bd.videos.filters.play-count-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.bd.videos.filters.range-end'),
        placeholderStart: $t('page.bd.videos.filters.range-start'),
        precision: 0,
      },
    },
    {
      component: markRaw(NumberRangeField),
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'gmv_range',
      label: $t('page.bd.videos.filters.gmv-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.bd.videos.filters.range-end'),
        placeholderStart: $t('page.bd.videos.filters.range-start'),
        precision: 2,
      },
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<BdVideoApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.bd.videos.columns.kol-id'),
    },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('page.bd.videos.columns.bd-code'),
    },
    {
      field: 'sop_status',
      minWidth: 120,
      slots: { default: 'sop_status' },
      title: $t('page.bd.videos.columns.sop-status'),
    },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.bd.videos.columns.product-url'),
    },
    {
      field: 'video_url',
      minWidth: 220,
      slots: { default: 'video_url' },
      title: $t('page.bd.videos.columns.video-url'),
    },
    {
      field: 'score',
      minWidth: 100,
      slots: { default: 'score' },
      title: $t('page.bd.videos.columns.score'),
    },
    {
      field: 'upload_time',
      minWidth: 180,
      slots: { default: 'upload_time' },
      title: $t('page.bd.videos.columns.upload-time'),
    },
    {
      field: 'ads_code',
      minWidth: 140,
      slots: { default: 'ads_code' },
      title: $t('page.bd.videos.columns.ads-code'),
    },
    {
      field: 'play_count',
      minWidth: 120,
      slots: { default: 'play_count' },
      title: $t('page.bd.videos.columns.play-count'),
    },
    {
      field: 'gmv',
      minWidth: 120,
      slots: { default: 'gmv' },
      title: $t('page.bd.videos.columns.gmv'),
    },
    {
      field: 'commission',
      minWidth: 120,
      slots: { default: 'commission' },
      title: $t('page.bd.videos.columns.commission'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.bd.videos.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.bd.videos.columns.updated-at'),
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

        const result = await getBdVideoList({
          gmv_max: gmvRange.end,
          gmv_min: gmvRange.start,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          play_count_max: playCountRange.end,
          play_count_min: playCountRange.start,
          score_max: scoreRange.end,
          score_min: scoreRange.start,
          task_sop_id: toOptionalNumber(formValues.task_sop_id),
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

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.bd.videos.title')">
      <template #sop_status="{ row }">
        <Tag :color="getSopStatusColor(row.sop_status)">
          {{ getSopStatusText(row.sop_status) }}
        </Tag>
      </template>

      <template #product_url="{ row }">
        <a
          v-if="row.product_url"
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
        <span v-else>-</span>
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
        <Tooltip :title="$t('page.bd.videos.columns.commission-tooltip')">
          <span>{{ formatDecimal(row.commission) }}</span>
        </Tooltip>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>
    </Grid>
  </Page>
</template>
