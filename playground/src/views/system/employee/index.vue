<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onUnmounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  DatePicker,
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
import { getFileUploadUrl, registerUploadedFile } from '#/api/core';
import {
  AdminEmployeeApi,
  createAdminEmployee,
  deleteAdminEmployee,
  getAdminEmployeeDetail,
  getAdminEmployeeList,
  updateAdminEmployee,
} from '#/api/system/admin-employee';
import { $t } from '#/locales';

import { useAdminDepartmentSelect } from '../shared/useAdminDepartmentSelect';
import { useAdminPostSelect } from '../shared/useAdminPostSelect';

const {
  componentProps: departmentSelectProps,
  loadOptions: loadDepartmentOptions,
} = useAdminDepartmentSelect();
const { componentProps: postSelectProps, loadOptions: loadPostOptions } =
  useAdminPostSelect();

const drawerOpen = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const editingRow = ref<AdminEmployeeApi.EmployeeItem | null>(null);

// --- Avatar Upload State ---
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_ACCEPT = 'image/jpeg,image/png';
const avatarFile = ref<File | null>(null);
const avatarPreviewUrl = ref<string>('');
const avatarUploading = ref(false);
const currentAvatarUrl = ref<string>('');
const avatarInput = ref<HTMLInputElement>();

function triggerAvatarInput() {
  avatarInput.value?.click();
}

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = '';
  }
}

function validateAvatarFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    message.warning($t('system.employee.messages.avatar-format-invalid'));
    return false;
  }
  if (file.size > AVATAR_MAX_SIZE) {
    message.warning($t('system.employee.messages.avatar-size-invalid'));
    return false;
  }
  return true;
}

function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!validateAvatarFile(file)) {
    // Reset the input so the same file can be re-selected after fixing
    input.value = '';
    return;
  }

  revokeAvatarPreview();
  avatarFile.value = file;
  avatarPreviewUrl.value = URL.createObjectURL(file);
}

function clearAvatar() {
  avatarFile.value = null;
  revokeAvatarPreview();
  currentAvatarUrl.value = '';
}

async function uploadAvatar(): Promise<null | string> {
  if (!avatarFile.value) return null;

  avatarUploading.value = true;
  try {
    // Step 1: Get presigned upload URL
    const result = await getFileUploadUrl({
      biz_type: 'user-avatars',
      content_type: avatarFile.value.type,
      file_name: avatarFile.value.name,
    });

    // Step 2: PUT file directly to R2
    const uploadResponse = await fetch(result.upload_url, {
      body: avatarFile.value,
      headers: result.headers,
      method: 'PUT',
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 upload failed with status ${uploadResponse.status}`);
    }

    // Step 3: Register file metadata
    await registerUploadedFile({
      file_key: result.file_key,
      file_name: result.file_name,
    });

    return result.file_key;
  } catch (error: any) {
    message.error(
      error?.message || $t('system.employee.messages.avatar-upload-failed'),
    );
    return null;
  } finally {
    avatarUploading.value = false;
  }
}

onUnmounted(() => {
  revokeAvatarPreview();
});

const formState = reactive<{
  country: string;
  dept_id: number | undefined;
  emergency_contact: string;
  emergency_phone: string;
  employee_no: string;
  entry_time: string | undefined;
  gender: AdminEmployeeApi.Gender;
  id_card: string;
  lark_id: string;
  leave_time: string | undefined;
  name_cn: string;
  name_en: string;
  name_th: string;
  performance_bonus: number | undefined;
  phone: string;
  post_id: number | undefined;
  remark: string;
  salary: number | undefined;
  status: AdminEmployeeApi.Status;
  subsidy: number | undefined;
}>({
  country: 'CN',
  dept_id: undefined,
  emergency_contact: '',
  emergency_phone: '',
  employee_no: '',
  entry_time: undefined,
  gender: AdminEmployeeApi.Gender.UNKNOWN,
  id_card: '',
  lark_id: '',
  leave_time: undefined,
  name_cn: '',
  name_en: '',
  name_th: '',
  performance_bonus: 0,
  phone: '',
  post_id: undefined,
  remark: '',
  salary: 0,
  status: AdminEmployeeApi.Status.ACTIVE,
  subsidy: 0,
});

const isEditMode = computed(() => Boolean(editingRow.value));
const drawerTitle = computed(() =>
  isEditMode.value
    ? $t('system.employee.actions.edit')
    : $t('system.employee.actions.create'),
);
const isLeftStatus = computed(
  () => formState.status === AdminEmployeeApi.Status.LEFT,
);

const statusOptions = [
  {
    label: $t('system.employee.status.active'),
    value: AdminEmployeeApi.Status.ACTIVE,
  },
  {
    label: $t('system.employee.status.left'),
    value: AdminEmployeeApi.Status.LEFT,
  },
];

const filterStatusOptions = [
  {
    label: $t('system.employee.filters.all-status'),
    value: undefined,
  },
  ...statusOptions,
];

const countryOptions = [
  { label: 'CN', value: 'CN' },
  { label: 'TH', value: 'TH' },
];

const genderOptions = [
  {
    label: $t('system.employee.gender.unknown'),
    value: AdminEmployeeApi.Gender.UNKNOWN,
  },
  {
    label: $t('system.employee.gender.male'),
    value: AdminEmployeeApi.Gender.MALE,
  },
  {
    label: $t('system.employee.gender.female'),
    value: AdminEmployeeApi.Gender.FEMALE,
  },
];

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getStatusText(status?: number) {
  return status === AdminEmployeeApi.Status.LEFT
    ? $t('system.employee.status.left')
    : $t('system.employee.status.active');
}

function getStatusColor(status?: number) {
  return status === AdminEmployeeApi.Status.LEFT ? 'warning' : 'success';
}

function normalizeOptionalString(value: string) {
  const result = value.trim();
  return result || undefined;
}

function resetForm() {
  clearAvatar();
  formState.country = 'CN';
  formState.dept_id = undefined;
  formState.emergency_contact = '';
  formState.emergency_phone = '';
  formState.employee_no = '';
  formState.entry_time = undefined;
  formState.gender = AdminEmployeeApi.Gender.UNKNOWN;
  formState.id_card = '';
  formState.lark_id = '';
  formState.leave_time = undefined;
  formState.name_cn = '';
  formState.name_en = '';
  formState.name_th = '';
  formState.performance_bonus = 0;
  formState.phone = '';
  formState.post_id = undefined;
  formState.remark = '';
  formState.salary = 0;
  formState.status = AdminEmployeeApi.Status.ACTIVE;
  formState.subsidy = 0;
}

function assignForm(detail: AdminEmployeeApi.EmployeeItem) {
  clearAvatar();
  currentAvatarUrl.value = detail.avatar || '';
  formState.country = detail.country;
  formState.dept_id = detail.dept_id ?? undefined;
  formState.emergency_contact = detail.emergency_contact ?? '';
  formState.emergency_phone = detail.emergency_phone ?? '';
  formState.employee_no = detail.employee_no;
  formState.entry_time = String(detail.entry_time);
  formState.gender = detail.gender;
  formState.id_card = detail.id_card ?? '';
  formState.lark_id = detail.lark_id ?? '';
  formState.leave_time = detail.leave_time
    ? String(detail.leave_time)
    : undefined;
  formState.name_cn = detail.name_cn ?? '';
  formState.name_en = detail.name_en ?? '';
  formState.name_th = detail.name_th ?? '';
  formState.performance_bonus = detail.performance_bonus;
  formState.phone = detail.phone ?? '';
  formState.post_id = detail.post_id ?? undefined;
  formState.remark = detail.remark ?? '';
  formState.salary = detail.salary;
  formState.status = detail.status;
  formState.subsidy = detail.subsidy;
}

async function openCreate() {
  editingRow.value = null;
  resetForm();
  drawerOpen.value = true;
  await Promise.all([loadDepartmentOptions(), loadPostOptions()]);
}

async function openEdit(row: AdminEmployeeApi.EmployeeItem) {
  try {
    detailLoading.value = true;
    editingRow.value = row;
    drawerOpen.value = true;
    await Promise.all([loadDepartmentOptions(), loadPostOptions()]);
    const detail = await getAdminEmployeeDetail({ id: row.id });
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

function validateForm() {
  if (editingRow.value && !formState.employee_no.trim()) {
    message.warning($t('system.employee.messages.employee-no-required'));
    return false;
  }
  if (!formState.country) {
    message.warning($t('system.employee.messages.country-required'));
    return false;
  }
  if (
    !formState.name_cn.trim() &&
    !formState.name_th.trim() &&
    !formState.name_en.trim()
  ) {
    message.warning($t('system.employee.messages.name-required'));
    return false;
  }
  if (formState.country === 'CN' && !formState.name_cn.trim()) {
    message.warning($t('system.employee.messages.name-cn-required'));
    return false;
  }
  if (formState.country === 'TH' && !formState.name_th.trim()) {
    message.warning($t('system.employee.messages.name-th-required'));
    return false;
  }
  if (!formState.entry_time) {
    message.warning($t('system.employee.messages.entry-time-required'));
    return false;
  }
  if (isLeftStatus.value && !formState.leave_time) {
    message.warning($t('system.employee.messages.leave-time-required'));
    return false;
  }
  if (!editingRow.value && !avatarFile.value) {
    message.warning($t('system.employee.messages.avatar-required'));
    return false;
  }
  if ((formState.salary ?? 0) < 0) {
    message.warning($t('system.employee.messages.salary-invalid'));
    return false;
  }
  if ((formState.performance_bonus ?? 0) < 0) {
    message.warning($t('system.employee.messages.performance-bonus-invalid'));
    return false;
  }
  if ((formState.subsidy ?? 0) < 0) {
    message.warning($t('system.employee.messages.subsidy-invalid'));
    return false;
  }
  return true;
}

function buildPayload(avatarFileKey?: string): AdminEmployeeApi.CreateParams {
  const payload: AdminEmployeeApi.CreateParams = {
    country: formState.country,
    dept_id: formState.dept_id ?? null,
    emergency_contact: normalizeOptionalString(formState.emergency_contact),
    emergency_phone: normalizeOptionalString(formState.emergency_phone),
    entry_time: Number(formState.entry_time),
    gender: formState.gender,
    id_card: normalizeOptionalString(formState.id_card),
    lark_id: normalizeOptionalString(formState.lark_id),
    leave_time:
      isLeftStatus.value && formState.leave_time
        ? Number(formState.leave_time)
        : null,
    name_cn: formState.name_cn.trim() || null,
    name_en: formState.name_en.trim() || null,
    name_th: formState.name_th.trim() || null,
    performance_bonus: Number(formState.performance_bonus ?? 0),
    phone: normalizeOptionalString(formState.phone),
    post_id: formState.post_id ?? null,
    remark: normalizeOptionalString(formState.remark),
    salary: Number(formState.salary ?? 0),
    status: formState.status,
    subsidy: Number(formState.subsidy ?? 0),
  };
  if (avatarFileKey) {
    payload.avatar_file_key = avatarFileKey;
  }
  return payload;
}

async function submitForm() {
  if (!validateForm()) {
    return;
  }

  try {
    submitting.value = true;

    // Upload avatar first if a new file was selected
    let avatarFileKey: string | undefined;
    if (avatarFile.value) {
      message.loading({
        content: $t('system.employee.messages.avatar-uploading'),
        duration: 0,
        key: 'avatar-upload',
      });
      const key = await uploadAvatar();
      message.destroy('avatar-upload');
      if (!key) return; // upload failed — error already shown in uploadAvatar
      avatarFileKey = key;
    }

    const payload = buildPayload(avatarFileKey);
    if (editingRow.value) {
      await updateAdminEmployee({
        employee_no: formState.employee_no.trim(),
        id: editingRow.value.id,
        ...payload,
      });
      message.success($t('system.employee.messages.update-success'));
    } else {
      await createAdminEmployee(payload);
      message.success($t('system.employee.messages.create-success'));
    }
    closeDrawer();
    await gridApi.query();
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(row: AdminEmployeeApi.EmployeeItem) {
  Modal.confirm({
    okButtonProps: {
      danger: true,
    },
    okText: $t('common.confirm'),
    title: $t('system.employee.delete.confirm-title'),
    content: $t('system.employee.delete.confirm-content', [row.display_name]),
    async onOk() {
      await deleteAdminEmployee({ id: row.id });
      message.success(
        $t('system.employee.messages.delete-success', [row.display_name]),
      );
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
      fieldName: 'name',
      label: $t('system.employee.filters.name'),
    },
    {
      component: 'Select',
      componentProps: () => departmentSelectProps.value,
      fieldName: 'dept_id',
      label: $t('system.employee.filters.department'),
    },
    {
      component: 'Select',
      componentProps: () => postSelectProps.value,
      fieldName: 'post_id',
      label: $t('system.employee.filters.post'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: filterStatusOptions,
      },
      fieldName: 'status',
      label: $t('system.employee.filters.status'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: countryOptions,
      },
      fieldName: 'country',
      label: $t('system.employee.filters.country'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<AdminEmployeeApi.EmployeeItem> = {
  stripe: true,
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'employee_no',
      minWidth: 140,
      title: $t('system.employee.columns.employee-no'),
    },
    {
      field: 'display_name',
      minWidth: 140,
      title: $t('system.employee.columns.display-name'),
    },
    {
      field: 'dept_name',
      minWidth: 140,
      slots: { default: 'dept_name' },
      title: $t('system.employee.columns.department'),
    },
    {
      field: 'post_name',
      minWidth: 140,
      slots: { default: 'post_name' },
      title: $t('system.employee.columns.post'),
    },
    {
      field: 'country',
      minWidth: 100,
      title: $t('system.employee.columns.country'),
    },
    {
      field: 'phone',
      minWidth: 140,
      slots: { default: 'phone' },
      title: $t('system.employee.columns.phone'),
    },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: $t('system.employee.columns.status'),
    },
    // {
    //   field: 'bd_code',
    //   minWidth: 120,
    //   slots: { default: 'bd_code' },
    //   title: $t('system.employee.columns.bd-code'),
    // },
    {
      field: 'entry_time',
      minWidth: 180,
      slots: { default: 'entry_time' },
      title: $t('system.employee.columns.entry-time'),
    },
    {
      field: 'leave_time',
      minWidth: 180,
      slots: { default: 'leave_time' },
      title: $t('system.employee.columns.leave-time'),
    },
    {
      field: 'remark',
      minWidth: 160,
      slots: { default: 'remark' },
      title: $t('system.employee.columns.remark'),
    },
    {
      field: 'updated_at',
      minWidth: 180,
      slots: { default: 'updated_at' },
      title: $t('system.employee.columns.updated-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 180,
      slots: { default: 'operation' },
      title: $t('system.employee.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getAdminEmployeeList({
          country: formValues.country || undefined,
          dept_id: formValues.dept_id ? Number(formValues.dept_id) : undefined,
          name: formValues.name?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          post_id: formValues.post_id ? Number(formValues.post_id) : undefined,
          status:
            formValues.status === '' || formValues.status === undefined
              ? undefined
              : Number(formValues.status),
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
    <Grid :table-title="$t('system.employee.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreate">
          {{ $t('system.employee.actions.create') }}
        </Button>
      </template>

      <template #dept_name="{ row }">
        <span>{{ row.dept_name || '-' }}</span>
      </template>

      <template #post_name="{ row }">
        <span>{{ row.post_name || '-' }}</span>
      </template>

      <template #phone="{ row }">
        <span>{{ row.phone || '-' }}</span>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #bd_code="{ row }">
        <span>{{ row.bd_code || '-' }}</span>
      </template>

      <template #entry_time="{ row }">
        <span>{{ formatTimestamp(row.entry_time) }}</span>
      </template>

      <template #leave_time="{ row }">
        <span>{{ formatTimestamp(row.leave_time) }}</span>
      </template>

      <template #remark="{ row }">
        <span>{{ row.remark || '-' }}</span>
      </template>

      <template #updated_at="{ row }">
        <span>{{ formatTimestamp(row.updated_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button type="link" size="small" @click="openEdit(row)">
            {{ $t('system.employee.actions.edit') }}
          </Button>
          <Button danger type="link" size="small" @click="confirmDelete(row)">
            {{ $t('system.employee.actions.delete') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('system.employee.empty')" />
      </template>
    </Grid>

    <Drawer
      :open="drawerOpen"
      :title="drawerTitle"
      :width="760"
      destroy-on-close
      @close="closeDrawer"
    >
      <Form layout="vertical">
        <Form.Item
          v-if="isEditMode"
          :label="$t('system.employee.form.employee-no')"
          required
        >
          <Input v-model:value="formState.employee_no" disabled />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.country')" required>
          <Select v-model:value="formState.country" :options="countryOptions" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.department')">
          <Select
            v-model:value="formState.dept_id"
            v-bind="departmentSelectProps"
          />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.post')">
          <Select v-model:value="formState.post_id" v-bind="postSelectProps" />
        </Form.Item>
        <Form.Item
          :label="$t('system.employee.form.name-cn')"
          :required="formState.country === 'CN'"
        >
          <Input v-model:value="formState.name_cn" />
        </Form.Item>
        <Form.Item
          :label="$t('system.employee.form.name-th')"
          :required="formState.country === 'TH'"
        >
          <Input v-model:value="formState.name_th" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.name-en')">
          <Input v-model:value="formState.name_en" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.phone')">
          <Input v-model:value="formState.phone" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.emergency-contact')">
          <Input v-model:value="formState.emergency_contact" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.emergency-phone')">
          <Input v-model:value="formState.emergency_phone" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.status')" required>
          <Select v-model:value="formState.status" :options="statusOptions" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.entry-time')" required>
          <DatePicker
            v-model:value="formState.entry_time"
            value-format="x"
            class="w-full"
          />
        </Form.Item>
        <Form.Item
          v-if="isLeftStatus"
          :label="$t('system.employee.form.leave-time')"
          required
        >
          <DatePicker
            v-model:value="formState.leave_time"
            value-format="x"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.gender')">
          <Select v-model:value="formState.gender" :options="genderOptions" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.id-card')">
          <Input v-model:value="formState.id_card" />
        </Form.Item>
        <Form.Item
          :label="$t('system.employee.form.avatar')"
          :required="!isEditMode"
        >
          <div class="space-y-2">
            <!-- Upload trigger area -->
            <div
              class="group relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/50 hover:bg-muted/40"
              :class="
                avatarPreviewUrl || currentAvatarUrl
                  ? 'h-40 w-40 overflow-hidden'
                  : 'h-32 w-full'
              "
              @click="triggerAvatarInput"
            >
              <!-- Preview image -->
              <img
                v-if="avatarPreviewUrl || currentAvatarUrl"
                :src="avatarPreviewUrl || currentAvatarUrl"
                alt="Avatar preview"
                class="h-full w-full object-cover"
              />
              <!-- Empty state -->
              <div
                v-else
                class="flex flex-col items-center gap-2 text-muted-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span class="text-sm">{{
                  $t('system.employee.form.avatar-upload-hint')
                }}</span>
              </div>

              <!-- Hover overlay for re-upload -->
              <div
                v-if="avatarPreviewUrl || currentAvatarUrl"
                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span class="text-xs text-white">
                  {{ avatarPreviewUrl ? '更换图片' : '点击上传' }}
                </span>
              </div>
            </div>

            <!-- Hidden file input -->
            <input
              ref="avatarInput"
              type="file"
              :accept="AVATAR_ACCEPT"
              class="hidden"
              @change="handleAvatarFileChange"
            />

            <!-- Clear button -->
            <Button
              v-if="avatarPreviewUrl || currentAvatarUrl"
              size="small"
              danger
              @click="clearAvatar()"
            >
              移除图片
            </Button>
          </div>
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.salary')" required>
          <InputNumber
            v-model:value="formState.salary"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item
          :label="$t('system.employee.form.performance-bonus')"
          required
        >
          <InputNumber
            v-model:value="formState.performance_bonus"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.subsidy')" required>
          <InputNumber
            v-model:value="formState.subsidy"
            :min="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.lark-id')">
          <Input v-model:value="formState.lark_id" />
        </Form.Item>
        <Form.Item :label="$t('system.employee.form.remark')">
          <Input.TextArea v-model:value="formState.remark" :rows="3" />
        </Form.Item>
      </Form>

      <Space>
        <Button
          type="primary"
          :loading="submitting || detailLoading"
          @click="submitForm"
        >
          {{ $t('common.confirm') }}
        </Button>
        <Button @click="closeDrawer">
          {{ $t('common.cancel') }}
        </Button>
      </Space>
    </Drawer>
  </Page>
</template>
