<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  abandonAdminTask,
  AdminTaskApi,
  assignBDToPublicTask,
  createAdminTask,
  dispatchPublicTaskToBD,
  getAdminBdList,
  getAdminProductListingList,
  getAdminTaskList,
  getAdminTaskRelations,
} from '#/api/bd/tasks';
import { getBriefAccessUrl } from '#/api/core/file';
import { $t } from '#/locales';

interface BdOption {
  disabled?: boolean;
  label: string;
  value: string;
}

interface ProductOption {
  disabled?: boolean;
  label: string;
  value: number;
}

const createModalOpen = ref(false);
const createSubmitting = ref(false);
const bdOptionsLoading = ref(false);
const bdOptions = ref<BdOption[]>([]);
const productOptionsLoading = ref(false);
const productRawOptions = ref<AdminTaskApi.ProductListingListItem[]>([]);

const relationsDrawerOpen = ref(false);
const relationsLoading = ref(false);
const relationTask = ref<AdminTaskApi.ListItem | null>(null);
const relationData = ref<AdminTaskApi.RelationsResult | null>(null);

const briefViewLoading = ref<Record<number, boolean>>({});

async function viewBrief(productListingId: number, rowKey: number) {
  briefViewLoading.value = { ...briefViewLoading.value, [rowKey]: true };
  try {
    const result = await getBriefAccessUrl({
      product_listing_id: productListingId,
    });
    window.open(result.access_url, '_blank', 'noreferrer');
  } catch {
    message.warning($t('page.product.listing.messages.brief-not-found'));
  } finally {
    briefViewLoading.value = { ...briefViewLoading.value, [rowKey]: false };
  }
}

const createForm = reactive<{
  bd_codes: string[];
  commission: number | undefined;
  deadline: string | undefined;
  name: string;
  product_listing_id: number | undefined;
  tags: string[];
  type: AdminTaskApi.TaskType;
  video_num: number | undefined;
}>({
  bd_codes: [],
  commission: undefined,
  deadline: undefined,
  name: '',
  product_listing_id: undefined,
  tags: [],
  type: AdminTaskApi.TaskType.CUSTOM,
  video_num: undefined,
});

const taskTypeOptions = [
  {
    label: $t('page.bd.task-center.task-type-text.custom'),
    value: AdminTaskApi.TaskType.CUSTOM,
  },
  {
    label: $t('page.bd.task-center.task-type-text.public'),
    value: AdminTaskApi.TaskType.PUBLIC,
  },
];

const statusOptions = [
  {
    label: $t('page.bd.task-center.status-text.normal'),
    value: AdminTaskApi.Status.NORMAL,
  },
  {
    label: $t('page.bd.task-center.status-text.abandoned'),
    value: AdminTaskApi.Status.ABANDONED,
  },
];

const normalizedBdCodes = computed(() => [
  ...new Set(
    createForm.bd_codes
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.toUpperCase()),
  ),
]);

const filterProductOptions = computed<ProductOption[]>(() =>
  productRawOptions.value.map((item) => ({
    label: buildProductOptionLabel(item),
    value: item.id,
  })),
);

const createProductOptions = computed<ProductOption[]>(() =>
  productRawOptions.value.map((item) => ({
    disabled: item.status !== AdminTaskApi.ProductListingStatus.ON_SALE,
    label: buildProductOptionLabel(item),
    value: item.id,
  })),
);

function getBdStatusText(status?: number) {
  return status === AdminTaskApi.BdStatus.LEFT
    ? $t('page.bd.task-center.bd-status.left')
    : $t('page.bd.task-center.bd-status.active');
}

function getProductStatusText(status?: number) {
  return status === AdminTaskApi.ProductListingStatus.ON_SALE
    ? $t('page.bd.task-center.product-status.on-sale')
    : $t('page.bd.task-center.product-status.off-shelf');
}

function buildProductOptionLabel(item: AdminTaskApi.ProductListingListItem) {
  const shopPart = item.shop_name ? `${item.shop_name} / ` : '';
  return `#${item.id} ${shopPart}${item.product_url} (${getProductStatusText(item.status)})`;
}

async function loadBdOptions(search = '') {
  try {
    bdOptionsLoading.value = true;
    const result = await getAdminBdList({
      bd_code: search.trim() || undefined,
      page: 1,
      page_size: 100,
    });
    bdOptions.value = result.list.map((item) => ({
      disabled: item.status === AdminTaskApi.BdStatus.LEFT,
      label: `${item.bd_code} - ${item.employee_name || item.employee_no} (${getBdStatusText(item.status)})`,
      value: item.bd_code,
    }));
  } finally {
    bdOptionsLoading.value = false;
  }
}

async function loadProductOptions(search = '') {
  try {
    productOptionsLoading.value = true;
    const keyword = search.trim();
    const numericId = Number(keyword);
    const result = await getAdminProductListingList({
      page: 1,
      page_size: 100,
      product_listing_id:
        keyword && Number.isFinite(numericId) && numericId > 0
          ? numericId
          : undefined,
      product_url:
        keyword && (!Number.isFinite(numericId) || numericId <= 0)
          ? keyword
          : undefined,
    });
    productRawOptions.value = result.list;
  } finally {
    productOptionsLoading.value = false;
  }
}

const relationColumns = [
  {
    dataIndex: 'bd_code',
    key: 'bd_code',
    title: $t('page.bd.task-center.relations.columns.bd-code'),
    width: 140,
  },
  {
    dataIndex: 'video_quantity',
    key: 'video_quantity',
    title: $t('page.bd.task-center.relations.columns.video-quantity'),
    width: 140,
  },
  {
    dataIndex: 'follow_entry_time',
    key: 'follow_entry_time',
    title: $t('page.bd.task-center.relations.columns.follow-entry-time'),
    customRender: ({ value }: { value: null | number }) =>
      formatTimestamp(value),
    width: 180,
  },
];

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function toOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

function isTaskAbandoned(row: AdminTaskApi.ListItem) {
  return row.status === AdminTaskApi.Status.ABANDONED;
}

function getStatusText(status?: number) {
  return status === AdminTaskApi.Status.ABANDONED
    ? $t('page.bd.task-center.status-text.abandoned')
    : $t('page.bd.task-center.status-text.normal');
}

function getStatusColor(status?: number) {
  return status === AdminTaskApi.Status.ABANDONED ? 'error' : 'success';
}

function getTaskTypeText(type?: number) {
  return type === AdminTaskApi.TaskType.PUBLIC
    ? $t('page.bd.task-center.task-type-text.public')
    : $t('page.bd.task-center.task-type-text.custom');
}

const TAG_COLORS = [
  'blue',
  'purple',
  'cyan',
  'green',
  'orange',
  'magenta',
  'gold',
  'geekblue',
] as const;

function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length] ?? 'default';
}

function resetCreateForm() {
  createForm.bd_codes = [];
  createForm.commission = undefined;
  createForm.deadline = undefined;
  createForm.name = '';
  createForm.product_listing_id = undefined;
  createForm.tags = [];
  createForm.type = AdminTaskApi.TaskType.CUSTOM;
  createForm.video_num = undefined;
}

// 分配 BD 到公开任务
const assignModalOpen = ref(false);
const assignSubmitting = ref(false);
const assignTaskRow = ref<AdminTaskApi.ListItem | null>(null);
const assignBdCodes = ref<string[]>([]);
const assignVideoQuantity = ref<number>(1);

function openAssignModal(row: AdminTaskApi.ListItem) {
  assignTaskRow.value = row;
  assignBdCodes.value = [];
  assignVideoQuantity.value = 1;
  void loadBdOptions();
  assignModalOpen.value = true;
}

function closeAssignModal() {
  if (assignSubmitting.value) return;
  assignModalOpen.value = false;
}

async function submitAssign() {
  if (!assignTaskRow.value) return;
  const codes = [
    ...new Set(
      assignBdCodes.value
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toUpperCase()),
    ),
  ];
  if (codes.length === 0) {
    message.warning('请选择至少一个 BD');
    return;
  }

  try {
    assignSubmitting.value = true;
    await assignBDToPublicTask({
      bd_codes: codes,
      task_id: assignTaskRow.value.task_id,
      video_quantity:
        assignVideoQuantity.value > 0 ? assignVideoQuantity.value : 1,
    });
    assignModalOpen.value = false;
    message.success('BD 分配成功');
    await gridApi.query();
  } finally {
    assignSubmitting.value = false;
  }
}

// --- Dispatch ---

const dispatchModalOpen = ref(false);
const dispatchSubmitting = ref(false);
const dispatchTaskRow = ref<AdminTaskApi.ListItem | null>(null);
const dispatchBdCodes = ref<string[]>([]);
const dispatchVideoNum = ref<number>(1);
const dispatchCommission = ref<number>(0);

function openDispatchModal(row: AdminTaskApi.ListItem) {
  dispatchTaskRow.value = row;
  dispatchBdCodes.value = [];
  dispatchVideoNum.value = row.video_num || 1;
  dispatchCommission.value = row.commission;
  void loadBdOptions();
  dispatchModalOpen.value = true;
}

function closeDispatchModal() {
  if (dispatchSubmitting.value) return;
  dispatchModalOpen.value = false;
}

async function submitDispatch() {
  if (!dispatchTaskRow.value) return;
  const codes = [
    ...new Set(
      dispatchBdCodes.value
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toUpperCase()),
    ),
  ];
  if (codes.length === 0) {
    message.warning($t('page.bd.task-center.dispatch.select-bd-required'));
    return;
  }
  if (dispatchVideoNum.value <= 0) {
    message.warning($t('page.bd.task-center.dispatch.video-num-required'));
    return;
  }

  try {
    dispatchSubmitting.value = true;
    await dispatchPublicTaskToBD({
      bd_codes: codes,
      commission: dispatchCommission.value || undefined,
      deadline: undefined,
      public_task_id: dispatchTaskRow.value.task_id,
      video_num: dispatchVideoNum.value,
    });
    dispatchModalOpen.value = false;
    message.success($t('page.bd.task-center.dispatch.dispatch-success'));
    await gridApi.query();
  } finally {
    dispatchSubmitting.value = false;
  }
}

function openCreateModal() {
  resetCreateForm();
  void loadBdOptions();
  void loadProductOptions();
  createModalOpen.value = true;
}

function closeCreateModal() {
  if (createSubmitting.value) {
    return;
  }
  createModalOpen.value = false;
}

async function submitCreateTask() {
  if (!createForm.product_listing_id || createForm.product_listing_id <= 0) {
    message.warning(
      $t('page.bd.task-center.messages.product-listing-id-required'),
    );
    return;
  }
  if (!createForm.commission || createForm.commission <= 0) {
    message.warning($t('page.bd.task-center.messages.commission-required'));
    return;
  }
  if (
    createForm.type === AdminTaskApi.TaskType.CUSTOM &&
    (!createForm.video_num || createForm.video_num <= 0)
  ) {
    message.warning($t('page.bd.task-center.messages.video-num-required'));
    return;
  }
  if (
    createForm.type === AdminTaskApi.TaskType.CUSTOM &&
    normalizedBdCodes.value.length === 0
  ) {
    message.warning($t('page.bd.task-center.messages.bd-codes-required'));
    return;
  }

  try {
    createSubmitting.value = true;
    const result = await createAdminTask({
      bd_codes:
        createForm.type === AdminTaskApi.TaskType.CUSTOM
          ? normalizedBdCodes.value
          : [],
      commission: createForm.commission,
      deadline: toOptionalNumber(createForm.deadline),
      name: createForm.name.trim() || undefined,
      product_listing_id: createForm.product_listing_id,
      tags: createForm.tags.length > 0 ? createForm.tags : undefined,
      type: createForm.type,
      video_num:
        createForm.type === AdminTaskApi.TaskType.CUSTOM
          ? (createForm.video_num ?? 0)
          : 0,
    });

    createModalOpen.value = false;
    message.success(
      $t('page.bd.task-center.messages.create-success', [
        String(result.task_id),
      ]),
    );
    await gridApi.query();
  } finally {
    createSubmitting.value = false;
  }
}

async function openRelationsDrawer(row: AdminTaskApi.ListItem) {
  relationTask.value = row;
  relationData.value = null;
  relationsDrawerOpen.value = true;

  try {
    relationsLoading.value = true;
    relationData.value = await getAdminTaskRelations({
      task_id: row.task_id,
    });
  } finally {
    relationsLoading.value = false;
  }
}

function closeRelationsDrawer() {
  relationsDrawerOpen.value = false;
}

function confirmAbandonTask(row: AdminTaskApi.ListItem) {
  Modal.confirm({
    content: $t('page.bd.task-center.abandon.confirm-content', [
      String(row.task_id),
    ]),
    okText: $t('page.bd.task-center.abandon.confirm-ok'),
    title: $t('page.bd.task-center.abandon.confirm-title'),
    async onOk() {
      const result = await abandonAdminTask({ task_id: row.task_id });
      message.success(
        $t('page.bd.task-center.messages.abandon-success', [
          String(result.task_id),
          String(result.terminated_sop_count),
        ]),
      );
      if (relationTask.value?.task_id === row.task_id) {
        relationTask.value = { ...row, status: AdminTaskApi.Status.ABANDONED };
        if (relationData.value) {
          relationData.value = {
            ...relationData.value,
            status: AdminTaskApi.Status.ABANDONED,
          };
        }
      }
      await gridApi.query();
    },
  });
}

const formOptions: VbenFormProps = {
  collapsed: true,
  collapsedRows: 1,
  showCollapseButton: true,
  schema: [
    // {
    //   component: 'Input',
    //   fieldName: 'task_id',
    //   label: $t('page.bd.task-center.filters.task-id'),
    // },
    {
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        loading: productOptionsLoading.value,
        onDropdownVisibleChange: (open: boolean) => {
          if (open) {
            void loadProductOptions();
          }
        },
        onSearch: (value: string) => {
          void loadProductOptions(value);
        },
        options: filterProductOptions.value,
        placeholder: $t('page.bd.task-center.filters.product-placeholder'),
        showSearch: true,
      }),
      fieldName: 'product_listing_id',
      label: $t('page.bd.task-center.filters.product-listing-id'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.task-center.filters.all-status'),
            value: undefined,
          },
          ...statusOptions,
        ],
      },
      fieldName: 'status',
      label: $t('page.bd.task-center.filters.status'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.task-center.filters.all-type'),
            value: undefined,
          },
          ...taskTypeOptions,
        ],
      },
      fieldName: 'type',
      label: $t('page.bd.task-center.filters.type'),
    },
    {
      component: 'RangePicker',
      componentProps: {
        valueFormat: 'x',
      },
      fieldName: 'deadline_range',
      label: $t('page.bd.task-center.filters.deadline-range'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminTaskApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'task_code',
      minWidth: 180,
      slots: { default: 'task_code' },
      title: $t('page.bd.task-center.columns.task-code'),
    },
    {
      field: 'name',
      minWidth: 160,
      slots: { default: 'name' },
      title: $t('page.bd.task-center.columns.name'),
    },
    {
      field: 'tags',
      minWidth: 180,
      slots: { default: 'tags' },
      title: $t('page.bd.task-center.columns.tags'),
    },
    {
      field: 'product_url',
      minWidth: 220,
      slots: { default: 'product_url' },
      title: $t('page.bd.task-center.columns.product-url'),
    },
    {
      field: 'commission',
      minWidth: 120,
      title: $t('page.bd.task-center.columns.commission'),
    },
    {
      field: 'brief',
      minWidth: 120,
      slots: { default: 'brief' },
      title: $t('page.product.listing.columns.brief'),
    },
    {
      field: 'video_num',
      minWidth: 120,
      title: $t('page.bd.task-center.columns.video-num'),
    },
    {
      field: 'bd_count',
      minWidth: 120,
      title: $t('page.bd.task-center.columns.bd-count'),
    },
    {
      field: 'deadline',
      minWidth: 180,
      slots: { default: 'deadline' },
      title: $t('page.bd.task-center.columns.deadline'),
    },
    {
      field: 'type',
      minWidth: 120,
      slots: { default: 'type' },
      title: $t('page.bd.task-center.columns.type'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.bd.task-center.columns.status'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.bd.task-center.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.bd.task-center.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 180,
      slots: { default: 'operation' },
      title: $t('page.bd.task-center.columns.operation'),
    },
  ],
  stripe: true,
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminTaskList({
          deadline_end: Array.isArray(formValues.deadline_range)
            ? toOptionalNumber(formValues.deadline_range[1])
            : undefined,
          deadline_start: Array.isArray(formValues.deadline_range)
            ? toOptionalNumber(formValues.deadline_range[0])
            : undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          product_listing_id: toOptionalNumber(formValues.product_listing_id),
          status: toOptionalNumber(formValues.status) as
            | AdminTaskApi.Status
            | undefined,
          task_id: toOptionalNumber(formValues.task_id),
          type: toOptionalNumber(formValues.type) as
            | AdminTaskApi.TaskType
            | undefined,
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
    keyField: 'task_id',
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
    <Grid :table-title="$t('page.bd.task-center.list-title')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreateModal">
          {{ $t('page.bd.task-center.actions.create') }}
        </Button>
      </template>

      <template #task_code="{ row }">
        <Tooltip>
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
                {{ getProductStatusText(row.main_sku_status) }}
              </div>
            </div>
          </template>
          <span class="cursor-pointer text-blue-500 hover:underline">
            {{ row.task_code || '-' }}
          </span>
        </Tooltip>
      </template>

      <template #name="{ row }">
        <span>{{ row.name || '-' }}</span>
      </template>

      <template #tags="{ row }">
        <Space v-if="row.tags?.length" :size="[4, 4]" wrap>
          <Tag v-for="(tag, i) in row.tags" :key="tag" :color="getTagColor(i)">
            {{ tag }}
          </Tag>
        </Space>
        <span v-else>-</span>
      </template>

      <template #product_url="{ row }">
        <Space direction="vertical" :size="4">
          <a
            v-if="row.product_url"
            :href="row.product_url"
            target="_blank"
            rel="noreferrer"
            class="cursor-pointer text-blue-500 hover:underline"
          ></a>

          <span v-else>-</span>
        </Space>
      </template>

      <template #brief="{ row }">
        <Button
          type="link"
          size="small"
          :loading="briefViewLoading[row.task_id]"
          @click="viewBrief(row.product_listing_id, row.task_id)"
        >
          {{ $t('page.product.listing.actions.view-brief') }}
        </Button>
      </template>

      <template #deadline="{ row }">
        <span>{{ formatTimestamp(row.deadline) }}</span>
      </template>

      <template #type="{ row }">
        <Tag
          :color="row.type === AdminTaskApi.TaskType.PUBLIC ? 'purple' : 'blue'"
        >
          {{ getTaskTypeText(row.type) }}
        </Tag>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openRelationsDrawer(row)">
            {{ $t('page.bd.task-center.actions.view-relations') }}
          </Button>
          <Button
            v-if="
              row.type === AdminTaskApi.TaskType.PUBLIC && !isTaskAbandoned(row)
            "
            type="link"
            size="small"
            @click="openAssignModal(row)"
          >
            分配BD
          </Button>
          <Button
            v-if="
              row.type === AdminTaskApi.TaskType.PUBLIC && !isTaskAbandoned(row)
            "
            type="link"
            size="small"
            @click="openDispatchModal(row)"
          >
            派送
          </Button>
          <Button
            danger
            type="link"
            size="small"
            :disabled="isTaskAbandoned(row)"
            @click="confirmAbandonTask(row)"
          >
            {{ $t('page.bd.task-center.actions.abandon') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.bd.task-center.empty')" />
      </template>
    </Grid>

    <Modal
      :open="createModalOpen"
      :confirm-loading="createSubmitting"
      :ok-text="$t('page.bd.task-center.actions.confirm-create')"
      :cancel-text="$t('common.cancel')"
      :title="$t('page.bd.task-center.create-modal.title')"
      @cancel="closeCreateModal"
      @ok="submitCreateTask"
    >
      <Form layout="vertical" class="pt-2">
        <FormItem
          :label="$t('page.bd.task-center.create-modal.product-listing-id')"
          required
        >
          <Select
            v-model:value="createForm.product_listing_id"
            class="w-full"
            :loading="productOptionsLoading"
            :options="createProductOptions"
            :placeholder="
              $t('page.bd.task-center.create-modal.product-placeholder')
            "
            :filter-option="false"
            show-search
            @search="
              (value) => {
                void loadProductOptions(value);
              }
            "
            @dropdown-visible-change="
              (open) => {
                if (open) {
                  void loadProductOptions();
                }
              }
            "
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.create-modal.name')">
          <Input
            v-model:value="createForm.name"
            class="w-full"
            :placeholder="
              $t('page.bd.task-center.create-modal.name-placeholder')
            "
            :maxlength="200"
            allow-clear
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.create-modal.tags')">
          <Select
            v-model:value="createForm.tags"
            mode="tags"
            class="w-full"
            :placeholder="
              $t('page.bd.task-center.create-modal.tags-placeholder')
            "
            :options="[]"
          />
        </FormItem>

        <FormItem
          :label="$t('page.bd.task-center.create-modal.commission')"
          required
        >
          <InputNumber
            v-model:value="createForm.commission"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </FormItem>

        <FormItem
          v-if="createForm.type === AdminTaskApi.TaskType.CUSTOM"
          :label="$t('page.bd.task-center.create-modal.video-num')"
          required
        >
          <InputNumber
            v-model:value="createForm.video_num"
            class="w-full"
            :min="1"
            :precision="0"
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.create-modal.deadline')">
          <DatePicker
            v-model:value="createForm.deadline"
            class="w-full"
            value-format="x"
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.create-modal.type')">
          <Select
            v-model:value="createForm.type"
            class="w-full"
            :options="taskTypeOptions"
          />
        </FormItem>

        <FormItem
          v-if="createForm.type === AdminTaskApi.TaskType.CUSTOM"
          :label="$t('page.bd.task-center.create-modal.bd-codes')"
          required
        >
          <Select
            v-model:value="createForm.bd_codes"
            mode="multiple"
            class="w-full"
            :loading="bdOptionsLoading"
            :options="bdOptions"
            :placeholder="
              $t('page.bd.task-center.create-modal.bd-codes-placeholder')
            "
            :filter-option="false"
            show-search
            @search="loadBdOptions"
            @dropdown-visible-change="
              (open) => {
                if (open) {
                  void loadBdOptions();
                }
              }
            "
          />
        </FormItem>
      </Form>
    </Modal>

    <Drawer
      :open="relationsDrawerOpen"
      :title="$t('page.bd.task-center.relations.title')"
      width="720"
      @close="closeRelationsDrawer"
    >
      <Space direction="vertical" :size="16" class="w-full">
        <div v-if="relationTask" class="flex flex-wrap items-center gap-3">
          <span
            v-if="relationData?.name || relationTask.name"
            class="text-base font-semibold"
          >
            {{ relationData?.name || relationTask.name }}
          </span>
          <Tag
            v-for="(tag, i) in relationData?.tags || relationTask.tags || []"
            :key="tag"
            :color="getTagColor(i)"
          >
            {{ tag }}
          </Tag>
          <Tag color="blue">
            {{
              $t('page.bd.task-center.relations.task-id', [
                relationTask.task_id,
              ])
            }}
          </Tag>
          <Tag
            :color="getStatusColor(relationData?.status ?? relationTask.status)"
          >
            {{ getStatusText(relationData?.status ?? relationTask.status) }}
          </Tag>
          <Tag color="default">
            {{
              $t('page.bd.task-center.relations.video-num', [
                relationData?.video_num ?? relationTask.video_num,
              ])
            }}
          </Tag>
        </div>

        <Table
          :loading="relationsLoading"
          :columns="relationColumns"
          :data-source="relationData?.relations ?? []"
          :pagination="false"
          row-key="relation_id"
          size="small"
        />
      </Space>
    </Drawer>

    <Modal
      :open="assignModalOpen"
      :confirm-loading="assignSubmitting"
      ok-text="确认分配"
      :cancel-text="$t('common.cancel')"
      title="分配 BD 到公开任务"
      @cancel="closeAssignModal"
      @ok="submitAssign"
    >
      <Form layout="vertical" class="pt-2">
        <FormItem v-if="assignTaskRow" label="任务信息">
          <div class="text-sm text-gray-500">
            <div
              v-if="assignTaskRow.name"
              class="mb-1 font-medium text-gray-700"
            >
              {{ assignTaskRow.name }}
            </div>
            <div v-if="assignTaskRow.tags?.length" class="mb-1">
              <Tag
                v-for="(tag, i) in assignTaskRow.tags"
                :key="tag"
                :color="getTagColor(i)"
                class="mr-1"
              >
                {{ tag }}
              </Tag>
            </div>
            任务ID: {{ assignTaskRow.task_id }} | 佣金: ฿{{
              assignTaskRow.commission
            }}
            | 视频数: {{ assignTaskRow.video_num }}
          </div>
        </FormItem>

        <FormItem label="BD代号" required>
          <Select
            v-model:value="assignBdCodes"
            mode="multiple"
            class="w-full"
            :loading="bdOptionsLoading"
            :options="bdOptions"
            placeholder="请选择要分配的 BD"
            :filter-option="false"
            show-search
            @search="loadBdOptions"
            @dropdown-visible-change="
              (open) => {
                if (open) {
                  void loadBdOptions();
                }
              }
            "
          />
        </FormItem>

        <FormItem label="每人视频数">
          <InputNumber
            v-model:value="assignVideoQuantity"
            class="w-full"
            :min="1"
            :precision="0"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- Dispatch Modal -->
    <Modal
      :open="dispatchModalOpen"
      :confirm-loading="dispatchSubmitting"
      :ok-text="$t('page.bd.task-center.dispatch.ok-text')"
      :cancel-text="$t('common.cancel')"
      :title="$t('page.bd.task-center.dispatch.title')"
      @cancel="closeDispatchModal"
      @ok="submitDispatch"
    >
      <Form layout="vertical" class="pt-2">
        <FormItem
          v-if="dispatchTaskRow"
          :label="$t('page.bd.task-center.dispatch.task-info')"
        >
          <div class="text-sm text-gray-500">
            <div
              v-if="dispatchTaskRow.name"
              class="mb-1 font-medium text-gray-700"
            >
              {{ dispatchTaskRow.name }}
            </div>
            <div v-if="dispatchTaskRow.tags?.length" class="mb-1">
              <Tag
                v-for="(tag, i) in dispatchTaskRow.tags"
                :key="tag"
                :color="getTagColor(i)"
                class="mr-1"
              >
                {{ tag }}
              </Tag>
            </div>
            {{
              $t('page.bd.task-center.dispatch.task-info-template', [
                String(dispatchTaskRow.task_id),
                String(dispatchTaskRow.commission),
                String(dispatchTaskRow.video_num),
              ])
            }}
          </div>
        </FormItem>

        <FormItem
          :label="$t('page.bd.task-center.dispatch.bd-codes-label')"
          required
        >
          <Select
            v-model:value="dispatchBdCodes"
            mode="multiple"
            class="w-full"
            :loading="bdOptionsLoading"
            :options="bdOptions"
            :placeholder="
              $t('page.bd.task-center.dispatch.bd-codes-placeholder')
            "
            :filter-option="false"
            show-search
            @search="loadBdOptions"
            @dropdown-visible-change="
              (open) => {
                if (open) {
                  void loadBdOptions();
                }
              }
            "
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.dispatch.video-num-label')">
          <InputNumber
            v-model:value="dispatchVideoNum"
            class="w-full"
            :min="1"
            :precision="0"
          />
        </FormItem>

        <FormItem :label="$t('page.bd.task-center.dispatch.commission-label')">
          <InputNumber
            v-model:value="dispatchCommission"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </FormItem>

        <Alert
          type="info"
          show-icon
          :message="$t('page.bd.task-center.dispatch.alert-message')"
          class="mt-2"
        />
      </Form>
    </Modal>
  </Page>
</template>
