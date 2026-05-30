<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
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
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AdminProductApi,
  createAdminSku,
  deleteAdminSku,
  getAdminSkuDetail,
  getAdminSkuList,
  updateAdminSku,
} from '#/api/product';
import { $t } from '#/locales';

const drawerOpen = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminProductApi.SkuItem | null>(null);

const formState = reactive<{
  brand: string;
  cost_price: number | undefined;
  currency: string;
  offline_margin: number | undefined;
  online_margin: number | undefined;
  retail_price: number | undefined;
  sku_code: string;
  sku_name: string;
  sku_type: AdminProductApi.SkuType;
  status: AdminProductApi.Status;
}>({
  brand: '',
  cost_price: undefined,
  currency: 'CNY',
  offline_margin: undefined,
  online_margin: undefined,
  retail_price: undefined,
  sku_code: '',
  sku_name: '',
  sku_type: AdminProductApi.SkuType.SINGLE,
  status: AdminProductApi.Status.ON_SALE,
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('page.product.sku.actions.edit')
    : $t('page.product.sku.actions.create'),
);

const statusOptions = [
  {
    label: $t('page.product.common.status.off-shelf'),
    value: AdminProductApi.Status.OFF_SHELF,
  },
  {
    label: $t('page.product.common.status.on-sale'),
    value: AdminProductApi.Status.ON_SALE,
  },
];

const filterStatusOptions = [
  {
    label: $t('page.product.common.filters.all-status'),
    value: undefined,
  },
  ...statusOptions,
];

const skuTypeOptions = [
  {
    label: $t('page.product.common.sku-type.single'),
    value: AdminProductApi.SkuType.SINGLE,
  },
  {
    label: $t('page.product.common.sku-type.bundle'),
    value: AdminProductApi.SkuType.BUNDLE,
  },
];

const filterSkuTypeOptions = [
  {
    label: $t('page.product.common.filters.all-sku-type'),
    value: undefined,
  },
  ...skuTypeOptions,
];

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getStatusText(status?: number) {
  return status === AdminProductApi.Status.ON_SALE
    ? $t('page.product.common.status.on-sale')
    : $t('page.product.common.status.off-shelf');
}

function getStatusColor(status?: number) {
  return status === AdminProductApi.Status.ON_SALE ? 'success' : 'default';
}

function getSkuTypeText(type?: number) {
  return type === AdminProductApi.SkuType.BUNDLE
    ? $t('page.product.common.sku-type.bundle')
    : $t('page.product.common.sku-type.single');
}

function getSkuTypeColor(type?: number) {
  return type === AdminProductApi.SkuType.BUNDLE ? 'blue' : 'processing';
}

function resetForm() {
  formState.brand = '';
  formState.cost_price = undefined;
  formState.currency = 'CNY';
  formState.offline_margin = undefined;
  formState.online_margin = undefined;
  formState.retail_price = undefined;
  formState.sku_code = '';
  formState.sku_name = '';
  formState.sku_type = AdminProductApi.SkuType.SINGLE;
  formState.status = AdminProductApi.Status.ON_SALE;
}

function assignForm(detail: AdminProductApi.SkuItem) {
  formState.brand = detail.brand;
  formState.cost_price = detail.cost_price;
  formState.currency = detail.currency || 'CNY';
  formState.offline_margin = detail.offline_margin ?? undefined;
  formState.online_margin = detail.online_margin ?? undefined;
  formState.retail_price = detail.retail_price;
  formState.sku_code = detail.sku_code;
  formState.sku_name = detail.sku_name;
  formState.sku_type = detail.sku_type;
  formState.status = detail.status;
}

function validateForm() {
  if (!formState.sku_code.trim()) {
    message.warning($t('page.product.sku.messages.input-sku-code'));
    return false;
  }
  if (!formState.brand.trim()) {
    message.warning($t('page.product.sku.messages.input-brand'));
    return false;
  }
  if (!formState.sku_name.trim()) {
    message.warning($t('page.product.sku.messages.input-sku-name'));
    return false;
  }
  return true;
}

function buildPayload(): AdminProductApi.SkuCreateParams {
  return {
    brand: formState.brand.trim(),
    cost_price: formState.cost_price,
    currency: formState.currency.trim() || 'CNY',
    offline_margin: formState.offline_margin,
    online_margin: formState.online_margin,
    retail_price: formState.retail_price,
    sku_code: formState.sku_code.trim(),
    sku_name: formState.sku_name.trim(),
    sku_type: formState.sku_type,
    status: formState.status,
  };
}

function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
}

async function openEdit(row: AdminProductApi.SkuItem) {
  try {
    editingRow.value = row;
    drawerOpen.value = true;
    detailLoading.value = true;
    const detail = await getAdminSkuDetail({ id: row.id });
    assignForm(detail);
  } finally {
    detailLoading.value = false;
  }
}

function closeDrawer() {
  if (submitting.value) {
    return;
  }
  drawerOpen.value = false;
  editingRow.value = null;
  resetForm();
}

async function submitForm() {
  if (!validateForm()) {
    return;
  }
  try {
    submitting.value = true;
    const payload = buildPayload();
    if (editingRow.value) {
      await updateAdminSku({
        id: editingRow.value.id,
        ...payload,
      });
      message.success($t('page.product.sku.messages.update-success'));
    } else {
      await createAdminSku(payload);
      message.success($t('page.product.sku.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminProductApi.SkuItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('page.product.sku.delete.confirm-title'),
    content: $t('page.product.sku.delete.confirm-content', [row.sku_code]),
    async onOk() {
      await deleteAdminSku({ id: row.id });
      message.success($t('page.product.sku.messages.delete-success'));
      await gridApi.query();
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
      fieldName: 'sku_code',
      label: $t('page.product.sku.filters.sku-code'),
    },
    {
      component: 'Input',
      fieldName: 'sku_name',
      label: $t('page.product.sku.filters.sku-name'),
    },
    {
      component: 'Input',
      fieldName: 'brand',
      label: $t('page.product.sku.filters.brand'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: filterSkuTypeOptions,
      },
      fieldName: 'sku_type',
      label: $t('page.product.sku.filters.sku-type'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: filterStatusOptions,
      },
      fieldName: 'status',
      label: $t('page.product.sku.filters.status'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminProductApi.SkuItem> = {
  stripe: true,
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'sku_code',
      minWidth: 140,
      title: $t('page.product.sku.columns.sku-code'),
    },
    {
      field: 'sku_name',
      minWidth: 180,
      title: $t('page.product.sku.columns.sku-name'),
    },
    {
      field: 'brand',
      minWidth: 140,
      title: $t('page.product.sku.columns.brand'),
    },
    {
      field: 'sku_type',
      minWidth: 120,
      slots: { default: 'sku_type' },
      title: $t('page.product.sku.columns.sku-type'),
    },
    {
      field: 'currency',
      minWidth: 100,
      title: $t('page.product.sku.columns.currency'),
    },
    {
      field: 'retail_price',
      minWidth: 120,
      title: $t('page.product.sku.columns.retail-price'),
    },
    {
      field: 'cost_price',
      minWidth: 120,
      title: $t('page.product.sku.columns.cost-price'),
    },
    {
      field: 'online_margin',
      minWidth: 120,
      title: $t('page.product.sku.columns.online-margin'),
    },
    {
      field: 'offline_margin',
      minWidth: 120,
      title: $t('page.product.sku.columns.offline-margin'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.product.sku.columns.status'),
    },
    {
      field: 'active_sop_count',
      minWidth: 140,
      title: $t('page.product.sku.columns.active-sop-count'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.product.sku.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.product.sku.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'operation' },
      title: $t('page.product.sku.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminSkuList({
          brand: formValues.brand?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          sku_code: formValues.sku_code?.trim() || undefined,
          sku_name: formValues.sku_name?.trim() || undefined,
          sku_type: formValues.sku_type,
          status: formValues.status,
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
    <Grid :table-title="$t('page.product.sku.list-title')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('page.product.sku.actions.create') }}
        </Button>
      </template>

      <template #sku_type="{ row }">
        <Tag :color="getSkuTypeColor(row.sku_type)">
          {{ getSkuTypeText(row.sku_type) }}
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
        <Space :size="4">
          <Button type="link" @click="openEdit(row)">
            {{ $t('page.product.sku.actions.edit') }}
          </Button>
          <Button danger type="link" @click="confirmDelete(row)">
            {{ $t('page.product.sku.actions.delete') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.product.sku.empty')" />
      </template>
    </Grid>

    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="640"
      :confirm-loading="submitting"
      @close="closeDrawer"
    >
      <div v-if="detailLoading" class="py-8 text-center text-sm text-gray-500">
        {{ $t('common.loading') }}
      </div>
      <Form
        v-else
        :label-col="{ span: 7 }"
        :wrapper-col="{ span: 16 }"
        layout="horizontal"
      >
        <Form.Item :label="$t('page.product.sku.form.sku-code')" required>
          <Input v-model:value="formState.sku_code" />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.sku-name')" required>
          <Input v-model:value="formState.sku_name" />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.brand')" required>
          <Input v-model:value="formState.brand" />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.sku-type')" required>
          <Select
            v-model:value="formState.sku_type"
            :options="skuTypeOptions"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.currency')">
          <Input v-model:value="formState.currency" />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.retail-price')">
          <InputNumber
            v-model:value="formState.retail_price"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.cost-price')">
          <InputNumber
            v-model:value="formState.cost_price"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.online-margin')">
          <InputNumber
            v-model:value="formState.online_margin"
            class="w-full"
            :min="0"
            :precision="4"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.offline-margin')">
          <InputNumber
            v-model:value="formState.offline_margin"
            class="w-full"
            :min="0"
            :precision="4"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.sku.form.status')" required>
          <Select v-model:value="formState.status" :options="statusOptions" />
        </Form.Item>
      </Form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="closeDrawer">
            {{ $t('common.cancel') }}
          </Button>
          <Button type="primary" :loading="submitting" @click="submitForm">
            {{ $t('common.confirm') }}
          </Button>
        </div>
      </template>
    </Drawer>
  </Page>
</template>
