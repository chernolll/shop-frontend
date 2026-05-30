<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  FormItem,
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
  getAdminBdList,
  getAdminProductListingList,
  getAdminTaskList,
  getAdminTaskRelations,
} from '#/api/bd/tasks';
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

const createForm = reactive<{
  bd_codes: string[];
  budget: AdminTaskApi.BudgetFlag;
  commission: number | undefined;
  deadline: string | undefined;
  product_listing_id: number | undefined;
  type: AdminTaskApi.TaskType;
  video_num: number | undefined;
}>({
  bd_codes: [],
  budget: AdminTaskApi.BudgetFlag.NO,
  commission: undefined,
  deadline: undefined,
  product_listing_id: undefined,
  type: AdminTaskApi.TaskType.CUSTOM,
  video_num: undefined,
});

const budgetOptions = [
  {
    label: $t('page.bd.task-center.budget-text.no'),
    value: AdminTaskApi.BudgetFlag.NO,
  },
  {
    label: $t('page.bd.task-center.budget-text.yes'),
    value: AdminTaskApi.BudgetFlag.YES,
  },
];

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

function getBudgetText(value?: number) {
  return value === AdminTaskApi.BudgetFlag.YES
    ? $t('page.bd.task-center.budget-text.yes')
    : $t('page.bd.task-center.budget-text.no');
}

function getBudgetColor(value?: number) {
  return value === AdminTaskApi.BudgetFlag.YES ? 'success' : 'default';
}

function resetCreateForm() {
  createForm.bd_codes = [];
  createForm.budget = AdminTaskApi.BudgetFlag.NO;
  createForm.commission = undefined;
  createForm.deadline = undefined;
  createForm.product_listing_id = undefined;
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
  if (!createForm.video_num || createForm.video_num <= 0) {
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
      bd_codes: normalizedBdCodes.value,
      budget: createForm.budget,
      commission: createForm.commission,
      deadline: toOptionalNumber(createForm.deadline),
      product_listing_id: createForm.product_listing_id,
      type: createForm.type,
      video_num: createForm.video_num,
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
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.bd.task-center.filters.all-budget'),
            value: undefined,
          },
          ...budgetOptions,
        ],
      },
      fieldName: 'budget',
      label: $t('page.bd.task-center.filters.budget'),
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
      field: 'budget',
      minWidth: 120,
      slots: { default: 'budget' },
      title: $t('page.bd.task-center.columns.budget'),
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
          budget: toOptionalNumber(formValues.budget) as
            | AdminTaskApi.BudgetFlag
            | undefined,
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

      <template #budget="{ row }">
        <Tag :color="getBudgetColor(row.budget)">
          {{ getBudgetText(row.budget) }}
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
            show-time
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

        <FormItem :label="$t('page.bd.task-center.create-modal.budget')">
          <Select
            v-model:value="createForm.budget"
            class="w-full"
            :options="budgetOptions"
          />
        </FormItem>

        <FormItem
          :label="
            createForm.type === AdminTaskApi.TaskType.PUBLIC
              ? 'BD代号（可选）'
              : $t('page.bd.task-center.create-modal.bd-codes')
          "
          :required="createForm.type === AdminTaskApi.TaskType.CUSTOM"
        >
          <Select
            v-model:value="createForm.bd_codes"
            mode="multiple"
            class="w-full"
            :loading="bdOptionsLoading"
            :options="bdOptions"
            :placeholder="
              createForm.type === AdminTaskApi.TaskType.PUBLIC
                ? '公开任务可不指定BD，后续再分配'
                : $t('page.bd.task-center.create-modal.bd-codes-placeholder')
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
            任务ID: {{ assignTaskRow.task_id }} | 佣金: ¥{{
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
  </Page>
</template>
