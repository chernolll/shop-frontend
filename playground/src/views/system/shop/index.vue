<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminShopApi } from '#/api/system/admin-shop';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Drawer,
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
  createAdminShop,
  deleteAdminShop,
  getAdminShopList,
  updateAdminShop,
} from '#/api/system/admin-shop';
import { $t } from '#/locales';

const drawerOpen = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminShopApi.ShopItem | null>(null);

const platformOptions = [
  { label: $t('page.shop.platform.tiktok'), value: 1 },
  { label: $t('page.shop.platform.shopee'), value: 2 },
  { label: $t('page.shop.platform.lazada'), value: 3 },
];

const shopTypeOptions = [
  { label: $t('page.shop.shopType.cross-border'), value: 1 },
  { label: $t('page.shop.shopType.local'), value: 2 },
];

const statusOptions = [
  { label: $t('page.shop.status.disabled'), value: 0 },
  { label: $t('page.shop.status.normal'), value: 1 },
  { label: $t('page.shop.status.pending'), value: 2 },
  { label: $t('page.shop.status.frozen'), value: 3 },
];

const countryCodes = [
  'TH',
  'CN',
  'VN',
  'ID',
  'MY',
  'PH',
  'SG',
  'US',
  'UK',
] as const;
const countryOptions = countryCodes.map((code) => ({
  label: `${code} - ${$t(`page.shop.country.${code}`)}`,
  value: code,
}));

function getPlatformText(platform: number) {
  const opt = platformOptions.find((p) => p.value === platform);
  return opt?.label ?? '-';
}

function getShopTypeText(shopType: number) {
  const opt = shopTypeOptions.find((p) => p.value === shopType);
  return opt?.label ?? '-';
}

function getStatusColor(status: number) {
  switch (status) {
    case 0: {
      return 'default';
    }
    case 1: {
      return 'success';
    }
    case 2: {
      return 'processing';
    }
    case 3: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function getStatusText(status: number) {
  const opt = statusOptions.find((p) => p.value === status);
  return opt?.label ?? '-';
}

const formState = reactive<{
  country: string;
  owner_user_id: number | undefined;
  platform: number | undefined;
  platform_shop_id: string;
  shop_name: string;
  shop_type: number | undefined;
  status: number | undefined;
}>({
  platform: undefined,
  shop_type: undefined,
  platform_shop_id: '',
  shop_name: '',
  country: '',
  owner_user_id: undefined,
  status: undefined,
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('page.shop.actions.edit')
    : $t('page.shop.actions.create'),
);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function resetForm() {
  formState.platform = undefined;
  formState.shop_type = undefined;
  formState.platform_shop_id = '';
  formState.shop_name = '';
  formState.country = '';
  formState.owner_user_id = undefined;
  formState.status = undefined;
}

function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
}

function openEdit(row: AdminShopApi.ShopItem) {
  editingRow.value = row;
  formState.platform = row.platform;
  formState.shop_type = row.shop_type;
  formState.platform_shop_id = row.platform_shop_id;
  formState.shop_name = row.shop_name;
  formState.country = row.country;
  formState.owner_user_id = row.owner_user_id ?? undefined;
  formState.status = row.status;
  drawerOpen.value = true;
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
  if (!formState.platform) {
    message.warning($t('page.shop.messages.platform-required'));
    return;
  }
  if (!formState.shop_type) {
    message.warning($t('page.shop.messages.shop-type-required'));
    return;
  }
  if (!formState.platform_shop_id.trim()) {
    message.warning($t('page.shop.messages.platform-shop-id-required'));
    return;
  }
  if (!formState.shop_name.trim()) {
    message.warning($t('page.shop.messages.shop-name-required'));
    return;
  }
  if (!formState.country) {
    message.warning($t('page.shop.messages.country-required'));
    return;
  }

  try {
    submitting.value = true;
    if (editingRow.value) {
      await updateAdminShop({
        id: editingRow.value.id,
        platform: formState.platform,
        shop_type: formState.shop_type,
        platform_shop_id: formState.platform_shop_id.trim(),
        shop_name: formState.shop_name.trim(),
        country: formState.country,
        owner_user_id: formState.owner_user_id ?? null,
        status: formState.status ?? 1,
      });
      message.success($t('page.shop.messages.update-success'));
    } else {
      await createAdminShop({
        platform: formState.platform,
        shop_type: formState.shop_type,
        platform_shop_id: formState.platform_shop_id.trim(),
        shop_name: formState.shop_name.trim(),
        country: formState.country,
        owner_user_id: formState.owner_user_id ?? null,
        status: formState.status ?? 1,
      });
      message.success($t('page.shop.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminShopApi.ShopItem) {
  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.shop.delete.confirm-title'),
    content: $t('page.shop.delete.confirm-content', [row.platform_shop_id]),
    async onOk() {
      await deleteAdminShop({ id: row.id });
      message.success(
        $t('page.shop.messages.delete-success', [row.platform_shop_id]),
      );
      await gridApi.query();
    },
  });
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'platform_shop_id',
      label: $t('page.shop.filters.platform-shop-id'),
    },
    {
      component: 'Input',
      fieldName: 'shop_name',
      label: $t('page.shop.filters.shop-name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: platformOptions,
      },
      fieldName: 'platform',
      label: $t('page.shop.filters.platform'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: shopTypeOptions,
      },
      fieldName: 'shop_type',
      label: $t('page.shop.filters.shop-type'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: countryOptions,
      },
      fieldName: 'country',
      label: $t('page.shop.filters.country'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
      },
      fieldName: 'status',
      label: $t('page.shop.filters.status'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminShopApi.ShopItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'platform_shop_id',
      minWidth: 160,
      title: $t('page.shop.columns.platform-shop-id'),
    },
    {
      field: 'shop_name',
      minWidth: 160,
      title: $t('page.shop.columns.shop-name'),
    },
    {
      field: 'platform',
      minWidth: 100,
      title: $t('page.shop.columns.platform'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        getPlatformText(cellValue),
    },
    {
      field: 'shop_type',
      minWidth: 100,
      title: $t('page.shop.columns.shop-type'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        getShopTypeText(cellValue),
    },
    {
      field: 'country',
      minWidth: 160,
      title: $t('page.shop.columns.country'),
      formatter: ({ cellValue }: { cellValue: string }) => {
        const opt = countryOptions.find((c) => c.value === cellValue);
        return opt?.label ?? cellValue;
      },
    },
    {
      field: 'status',
      minWidth: 100,
      title: $t('page.shop.columns.status'),
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      minWidth: 170,
      title: $t('page.shop.columns.created-at'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        formatTimestamp(cellValue),
    },
    {
      field: 'updated_at',
      minWidth: 170,
      title: $t('page.shop.columns.updated-at'),
      formatter: ({ cellValue }: { cellValue: number }) =>
        formatTimestamp(cellValue),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
      title: $t('page.shop.columns.operation'),
      slots: { default: 'operation' },
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminShopList({
          platform_shop_id: formValues.platform_shop_id?.trim() || undefined,
          shop_name: formValues.shop_name?.trim() || undefined,
          platform: formValues.platform || undefined,
          shop_type: formValues.shop_type || undefined,
          country: formValues.country || undefined,
          status: formValues.status || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
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
    <Grid :table-title="$t('page.shop.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('page.shop.actions.create') }}
        </Button>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openEdit(row)">
            {{ $t('page.shop.actions.edit') }}
          </Button>
          <Button danger type="link" size="small" @click="confirmDelete(row)">
            {{ $t('page.shop.actions.delete') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="520"
      destroy-on-close
      @close="closeDrawer"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('page.shop.form.platform')" required>
          <Select
            v-model:value="formState.platform"
            :placeholder="$t('page.shop.form.platform-placeholder')"
            :options="platformOptions"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.shop-type')" required>
          <Select
            v-model:value="formState.shop_type"
            :placeholder="$t('page.shop.form.shop-type-placeholder')"
            :options="shopTypeOptions"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.platform-shop-id')" required>
          <Input
            v-model:value="formState.platform_shop_id"
            :placeholder="$t('page.shop.form.platform-shop-id-placeholder')"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.shop-name')" required>
          <Input
            v-model:value="formState.shop_name"
            :placeholder="$t('page.shop.form.shop-name-placeholder')"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.country')" required>
          <Select
            v-model:value="formState.country"
            :placeholder="$t('page.shop.form.country-placeholder')"
            :options="countryOptions"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.status')" required>
          <Select
            v-model:value="formState.status"
            :placeholder="$t('page.shop.form.status-placeholder')"
            :options="statusOptions"
          />
        </Form.Item>

        <Form.Item :label="$t('page.shop.form.owner-user-id')">
          <InputNumber
            v-model:value="formState.owner_user_id"
            class="w-full"
            :min="1"
            :placeholder="$t('page.shop.form.owner-user-id-placeholder')"
          />
        </Form.Item>
      </Form>

      <template #footer>
        <Space>
          <Button type="primary" :loading="submitting" @click="submitForm">
            {{ $t('common.confirm') }}
          </Button>
          <Button @click="closeDrawer">
            {{ $t('common.cancel') }}
          </Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>
