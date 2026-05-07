<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminDepartmentApi } from '#/api/system/admin-department';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAdminDepartment,
  deleteAdminDepartment,
  getAdminDepartmentList,
  updateAdminDepartment,
} from '#/api/system/admin-department';
import { $t } from '#/locales';

const drawerOpen = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminDepartmentApi.DepartmentItem | null>(null);

const formState = reactive<{
  code: string;
  name: string;
}>({
  code: '',
  name: '',
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('system.department.actions.edit')
    : $t('system.department.actions.create'),
);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function resetForm() {
  formState.code = '';
  formState.name = '';
}

function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
}

function openEdit(row: AdminDepartmentApi.DepartmentItem) {
  editingRow.value = row;
  formState.code = row.code;
  formState.name = row.name;
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
  const name = formState.name.trim();
  const code = formState.code.trim().toUpperCase();

  if (!name) {
    message.warning($t('system.department.messages.name-required'));
    return;
  }
  if (!code) {
    message.warning($t('system.department.messages.code-required'));
    return;
  }

  try {
    submitting.value = true;
    if (editingRow.value) {
      await updateAdminDepartment({
        code,
        id: editingRow.value.id,
        name,
      });
      message.success($t('system.department.messages.update-success'));
    } else {
      await createAdminDepartment({
        code,
        name,
      });
      message.success($t('system.department.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminDepartmentApi.DepartmentItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('system.department.delete.confirm-title'),
    content: $t('system.department.delete.confirm-content', [row.name]),
    async onOk() {
      await deleteAdminDepartment({ id: row.id });
      message.success(
        $t('system.department.messages.delete-success', [row.name]),
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
      fieldName: 'name',
      label: $t('system.department.filters.name'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.department.filters.code'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminDepartmentApi.DepartmentItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'name',
      minWidth: 180,
      title: $t('system.department.columns.name'),
    },
    {
      field: 'code',
      minWidth: 140,
      title: $t('system.department.columns.code'),
    },
    {
      field: 'employee_count',
      minWidth: 120,
      title: $t('system.department.columns.employee-count'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('system.department.columns.created-at'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('system.department.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 180,
      slots: { default: 'operation' },
      title: $t('system.department.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminDepartmentList({
          code: formValues.code?.trim() || undefined,
          name: formValues.name?.trim() || undefined,
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
    <Grid :table-title="$t('system.department.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('system.department.actions.create') }}
        </Button>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openEdit(row)">
            {{ $t('system.department.actions.edit') }}
          </Button>
          <Button danger type="link" size="small" @click="confirmDelete(row)">
            {{ $t('system.department.actions.delete') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="480"
      destroy-on-close
      @close="closeDrawer"
    >
      <Form layout="vertical">
        <Form.Item :label="$t('system.department.form.name')">
          <Input
            v-model:value="formState.name"
            :placeholder="$t('system.department.form.name-placeholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('system.department.form.code')">
          <Input
            v-model:value="formState.code"
            :placeholder="$t('system.department.form.code-placeholder')"
          />
        </Form.Item>
      </Form>

      <Space>
        <Button type="primary" :loading="submitting" @click="submitForm">
          {{ $t('common.confirm') }}
        </Button>
        <Button @click="closeDrawer">
          {{ $t('common.cancel') }}
        </Button>
      </Space>
    </Drawer>
  </Page>
</template>
