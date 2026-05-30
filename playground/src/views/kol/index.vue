<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, markRaw, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  TypographyText,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AdminKolApi,
  deleteAdminKol,
  getAdminKolList,
  getAdminKolTagList,
  unbindAdminKol,
  updateAdminKol,
} from '#/api/kol';
import { useAdminKolBdSelect } from '#/api/kol/useAdminKolBdSelect';
import { $t } from '#/locales';
import {
  resolveDateRange,
  toOptionalNumber,
} from '#/views/review/shared/dateRange';

import NumberRangeField from './modules/NumberRangeField.vue';

const router = useRouter();
const { componentProps: bdSelectProps, loadOptions: loadBdOptions } =
  useAdminKolBdSelect();

const detailLoading = ref(false);
const editDrawerOpen = ref(false);
const editSubmitting = ref(false);
const editingRow = ref<AdminKolApi.ListItem | null>(null);
const tagOptionsLoading = ref(false);
const tagOptions = ref<Array<{ label: string; value: string }>>([]);
const unbindingKolId = ref('');

const editForm = reactive<{
  belong_bd_code: string | undefined;
  contact_info: string;
  cooperation_fee: number | undefined;
  followers: number | undefined;
  is_paid: AdminKolApi.PaidStatus;
  kol_link: string;
  notes: string;
  score: number | undefined;
  status: AdminKolApi.KolStatus;
  tag_names: string[];
}>({
  belong_bd_code: undefined,
  contact_info: '',
  cooperation_fee: undefined,
  followers: undefined,
  is_paid: AdminKolApi.PaidStatus.NO,
  kol_link: '',
  notes: '',
  score: undefined,
  status: AdminKolApi.KolStatus.NORMAL,
  tag_names: [],
});

const statusOptions = [
  {
    label: $t('page.kol.filters.all-status'),
    value: undefined,
  },
  {
    label: $t('page.kol.status.normal'),
    value: AdminKolApi.KolStatus.NORMAL,
  },
  {
    label: $t('page.kol.status.lost'),
    value: AdminKolApi.KolStatus.LOST,
  },
  {
    label: $t('page.kol.status.blacklist'),
    value: AdminKolApi.KolStatus.BLACKLIST,
  },
];

const paidOptions = [
  {
    label: $t('page.kol.filters.all-paid'),
    value: undefined,
  },
  {
    label: $t('page.kol.paid.no'),
    value: AdminKolApi.PaidStatus.NO,
  },
  {
    label: $t('page.kol.paid.yes'),
    value: AdminKolApi.PaidStatus.YES,
  },
];

const editStatusOptions = statusOptions.filter(
  (item) => item.value !== undefined,
);
const editPaidOptions = paidOptions.filter((item) => item.value !== undefined);

const currentKolId = computed(() => editingRow.value?.kol_id ?? '-');

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

function getPaidColor(value?: number) {
  return value === AdminKolApi.PaidStatus.YES ? 'blue' : 'default';
}

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatFollowers(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-US').format(value);
}

function formatMetricValue(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
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

function normalizeOptionalString(value: string) {
  return value.trim();
}

function normalizeTagsKeyword(value: string) {
  const items = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items.join(' ') : undefined;
}

async function loadTagOptions() {
  try {
    tagOptionsLoading.value = true;
    const result = await getAdminKolTagList();
    tagOptions.value = result.list.map((item) => ({
      label: item.name,
      value: item.name,
    }));
  } finally {
    tagOptionsLoading.value = false;
  }
}

function goDetail(row: AdminKolApi.ListItem) {
  router.push(`/kol/${encodeURIComponent(row.kol_id)}`);
}

function isUnbinding(row: AdminKolApi.ListItem) {
  return unbindingKolId.value === row.kol_id;
}

function resetEditForm() {
  editForm.belong_bd_code = undefined;
  editForm.contact_info = '';
  editForm.cooperation_fee = undefined;
  editForm.followers = undefined;
  editForm.is_paid = AdminKolApi.PaidStatus.NO;
  editForm.kol_link = '';
  editForm.notes = '';
  editForm.score = undefined;
  editForm.status = AdminKolApi.KolStatus.NORMAL;
  editForm.tag_names = [];
}

async function openEditDrawer(row: AdminKolApi.ListItem) {
  editingRow.value = row;
  editForm.belong_bd_code = row.belong_bd_code ?? undefined;
  editForm.contact_info = row.contact_info ?? '';
  editForm.cooperation_fee = row.cooperation_fee;
  editForm.followers = row.followers;
  editForm.is_paid = row.is_paid;
  editForm.kol_link = row.kol_link ?? '';
  editForm.notes = row.notes ?? '';
  editForm.score = row.score;
  editForm.status = row.status;
  editForm.tag_names = row.tags.map((item) => item.name);
  editDrawerOpen.value = true;
  detailLoading.value = true;
  try {
    await Promise.all([
      loadBdOptions(row.belong_bd_code ?? ''),
      loadTagOptions(),
    ]);
  } finally {
    detailLoading.value = false;
  }
}

function closeEditDrawer() {
  if (editSubmitting.value) {
    return;
  }
  editDrawerOpen.value = false;
  editingRow.value = null;
  resetEditForm();
}

async function submitEdit() {
  if (!editingRow.value) {
    return;
  }

  if (
    editForm.followers !== undefined &&
    (!Number.isFinite(Number(editForm.followers)) ||
      Number(editForm.followers) < 0)
  ) {
    message.warning($t('page.kol.messages.followers-invalid'));
    return;
  }

  if (
    editForm.cooperation_fee !== undefined &&
    (!Number.isFinite(Number(editForm.cooperation_fee)) ||
      Number(editForm.cooperation_fee) < 0)
  ) {
    message.warning($t('page.kol.messages.cooperation-fee-invalid'));
    return;
  }

  if (
    editForm.score !== undefined &&
    (!Number.isFinite(Number(editForm.score)) || Number(editForm.score) < 0)
  ) {
    message.warning($t('page.kol.messages.score-invalid'));
    return;
  }

  try {
    editSubmitting.value = true;
    await updateAdminKol({
      belong_bd_code:
        editForm.belong_bd_code === undefined
          ? ''
          : normalizeOptionalString(editForm.belong_bd_code),
      contact_info: editForm.contact_info.trim(),
      cooperation_fee: editForm.cooperation_fee,
      followers: editForm.followers,
      is_paid: editForm.is_paid,
      kol_id: editingRow.value.kol_id,
      kol_link: editForm.kol_link.trim(),
      notes: editForm.notes.trim(),
      score: editForm.score,
      status: editForm.status,
      tag_names: [
        ...new Set(
          editForm.tag_names.map((item) => item.trim()).filter(Boolean),
        ),
      ],
    });
    message.success($t('page.kol.messages.update-success'));
    editDrawerOpen.value = false;
    editingRow.value = null;
    resetEditForm();
    await gridApi.query();
  } finally {
    editSubmitting.value = false;
  }
}

function confirmDelete(row: AdminKolApi.ListItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('page.kol.delete.confirm-title'),
    content: $t('page.kol.delete.confirm-content', [row.kol_id]),
    async onOk() {
      await deleteAdminKol({ kol_id: row.kol_id });
      message.success($t('page.kol.messages.delete-success', [row.kol_id]));
      await gridApi.query();
    },
  });
}

function confirmUnbind(row: AdminKolApi.ListItem) {
  if (!row.belong_bd_code) {
    return;
  }

  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.kol.unbind.confirm-title'),
    content: $t('page.kol.unbind.confirm-content', [row.kol_id]),
    async onOk() {
      try {
        unbindingKolId.value = row.kol_id;
        const result = await unbindAdminKol({
          kol_id: row.kol_id,
        });
        message.success(
          $t('page.kol.messages.unbind-success', [result.kol_id]),
        );
        await gridApi.query();
      } finally {
        unbindingKolId.value = '';
      }
    },
  });
}

const formOptions: VbenFormProps = {
  collapsed: true,
  collapsedRows: 1,
  showCollapseButton: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.kol.filters.kol-id'),
    },
    {
      component: 'Input',
      fieldName: 'tags',
      label: $t('page.kol.filters.tags'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
      },
      fieldName: 'status',
      label: $t('page.kol.filters.status'),
    },
    {
      component: 'Select',
      componentProps: () => bdSelectProps.value,
      fieldName: 'belong_bd_code',
      label: $t('page.kol.filters.belong-bd-code'),
    },

    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: paidOptions,
      },
      fieldName: 'is_paid',
      label: $t('page.kol.filters.is-paid'),
    },
    {
      component: markRaw(NumberRangeField),
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'followers_range',
      label: $t('page.kol.filters.followers-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.kol.filters.range-end'),
        placeholderStart: $t('page.kol.filters.range-start'),
        precision: 0,
      },
    },
    {
      component: markRaw(NumberRangeField),
      defaultValue: [undefined, undefined],
      disabledOnChangeListener: false,
      fieldName: 'score_range',
      label: $t('page.kol.filters.score-range'),
      componentProps: {
        min: 0,
        placeholderEnd: $t('page.kol.filters.range-end'),
        placeholderStart: $t('page.kol.filters.range-start'),
        precision: 2,
      },
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'entry_time_range',
      label: $t('page.kol.filters.entry-time-range'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminKolApi.ListItem> = {
  stripe: true,
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.kol.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 220,
      slots: { default: 'kol_link' },
      title: $t('page.kol.columns.kol-link'),
    },
    {
      field: 'tags',
      minWidth: 220,
      slots: { default: 'tags' },
      title: $t('page.kol.columns.tags'),
    },
    {
      field: 'followers',
      minWidth: 120,
      slots: { default: 'followers' },
      title: $t('page.kol.columns.followers'),
    },
    {
      field: 'is_paid',
      minWidth: 100,
      slots: { default: 'is_paid' },
      title: $t('page.kol.columns.is-paid'),
    },
    {
      field: 'cooperation_fee',
      minWidth: 120,
      title: $t('page.kol.columns.cooperation-fee'),
    },
    {
      field: 'contact_info',
      minWidth: 180,
      slots: { default: 'contact_info' },
      title: $t('page.kol.columns.contact-info'),
    },
    {
      field: 'belong_bd_code',
      minWidth: 160,
      slots: { default: 'belong_bd_code' },
      title: $t('page.kol.columns.belong-bd-code'),
    },
    {
      field: 'current_prepare_bd_code',
      minWidth: 180,
      slots: { default: 'current_prepare_bd_code' },
      title: $t('page.kol.columns.current-prepare-bd-code'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.kol.columns.status'),
    },
    {
      field: 'score',
      minWidth: 100,
      title: $t('page.kol.columns.score'),
    },
    {
      field: 'participated_task_count',
      minWidth: 120,
      slots: { default: 'participated_task_count' },
      title: $t('page.kol.columns.participated-task-count'),
    },
    {
      field: 'completed_task_count',
      minWidth: 120,
      slots: { default: 'completed_task_count' },
      title: $t('page.kol.columns.completed-task-count'),
    },
    {
      field: 'current_month_gmv',
      minWidth: 130,
      slots: { default: 'current_month_gmv' },
      title: $t('page.kol.columns.current-month-gmv'),
    },
    {
      field: 'current_month_video_count',
      minWidth: 140,
      slots: { default: 'current_month_video_count' },
      title: $t('page.kol.columns.current-month-video-count'),
    },
    {
      field: 'recent_two_month_gmv',
      minWidth: 140,
      slots: { default: 'recent_two_month_gmv' },
      title: $t('page.kol.columns.recent-two-month-gmv'),
    },
    {
      field: 'recent_two_month_video_count',
      minWidth: 150,
      slots: { default: 'recent_two_month_video_count' },
      title: $t('page.kol.columns.recent-two-month-video-count'),
    },
    {
      field: 'notes',
      minWidth: 180,
      slots: { default: 'notes' },
      title: $t('page.kol.columns.notes'),
    },
    {
      field: 'entry_time',
      minWidth: 180,
      slots: { default: 'entry_time' },
      title: $t('page.kol.columns.entry-time'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.kol.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'operation' },
      title: $t('page.kol.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const entryTimeRange = resolveDateRange(formValues.entry_time_range);
        const followersRange = resolveNumberRange(formValues.followers_range);
        const scoreRange = resolveNumberRange(formValues.score_range);
        const result = await getAdminKolList({
          belong_bd_code: formValues.belong_bd_code?.trim() || undefined,
          current_prepare_bd_code:
            formValues.current_prepare_bd_code?.trim() || undefined,
          entry_time_end: entryTimeRange.end,
          entry_time_start: entryTimeRange.start,
          followers_max: followersRange.end,
          followers_min: followersRange.start,
          is_paid: toOptionalNumber(formValues.is_paid) as
            | AdminKolApi.PaidStatus
            | undefined,
          kol_id: formValues.kol_id?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          score_max: scoreRange.end,
          score_min: scoreRange.start,
          status: toOptionalNumber(formValues.status) as
            | AdminKolApi.KolStatus
            | undefined,
          tags: normalizeTagsKeyword(formValues.tags ?? ''),
        });

        return {
          items: result.list,
          total: result.total,
        };
      },
    },
  },
  rowConfig: {
    isHover: true,
    keyField: 'kol_id',
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
    <Grid :table-title="$t('page.kol.list-title')">
      <template #kol_link="{ row }">
        <a
          v-if="row.kol_link"
          :href="row.kol_link"
          target="_blank"
          rel="noreferrer"
          class="cursor-pointer text-blue-500 hover:underline"
        >
          {{ row.kol_link }}
        </a>
        <span v-else>-</span>
      </template>

      <template #tags="{ row }">
        <Space v-if="row.tags?.length" wrap :size="[4, 4]">
          <Tag v-for="tag in row.tags" :key="tag.id">
            {{ tag.name }}
          </Tag>
        </Space>
        <span v-else>-</span>
      </template>

      <template #followers="{ row }">
        <span>{{ formatFollowers(row.followers) }}</span>
      </template>

      <template #is_paid="{ row }">
        <Tag :color="getPaidColor(row.is_paid)">
          {{ getPaidText(row.is_paid) }}
        </Tag>
      </template>

      <template #contact_info="{ row }">
        <Tooltip v-if="row.contact_info" :title="row.contact_info">
          <span class="block max-w-[220px] truncate">
            {{ row.contact_info }}
          </span>
        </Tooltip>
        <span v-else>-</span>
      </template>

      <template #belong_bd_code="{ row }">
        <span>
          {{ row.belong_bd_code || '-' }}
          <template v-if="row.belong_bd_name">
            / {{ row.belong_bd_name }}
          </template>
        </span>
      </template>

      <template #current_prepare_bd_code="{ row }">
        <span>
          {{ row.current_prepare_bd_code || '-' }}
          <template v-if="row.current_prepare_bd_name">
            / {{ row.current_prepare_bd_name }}
          </template>
        </span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #notes="{ row }">
        <span>{{ row.notes || '-' }}</span>
      </template>

      <template #participated_task_count="{ row }">
        <span>{{ formatMetricValue(row.participated_task_count) }}</span>
      </template>

      <template #completed_task_count="{ row }">
        <span>{{ formatMetricValue(row.completed_task_count) }}</span>
      </template>

      <template #current_month_gmv="{ row }">
        <span>{{ formatMetricValue(row.current_month_gmv) }}</span>
      </template>

      <template #current_month_video_count="{ row }">
        <span>{{ formatMetricValue(row.current_month_video_count) }}</span>
      </template>

      <template #recent_two_month_gmv="{ row }">
        <span>{{ formatMetricValue(row.recent_two_month_gmv) }}</span>
      </template>

      <template #recent_two_month_video_count="{ row }">
        <span>{{ formatMetricValue(row.recent_two_month_video_count) }}</span>
      </template>

      <template #entry_time="{ row }">
        <span>{{ formatTimestamp(row.entry_time) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="goDetail(row)">
            {{ $t('page.kol.actions.view') }}
          </Button>
          <Button type="link" size="small" @click="openEditDrawer(row)">
            {{ $t('page.kol.actions.edit') }}
          </Button>
          <Button
            v-if="row.belong_bd_code"
            type="link"
            size="small"
            :loading="isUnbinding(row)"
            @click="confirmUnbind(row)"
          >
            {{ $t('page.kol.actions.unbind') }}
          </Button>
          <Button danger type="link" size="small" @click="confirmDelete(row)">
            {{ $t('page.kol.actions.delete') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.kol.empty')" />
      </template>
    </Grid>

    <Drawer
      :open="editDrawerOpen"
      :title="$t('page.kol.edit.title')"
      :width="560"
      destroy-on-close
      @close="closeEditDrawer"
    >
      <Space direction="vertical" :size="16" class="w-full">
        <Descriptions bordered size="small" :column="1">
          <Descriptions.Item :label="$t('page.kol.columns.kol-id')">
            {{ currentKolId }}
          </Descriptions.Item>
        </Descriptions>

        <Form layout="vertical">
          <Form.Item :label="$t('page.kol.edit.status')">
            <Select
              v-model:value="editForm.status"
              :options="editStatusOptions"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.score')">
            <InputNumber
              v-model:value="editForm.score"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.notes')">
            <Input
              v-model:value="editForm.notes"
              :placeholder="$t('page.kol.edit.notes-placeholder')"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.tags')">
            <Select
              v-model:value="editForm.tag_names"
              mode="tags"
              class="w-full"
              :loading="tagOptionsLoading"
              :options="tagOptions"
              :placeholder="$t('page.kol.edit.tags-placeholder')"
              @dropdown-visible-change="
                (open) => {
                  if (open && tagOptions.length === 0) {
                    void loadTagOptions();
                  }
                }
              "
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.belong-bd-code')">
            <Select
              v-model:value="editForm.belong_bd_code"
              v-bind="bdSelectProps"
              :loading="detailLoading"
              :placeholder="$t('page.kol.edit.belong-bd-placeholder')"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.followers')">
            <InputNumber
              v-model:value="editForm.followers"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.cooperation-fee')">
            <InputNumber
              v-model:value="editForm.cooperation_fee"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.is-paid')">
            <Select
              v-model:value="editForm.is_paid"
              :options="editPaidOptions"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.contact-info')">
            <Input
              v-model:value="editForm.contact_info"
              :placeholder="$t('page.kol.edit.contact-info-placeholder')"
            />
          </Form.Item>

          <Form.Item :label="$t('page.kol.edit.kol-link')">
            <Input
              v-model:value="editForm.kol_link"
              :placeholder="$t('page.kol.edit.kol-link-placeholder')"
            />
          </Form.Item>
        </Form>

        <TypographyText type="secondary">
          {{ $t('page.kol.edit.hint') }}
        </TypographyText>

        <Space>
          <Button type="primary" :loading="editSubmitting" @click="submitEdit">
            {{ $t('page.kol.actions.save') }}
          </Button>
          <Button @click="closeEditDrawer">
            {{ $t('common.cancel') }}
          </Button>
        </Space>
      </Space>
    </Drawer>
  </Page>
</template>
