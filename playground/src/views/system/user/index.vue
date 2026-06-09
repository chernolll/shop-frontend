<!-- eslint-disable unicorn/prefer-add-event-listener -->
<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminUserApi } from '#/api/system/admin-user';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminRoleOptions,
  getAdminUserList,
  resetAdminUserPassword,
  toggleAdminUserStatus,
  updateAdminUser,
} from '#/api/system/admin-user';
import { getAdminEmployeeDetail } from '#/api/system/admin-employee';
import { $t } from '#/locales';

import { useAdminEmployeeSelect } from '../shared/useAdminEmployeeSelect';

// --- Role Options ---
const roleOptions = ref<AdminUserApi.RoleOption[]>([]);
const roleLoading = ref(false);

async function loadRoleOptions() {
  roleLoading.value = true;
  try {
    roleOptions.value = await getAdminRoleOptions();
  } catch {
    roleOptions.value = [];
  } finally {
    roleLoading.value = false;
  }
}

onMounted(() => {
  loadRoleOptions();
});

// --- Employee Select ---
const {
  componentProps: employeeSelectProps,
  employeeItems,
  loadOptions: loadEmployeeOptions,
} = useAdminEmployeeSelect();

// --- Drawer State ---
const drawerOpen = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminUserApi.ListItem | null>(null);
const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('system.user.actions.edit')
    : $t('system.user.actions.create'),
);

const formState = reactive<{
  employee_id: null | number;
  password: string;
  real_name: string;
  role_code: string | undefined;
  status: 0 | 1;
  username: string;
}>({
  employee_id: null,
  password: '',
  real_name: '',
  role_code: undefined,
  status: 1,
  username: '',
});

// Auto-fill real_name when employee is selected
watch(
  () => formState.employee_id,
  (newId) => {
    if (newId) {
      const emp = employeeItems.value.find((e) => e.id === newId);
      if (emp) {
        formState.real_name = emp.display_name;
      }
      // If not found in list, keep current real_name (e.g. fallback from openEdit)
    } else {
      formState.real_name = '';
    }
  },
);

function resetForm() {
  formState.employee_id = null;
  formState.password = '';
  formState.real_name = '';
  formState.role_code = undefined;
  formState.status = 1;
  formState.username = '';
}

function assignForm(row: AdminUserApi.ListItem) {
  formState.username = row.username;
  formState.role_code = row.role_code || undefined;
  formState.status = row.status;
  formState.password = '';
  // employee_id and real_name are handled by employee select + watch
}

// --- Create / Edit ---
async function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
  if (roleOptions.value.length === 0) {
    await loadRoleOptions();
  }
  await loadEmployeeOptions();
}

async function openEdit(row: AdminUserApi.ListItem) {
  editingRow.value = row;
  assignForm(row);
  drawerOpen.value = true;

  // Load employee dropdown options
  await loadEmployeeOptions();

  // If the account has a bound employee, ensure it appears in the dropdown
  if (row.employee_id) {
    try {
      const emp = await getAdminEmployeeDetail({ id: row.employee_id });
      const exists = employeeItems.value.some((e) => e.id === emp.id);
      if (!exists) {
        employeeItems.value = [emp, ...employeeItems.value];
      }
    } catch {
      // Fallback: keep stored real_name if employee detail fetch fails
      formState.real_name = row.real_name || '';
    }
  }

  // Set employee_id AFTER loading — watch will auto-fill real_name
  // Pre-set real_name as fallback in case employee not found in list
  if (!formState.real_name && row.real_name) {
    formState.real_name = row.real_name;
  }
  formState.employee_id = row.employee_id || null;
}

function closeDrawer() {
  if (submitting.value) return;
  drawerOpen.value = false;
  editingRow.value = null;
  resetForm();
}

function validateForm(): boolean {
  if (!formState.username.trim()) {
    message.warning($t('system.user.messages.username-required'));
    return false;
  }
  if (!isEditMode.value && !formState.password) {
    message.warning($t('system.user.messages.password-required'));
    return false;
  }
  if (!formState.role_code) {
    message.warning($t('system.user.messages.role-required'));
    return false;
  }
  return true;
}

async function submitForm() {
  if (!validateForm()) return;
  submitting.value = true;
  try {
    if (isEditMode.value) {
      const payload: AdminUserApi.UpdateParams = {
        id: editingRow.value!.id,
      };
      if (formState.real_name !== (editingRow.value!.real_name || '')) {
        payload.real_name = formState.real_name || undefined;
      }
      if (formState.employee_id !== (editingRow.value!.employee_id || null)) {
        payload.employee_id = formState.employee_id;
      }
      if (formState.role_code !== editingRow.value!.role_code) {
        payload.role_code = formState.role_code;
      }
      if (formState.status !== editingRow.value!.status) {
        payload.status = formState.status;
      }
      await updateAdminUser(payload);
      message.success($t('system.user.messages.update-success'));
    } else {
      await createAdminUser({
        employee_id: formState.employee_id,
        password: formState.password,
        real_name: formState.real_name || undefined,
        role_code: formState.role_code!,
        username: formState.username.trim(),
      });
      message.success($t('system.user.messages.create-success'));
    }
    closeDrawer();
    await gridApi.reload();
  } catch (error: any) {
    message.error(
      error?.response?.data?.message || error?.message || '操作失败',
    );
  } finally {
    submitting.value = false;
  }
}

// --- Reset Password ---
const resetPwdVisible = ref(false);
const resetPwdSubmitting = ref(false);
const resetPwdTarget = ref<AdminUserApi.ListItem | null>(null);
const resetPwdForm = reactive({ password: '' });

function openResetPassword(row: AdminUserApi.ListItem) {
  resetPwdTarget.value = row;
  resetPwdForm.password = '';
  resetPwdVisible.value = true;
}

async function submitResetPassword() {
  if (!resetPwdForm.password.trim()) {
    message.warning($t('system.user.messages.new-password-required'));
    return;
  }
  resetPwdSubmitting.value = true;
  try {
    await resetAdminUserPassword({
      id: resetPwdTarget.value!.id,
      password: resetPwdForm.password,
    });
    message.success($t('system.user.messages.reset-password-success'));
    resetPwdVisible.value = false;
  } catch (error: any) {
    message.error(
      error?.response?.data?.message || error?.message || '操作失败',
    );
  } finally {
    resetPwdSubmitting.value = false;
  }
}

// --- Toggle Status ---
async function handleToggleStatus(row: AdminUserApi.ListItem) {
  const newStatus = row.status === 1 ? 0 : 1;
  const actionLabel =
    newStatus === 1
      ? $t('system.user.actions.toggle-enable')
      : $t('system.user.actions.toggle-disable');
  try {
    await toggleAdminUserStatus({ id: row.id, status: newStatus as 0 | 1 });
    message.success($t('system.user.messages.toggle-status-success'));
    await gridApi.reload();
  } catch (error: any) {
    message.error(error?.response?.data?.message || `${actionLabel}失败`);
  }
}

// --- Delete ---
function confirmDelete(row: AdminUserApi.ListItem) {
  Modal.confirm({
    okButtonProps: { danger: true },
    okText: $t('system.user.actions.delete'),
    cancelText: $t('common.cancel'),
    title: $t('system.user.delete.confirm-title'),
    content: $t('system.user.delete.confirm-content', [row.username]),
    async onOk() {
      try {
        await deleteAdminUser({ id: row.id });
        message.success(
          $t('system.user.messages.delete-success', [row.username]),
        );
        await gridApi.reload();
      } catch (error: any) {
        message.error(
          error?.response?.data?.message ||
            $t('system.user.messages.cannot-delete-self'),
        );
      }
    },
  });
}

// --- Helpers ---
function getStatusText(status: 0 | 1): string {
  return status === 1
    ? $t('system.user.status.enabled')
    : $t('system.user.status.disabled');
}

function getStatusColor(status: 0 | 1): string {
  return status === 1 ? 'success' : 'error';
}

function getRoleName(roleCode: string): string {
  const found = roleOptions.value.find((r) => r.role_code === roleCode);
  return found?.role_name || roleCode;
}

function formatTimestamp(value?: null | number): string {
  return value ? formatDateTime(value) : '-';
}

// --- Form Options ---
const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.filters.username'),
    },
    {
      component: 'Input',
      fieldName: 'real_name',
      label: $t('system.user.filters.real-name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('system.user.status.enabled'), value: 1 },
          { label: $t('system.user.status.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.user.filters.status'),
    },
    {
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        loading: roleLoading.value,
        options: roleOptions.value.map((r) => ({
          label: r.role_name,
          value: r.role_code,
        })),
      }),
      fieldName: 'role_code',
      label: $t('system.user.filters.role'),
    },
  ],
  wrapperClass: 'grid-cols-1 lg:grid-cols-4',
  resetButtonOptions: { content: $t('common.reset') },
  submitButtonOptions: { content: $t('common.search') },
};

// --- Grid ---
const gridOptions: VxeTableGridOptions<AdminUserApi.ListItem> = {
  stripe: true,
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'username',
      minWidth: 140,
      title: $t('system.user.columns.username'),
    },
    {
      field: 'real_name',
      minWidth: 140,
      slots: { default: 'real_name' },
      title: $t('system.user.columns.real-name'),
    },
    {
      field: 'employee_id',
      minWidth: 120,
      slots: { default: 'employee_id' },
      title: $t('system.user.columns.employee-id'),
    },
    {
      field: 'role_code',
      minWidth: 140,
      slots: { default: 'role_code' },
      title: $t('system.user.columns.role'),
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: $t('system.user.columns.status'),
    },
    {
      field: 'last_login_at',
      minWidth: 180,
      slots: { default: 'last_login_at' },
      title: $t('system.user.columns.last-login'),
    },
    {
      field: 'created_at',
      minWidth: 180,
      slots: { default: 'created_at' },
      title: $t('system.user.columns.created-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 280,
      slots: { default: 'operation' },
      title: $t('system.user.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminUserList({
          page: page.currentPage,
          page_size: page.pageSize,
          real_name: formValues.real_name?.trim() || undefined,
          role_code: formValues.role_code || undefined,
          status:
            formValues.status !== undefined && formValues.status !== ''
              ? (Number(formValues.status) as 0 | 1)
              : undefined,
          username: formValues.username?.trim() || undefined,
        });
        return { items: result.list, total: result.total };
      },
    },
  },
  rowConfig: { isHover: true, keyField: 'id' },
  toolbarConfig: { custom: true, refresh: true, search: true, zoom: true },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('system.user.actions.create') }}
        </Button>
      </template>

      <template #real_name="{ row }">
        <span>{{ row.real_name || '-' }}</span>
      </template>

      <template #employee_id="{ row }">
        <span>{{ row.employee_id || '-' }}</span>
      </template>

      <template #role_code="{ row }">
        <span>{{ getRoleName(row.role_code) }}</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #last_login_at="{ row }">
        <span>{{ formatTimestamp(row.last_login_at) }}</span>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small" wrap>
          <Button size="small" type="link" @click="openEdit(row)">
            {{ $t('system.user.actions.edit') }}
          </Button>
          <Button size="small" type="link" @click="openResetPassword(row)">
            {{ $t('system.user.actions.reset-password') }}
          </Button>
          <Button
            size="small"
            :type="row.status === 1 ? 'link' : 'link'"
            :style="row.status === 1 ? '' : 'color: #52c41a'"
            @click="handleToggleStatus(row)"
          >
            {{
              row.status === 1
                ? $t('system.user.actions.toggle-disable')
                : $t('system.user.actions.toggle-enable')
            }}
          </Button>
          <Button size="small" type="link" danger @click="confirmDelete(row)">
            {{ $t('system.user.actions.delete') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('system.user.empty')" />
      </template>
    </Grid>

    <!-- Create / Edit Drawer -->
    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="520"
      destroy-on-close
      @close="closeDrawer"
    >
      <Form layout="vertical">
        <FormItem :label="$t('system.user.form.username')" required>
          <Input
            v-model:value="formState.username"
            :disabled="isEditMode"
            :placeholder="$t('system.user.form.username-placeholder')"
          />
        </FormItem>

        <FormItem
          v-if="!isEditMode"
          :label="$t('system.user.form.password')"
          required
        >
          <InputPassword
            v-model:value="formState.password"
            :placeholder="$t('system.user.form.password-placeholder')"
          />
        </FormItem>

        <FormItem :label="$t('system.user.form.employee')">
          <Select
            v-model:value="formState.employee_id"
            v-bind="employeeSelectProps"
            :placeholder="$t('system.user.form.employee-placeholder')"
          />
        </FormItem>

        <FormItem :label="$t('system.user.form.role')" required>
          <Select
            v-model:value="formState.role_code"
            :loading="roleLoading"
            :options="
              roleOptions.map((r) => ({
                label: r.role_name,
                value: r.role_code,
              }))
            "
            :placeholder="$t('system.user.form.role-placeholder')"
          />
        </FormItem>

        <FormItem v-if="isEditMode" :label="$t('system.user.form.status')">
          <Select
            v-model:value="formState.status"
            :options="[
              { label: $t('system.user.status.enabled'), value: 1 },
              { label: $t('system.user.status.disabled'), value: 0 },
            ]"
          />
        </FormItem>
      </Form>

      <Space class="!mt-4">
        <Button type="primary" :loading="submitting" @click="submitForm">
          {{ $t('common.confirm') }}
        </Button>
        <Button @click="closeDrawer">
          {{ $t('common.cancel') }}
        </Button>
      </Space>
    </Drawer>

    <!-- Reset Password Modal -->
    <Modal
      v-model:open="resetPwdVisible"
      :title="
        $t('system.user.reset-password.title', [resetPwdTarget?.username ?? ''])
      "
      :confirm-loading="resetPwdSubmitting"
      @ok="submitResetPassword"
    >
      <Form layout="vertical">
        <FormItem :label="$t('system.user.form.new-password')" required>
          <InputPassword
            v-model:value="resetPwdForm.password"
            :placeholder="$t('system.user.form.new-password-placeholder')"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
