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
  Tooltip,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AdminProductApi,
  createAdminProductListing,
  deleteAdminProductListing,
  getAdminProductListingDetail,
  getAdminProductListingList,
  updateAdminProductListing,
} from '#/api/product';
import { $t } from '#/locales';

import { useAdminMainSkuSelect } from '../shared/useAdminMainSkuSelect';
import { useAdminShopSelect } from '#/views/system/shared/useAdminShopSelect';

const { componentProps: mainSkuSelectProps, loadOptions: loadMainSkuOptions } =
  useAdminMainSkuSelect();
const { componentProps: shopSelectProps, loadOptions: loadShopOptions } =
  useAdminShopSelect();

const drawerOpen = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminProductApi.ProductListingItem | null>(null);

const formState = reactive<{
  commission_private: number | undefined;
  commission_public: number | undefined;
  main_sku_id: number | null;
  product_url: string;
  shop_id: number | undefined;
  status: AdminProductApi.Status;
}>({
  commission_private: undefined,
  commission_public: undefined,
  main_sku_id: null,
  product_url: '',
  shop_id: undefined,
  status: AdminProductApi.Status.ON_SALE,
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('page.product.listing.actions.edit')
    : $t('page.product.listing.actions.create'),
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

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getStatusText(status?: null | number) {
  return status === AdminProductApi.Status.ON_SALE
    ? $t('page.product.common.status.on-sale')
    : $t('page.product.common.status.off-shelf');
}

function getStatusColor(status?: null | number) {
  return status === AdminProductApi.Status.ON_SALE ? 'success' : 'default';
}

function resetForm() {
  formState.commission_private = undefined;
  formState.commission_public = undefined;
  formState.main_sku_id = null;
  formState.product_url = '';
  formState.shop_id = undefined;
  formState.status = AdminProductApi.Status.ON_SALE;
}

function assignForm(detail: AdminProductApi.ProductListingItem) {
  formState.commission_private = detail.commission_private;
  formState.commission_public = detail.commission_public;
  formState.main_sku_id = detail.main_sku_id ?? null;
  formState.product_url = detail.product_url;
  formState.shop_id = detail.shop_id;
  formState.status = detail.status;
}

function validateForm() {
  if (!formState.shop_id) {
    message.warning($t('page.product.listing.messages.select-shop'));
    return false;
  }
  if (!formState.product_url.trim()) {
    message.warning($t('page.product.listing.messages.input-product-url'));
    return false;
  }
  if (!formState.main_sku_id) {
    message.warning($t('page.product.listing.messages.main-sku-required'));
    return false;
  }
  return true;
}

function buildPayload(): AdminProductApi.ProductListingCreateParams {
  return {
    commission_private: formState.commission_private,
    commission_public: formState.commission_public,
    main_sku_id: formState.main_sku_id,
    product_url: formState.product_url.trim(),
    shop_id: Number(formState.shop_id),
    status: formState.status,
  };
}

async function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
  await Promise.all([loadMainSkuOptions(), loadShopOptions()]);
}

async function openEdit(row: AdminProductApi.ProductListingItem) {
  try {
    editingRow.value = row;
    drawerOpen.value = true;
    detailLoading.value = true;
    const detail = await getAdminProductListingDetail({ id: row.id });
    assignForm(detail);
    await Promise.all([
      loadMainSkuOptions(
        detail.main_sku_code || detail.main_sku_name || '',
      ),
      loadShopOptions(),
    ]);
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
      await updateAdminProductListing({
        id: editingRow.value.id,
        ...payload,
      });
      message.success($t('page.product.listing.messages.update-success'));
    } else {
      await createAdminProductListing(payload);
      message.success($t('page.product.listing.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminProductApi.ProductListingItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('page.product.listing.delete.confirm-title'),
    content: $t('page.product.listing.delete.confirm-content', [
      row.product_url,
    ]),
    async onOk() {
      await deleteAdminProductListing({ id: row.id });
      message.success($t('page.product.listing.messages.delete-success'));
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
      fieldName: 'product_url',
      label: $t('page.product.listing.filters.product-url'),
    },
    {
      component: 'Input',
      fieldName: 'shop_name',
      label: $t('page.product.listing.filters.shop-name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: filterStatusOptions,
      },
      fieldName: 'status',
      label: $t('page.product.listing.filters.status'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminProductApi.ProductListingItem> = {
  stripe: true,
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'product_url',
      minWidth: 240,
      slots: { default: 'product_url' },
      title: $t('page.product.listing.columns.product-url'),
    },
    {
      field: 'shop_name',
      minWidth: 160,
      title: $t('page.product.listing.columns.shop-name'),
    },
    {
      field: 'country',
      minWidth: 100,
      title: $t('page.product.listing.columns.country'),
    },
    {
      field: 'main_sku_code',
      minWidth: 180,
      slots: { default: 'main_sku' },
      title: $t('page.product.listing.columns.main-sku'),
    },
    {
      field: 'commission_public',
      minWidth: 120,
      title: $t('page.product.listing.columns.commission-public'),
    },
    {
      field: 'commission_private',
      minWidth: 120,
      title: $t('page.product.listing.columns.commission-private'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('page.product.listing.columns.status'),
    },
    {
      field: 'active_sop_count',
      minWidth: 140,
      title: $t('page.product.listing.columns.active-sop-count'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('page.product.listing.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('page.product.listing.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'operation' },
      title: $t('page.product.listing.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminProductListingList({
          page: page.currentPage,
          page_size: page.pageSize,
          product_url: formValues.product_url?.trim() || undefined,
          shop_name: formValues.shop_name?.trim() || undefined,
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
    <Grid :table-title="$t('page.product.listing.list-title')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('page.product.listing.actions.create') }}
        </Button>
      </template>

      <template #product_url="{ row }">
        <a
          :href="row.product_url"
          target="_blank"
          rel="noreferrer"
          class="cursor-pointer text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
      </template>

      <template #main_sku="{ row }">
        <Tooltip v-if="row.main_sku_code || row.main_sku_name">
          <template #title>
            <div class="space-y-1">
              <div>
                {{ $t('page.product.listing.columns.main-sku-brand') }}:
                {{ row.main_sku_brand || '-' }}
              </div>
              <div>
                {{ $t('page.product.listing.columns.main-sku-name') }}:
                {{ row.main_sku_name || '-' }}
              </div>
              <div>
                {{ $t('page.product.listing.columns.main-sku-status') }}:
                {{ getStatusText(row.main_sku_status) }}
              </div>
            </div>
          </template>
          <span class="cursor-pointer text-blue-500 hover:underline">
            {{ row.main_sku_code || '-' }}
          </span>
        </Tooltip>
        <span v-else>-</span>
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
            {{ $t('page.product.listing.actions.edit') }}
          </Button>
          <Button danger type="link" @click="confirmDelete(row)">
            {{ $t('page.product.listing.actions.delete') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.product.listing.empty')" />
      </template>
    </Grid>

    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="680"
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
        <Form.Item :label="$t('page.product.listing.form.shop-id')" required>
          <Select
            v-model:value="formState.shop_id"
            v-bind="shopSelectProps"
          />
        </Form.Item>
        <Form.Item
          :label="$t('page.product.listing.form.product-url')"
          required
        >
          <Input v-model:value="formState.product_url" />
        </Form.Item>
        <Form.Item :label="$t('page.product.listing.form.main-sku-id')" required>
          <Select
            v-model:value="formState.main_sku_id"
            v-bind="mainSkuSelectProps"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.listing.form.commission-public')">
          <InputNumber
            v-model:value="formState.commission_public"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.listing.form.commission-private')">
          <InputNumber
            v-model:value="formState.commission_private"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Form.Item :label="$t('page.product.listing.form.status')" required>
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
