<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminBdPersonApi } from '#/api/system/admin-bd-person';

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
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAdminBdPerson,
  deleteAdminBdPerson,
  getAdminBdPersonList,
  updateAdminBdPerson,
} from '#/api/system/admin-bd-person';
import { AdminEmployeeApi } from '#/api/system/admin-employee';
import { $t } from '#/locales';

import { useAdminDepartmentSelect } from '../shared/useAdminDepartmentSelect';
import { useAdminEmployeeSelect } from '../shared/useAdminEmployeeSelect';

const { componentProps: departmentSelectProps } = useAdminDepartmentSelect();
const {
  componentProps: employeeSelectProps,
  loadOptions: loadEmployeeOptions,
} = useAdminEmployeeSelect();

const drawerOpen = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminBdPersonApi.BdPersonItem | null>(null);

const formState = reactive<{
  bd_code: string;
  employee_id: number | undefined;
}>({
  bd_code: '',
  employee_id: undefined,
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('system.bdPerson.actions.edit')
    : $t('system.bdPerson.actions.create'),
);

const employeeStatusOptions = [
  {
    label: $t('system.bdPerson.filters.all-status'),
    value: undefined,
  },
  {
    label: $t('system.bdPerson.status.active'),
    value: AdminEmployeeApi.Status.ACTIVE,
  },
  {
    label: $t('system.bdPerson.status.left'),
    value: AdminEmployeeApi.Status.LEFT,
  },
];

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getStatusText(status?: number) {
  return status === AdminEmployeeApi.Status.LEFT
    ? $t('system.bdPerson.status.left')
    : $t('system.bdPerson.status.active');
}

function getStatusColor(status?: number) {
  return status === AdminEmployeeApi.Status.LEFT ? 'warning' : 'success';
}

function resetForm() {
  formState.bd_code = '';
  formState.employee_id = undefined;
}

async function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
  await loadEmployeeOptions();
}

async function openEdit(row: AdminBdPersonApi.BdPersonItem) {
  editingRow.value = row;
  formState.bd_code = row.bd_code;
  formState.employee_id = row.employee_id;
  drawerOpen.value = true;
  await loadEmployeeOptions(row.employee_no);
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
  const bdCode = formState.bd_code.trim().toUpperCase();
  if (editingRow.value && !bdCode) {
    message.warning($t('system.bdPerson.messages.bd-code-required'));
    return;
  }
  if (!formState.employee_id) {
    message.warning($t('system.bdPerson.messages.employee-required'));
    return;
  }

  try {
    submitting.value = true;
    if (editingRow.value) {
      await updateAdminBdPerson({
        bd_code: bdCode,
        employee_id: formState.employee_id,
        id: editingRow.value.id,
      });
      message.success($t('system.bdPerson.messages.update-success'));
    } else {
      await createAdminBdPerson({
        employee_id: formState.employee_id,
      });
      message.success($t('system.bdPerson.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminBdPersonApi.BdPersonItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('system.bdPerson.delete.confirm-title'),
    content: $t('system.bdPerson.delete.confirm-content', [row.bd_code]),
    async onOk() {
      await deleteAdminBdPerson({ id: row.id });
      message.success(
        $t('system.bdPerson.messages.delete-success', [row.bd_code]),
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
      fieldName: 'bd_code',
      label: $t('system.bdPerson.filters.bd-code'),
    },
    {
      component: 'Input',
      fieldName: 'employee_no',
      label: $t('system.bdPerson.filters.employee-no'),
    },
    {
      component: 'Select',
      componentProps: () => departmentSelectProps.value,
      fieldName: 'dept_id',
      label: $t('system.bdPerson.filters.department'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: employeeStatusOptions,
      },
      fieldName: 'employee_status',
      label: $t('system.bdPerson.filters.employee-status'),
    },
  ],
  submitOnChange: true,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminBdPersonApi.BdPersonItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'bd_code',
      minWidth: 120,
      title: $t('system.bdPerson.columns.bd-code'),
    },
    {
      field: 'employee_no',
      minWidth: 140,
      title: $t('system.bdPerson.columns.employee-no'),
    },
    {
      field: 'employee_name',
      minWidth: 140,
      title: $t('system.bdPerson.columns.employee-name'),
    },
    {
      field: 'employee_status',
      minWidth: 120,
      slots: { default: 'employee_status' },
      title: $t('system.bdPerson.columns.employee-status'),
    },
    {
      field: 'dept_name',
      minWidth: 140,
      slots: { default: 'dept_name' },
      title: $t('system.bdPerson.columns.department'),
    },
    {
      field: 'post_name',
      minWidth: 140,
      slots: { default: 'post_name' },
      title: $t('system.bdPerson.columns.post'),
    },
    {
      field: 'leave_time',
      minWidth: 180,
      slots: { default: 'leave_time' },
      title: $t('system.bdPerson.columns.leave-time'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('system.bdPerson.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 180,
      slots: { default: 'operation' },
      title: $t('system.bdPerson.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminBdPersonList({
          bd_code: formValues.bd_code?.trim() || undefined,
          dept_id: formValues.dept_id ? Number(formValues.dept_id) : undefined,
          employee_no: formValues.employee_no?.trim() || undefined,
          employee_status:
            formValues.employee_status === '' ||
            formValues.employee_status === undefined
              ? undefined
              : Number(formValues.employee_status),
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
    <Grid :table-title="$t('system.bdPerson.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('system.bdPerson.actions.create') }}
        </Button>
      </template>

      <template #employee_status="{ row }">
        <Tag :color="getStatusColor(row.employee_status)">
          {{ getStatusText(row.employee_status) }}
        </Tag>
      </template>

      <template #dept_name="{ row }">
        <span>{{ row.dept_name || '-' }}</span>
      </template>

      <template #post_name="{ row }">
        <span>{{ row.post_name || '-' }}</span>
      </template>

      <template #leave_time="{ row }">
        <span>{{ formatTimestamp(row.leave_time) }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openEdit(row)">
            {{ $t('system.bdPerson.actions.edit') }}
          </Button>
          <Button danger type="link" size="small" @click="confirmDelete(row)">
            {{ $t('system.bdPerson.actions.delete') }}
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
        <Form.Item
          v-if="isEditMode"
          :label="$t('system.bdPerson.form.bd-code')"
          required
        >
          <Input v-model:value="formState.bd_code" />
        </Form.Item>
        <Form.Item :label="$t('system.bdPerson.form.employee')" required>
          <Select
            v-model:value="formState.employee_id"
            v-bind="employeeSelectProps"
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
