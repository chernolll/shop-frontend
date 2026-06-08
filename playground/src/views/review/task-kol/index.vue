<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminTaskKolReviewApi } from '#/api/review';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Descriptions,
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
  Spin,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdminTaskKolReviewList, reviewTaskKol } from '#/api/review';
import { $t } from '#/locales';
import { useAdminBdSelect } from '#/views/review/shared/useAdminBdSelect';

const { componentProps: bdCodeSelectProps } = useAdminBdSelect();

// --- Grid State ---
const selectedRows = ref<AdminTaskKolReviewApi.ListItem[]>([]);
const selectedCount = computed(() => selectedRows.value.length);

// --- Detail Drawer ---
const detailDrawerOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const selectedRecord = ref<AdminTaskKolReviewApi.ListItem | null>(null);

function openDetailDrawer(row: AdminTaskKolReviewApi.ListItem) {
  selectedRecord.value = row;
  detailError.value = '';
  detailDrawerOpen.value = true;
}

// --- Review Modal ---
const reviewModalOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewTargetRows = ref<AdminTaskKolReviewApi.ListItem[]>([]);
const isBatchMode = computed(() => reviewTargetRows.value.length > 1);

const reviewForm = reactive<{
  budget: null | number;
  has_budget: boolean;
  note: string;
  pass: boolean;
}>({
  budget: null,
  has_budget: false,
  note: '',
  pass: true,
});

const reviewModalTitle = computed(() =>
  isBatchMode.value
    ? $t('page.review.taskKol.review-modal.batch-title', [
        String(reviewTargetRows.value.length),
      ])
    : $t('page.review.taskKol.review-modal.title'),
);

function openReviewModal(row?: AdminTaskKolReviewApi.ListItem) {
  reviewForm.note = '';
  reviewForm.pass = true;
  if (row) {
    reviewForm.has_budget = row.has_budget === 1;
    reviewForm.budget = row.budget;
  } else {
    reviewForm.has_budget = false;
    reviewForm.budget = null;
  }
  reviewTargetRows.value = row ? [row] : [...selectedRows.value];
  reviewModalOpen.value = true;
}

async function handleReview() {
  if (reviewSubmitting.value) return;
  reviewSubmitting.value = true;
  try {
    const items = reviewTargetRows.value.map((row) => ({
      budget: reviewForm.has_budget ? reviewForm.budget : null,
      has_budget: reviewForm.has_budget ? 1 : 0,
      id: row.id,
      note: reviewForm.note?.trim() || undefined,
      pass: reviewForm.pass,
    }));
    const results = await reviewTaskKol(items);
    const successCount = results.filter((r) => r.success).length;
    message.success(
      $t('page.review.taskKol.messages.review-success', [String(successCount)]),
    );
    reviewModalOpen.value = false;
    reviewTargetRows.value = [];
    await gridApi.query();
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      $t('page.review.taskKol.messages.review-failed');
    message.error(msg);
  } finally {
    reviewSubmitting.value = false;
  }
}

// --- Helpers ---
function getReviewStatusText(status?: number): string {
  const map: Record<number, string> = {
    0: $t('page.review.taskKol.status.pending'),
    1: $t('page.review.taskKol.status.approved'),
    2: $t('page.review.taskKol.status.rejected'),
  };
  return map[status ?? 0] ?? '-';
}

function getReviewStatusColor(status?: number): string {
  const map: Record<number, string> = {
    0: 'processing',
    1: 'success',
    2: 'error',
  };
  return map[status ?? 0] ?? 'default';
}

function getBudgetText(value?: number): string {
  return value === 1 ? '有预算' : '无预算';
}

function getBudgetColor(value?: number): string {
  return value === 1 ? 'blue' : 'default';
}

function formatOptionalText(value?: null | string): string {
  return value?.trim() || '-';
}

// function formatAmount(value?: null | number): string {
//   return value === null || value === undefined ? '-' : String(value);
// }

function isPending(row: AdminTaskKolReviewApi.ListItem): boolean {
  return row.review_status === 0;
}

function syncSelectedRows() {
  selectedRows.value =
    gridApi.grid.getCheckboxRecords() as AdminTaskKolReviewApi.ListItem[];
}

// --- Form Options ---
const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Select',
      componentProps: () => ({
        ...bdCodeSelectProps.value,
        mode: 'multiple' as const,
      }),
      fieldName: 'bd_codes',
      label: $t('page.review.taskKol.filters.bd-codes'),
    },
    {
      component: 'Input',
      fieldName: 'task_name',
      label: $t('page.review.taskKol.filters.task-name'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: $t('page.review.taskKol.status.pending'),
            value: 0,
          },
          {
            label: $t('page.review.taskKol.status.approved'),
            value: 1,
          },
          {
            label: $t('page.review.taskKol.status.rejected'),
            value: 2,
          },
        ],
      },
      fieldName: 'review_status',
      label: $t('page.review.taskKol.filters.review-status'),
    },
  ],
  wrapperClass: 'grid-cols-1 lg:grid-cols-3',
  resetButtonOptions: { content: $t('common.reset') },
  submitButtonOptions: { content: $t('common.search') },
};

// --- Grid Options ---
const gridOptions: VxeTableGridOptions<AdminTaskKolReviewApi.ListItem> = {
  stripe: true,
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'seq', width: 60 },
    { type: 'checkbox', width: 56 },
    {
      field: 'review_status',
      minWidth: 100,
      slots: { default: 'review_status' },
      title: $t('page.review.taskKol.columns.review-status'),
    },
    {
      field: 'task_name',
      minWidth: 160,
      slots: { default: 'task_name' },
      title: $t('page.review.taskKol.columns.task-name'),
    },
    {
      field: 'kol_id',
      minWidth: 120,
      title: $t('page.review.taskKol.columns.kol-id'),
    },
    {
      field: 'kol_url',
      minWidth: 180,
      slots: { default: 'kol_url' },
      title: $t('page.review.taskKol.columns.kol-url'),
    },
    {
      field: 'prepare_bd_code',
      minWidth: 100,
      title: $t('page.review.taskKol.columns.bd-code'),
    },
    {
      field: 'has_budget',
      minWidth: 90,
      slots: { default: 'has_budget' },
      title: $t('page.review.taskKol.columns.has-budget'),
    },
    {
      field: 'budget',
      minWidth: 120,
      slots: { default: 'budget' },
      title: $t('page.review.taskKol.columns.budget'),
    },
    {
      field: 'brand',
      minWidth: 100,
      title: $t('page.review.taskKol.columns.brand'),
    },
    {
      field: 'sku_name',
      minWidth: 120,
      title: $t('page.review.taskKol.columns.sku-name'),
    },
    {
      field: 'product_url',
      minWidth: 180,
      slots: { default: 'product_url' },
      title: $t('page.review.taskKol.columns.product-url'),
    },
    {
      field: 'kol_followers',
      minWidth: 100,
      title: $t('page.review.taskKol.columns.followers'),
    },
    {
      field: 'kol_score',
      minWidth: 80,
      title: $t('page.review.taskKol.columns.score'),
    },
    {
      field: 'kol_contact_info',
      minWidth: 130,
      title: $t('page.review.taskKol.columns.contact-info'),
    },
    {
      field: 'kol_note',
      minWidth: 140,
      slots: { default: 'kol_note' },
      title: $t('page.review.taskKol.columns.kol-note'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'operation' },
      title: $t('page.review.taskKol.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        selectedRows.value = [];
        const result = await getAdminTaskKolReviewList({
          bd_codes: Array.isArray(formValues.bd_codes)
            ? formValues.bd_codes.join(',')
            : formValues.bd_codes?.trim() || undefined,
          page: page.currentPage,
          page_size: page.pageSize,
          review_status:
            formValues.review_status !== undefined &&
            formValues.review_status !== ''
              ? Number(formValues.review_status)
              : undefined,
          task_name: formValues.task_name?.trim() || undefined,
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
  gridEvents: {
    'checkbox-all': syncSelectedRows,
    'checkbox-change': syncSelectedRows,
  } as any,
  gridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('page.review.taskKol.list-title')">
      <template #toolbar-tools>
        <Space wrap>
          <Tag color="processing">
            {{
              $t('page.review.taskKol.selected-count', [String(selectedCount)])
            }}
          </Tag>
          <Button
            type="primary"
            :disabled="selectedCount === 0"
            @click="openReviewModal()"
          >
            {{ $t('page.review.taskKol.actions.batch-review') }}
          </Button>
        </Space>
      </template>

      <template #review_status="{ row }">
        <Tag :color="getReviewStatusColor(row.review_status)">
          {{ getReviewStatusText(row.review_status) }}
        </Tag>
      </template>

      <template #task_name="{ row }">
        <span>{{ row.task_name || '-' }}</span>
      </template>

      <template #kol_url="{ row }">
        <a
          v-if="row.kol_url"
          :href="row.kol_url"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.kol_url }}
        </a>
        <span v-else>-</span>
      </template>

      <template #has_budget="{ row }">
        <Tag :color="getBudgetColor(row.has_budget)">
          {{ getBudgetText(row.has_budget) }}
        </Tag>
      </template>

      <template #budget="{ row }">
        <span v-if="row.has_budget === 1 && row.budget">
          ฿{{ row.budget.toLocaleString() }}
        </span>
        <span v-else>-</span>
      </template>

      <template #product_url="{ row }">
        <a
          v-if="row.product_url"
          :href="row.product_url"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.product_url }}
        </a>
        <span v-else>-</span>
      </template>

      <template #kol_note="{ row }">
        <span class="text-xs text-muted-foreground">
          {{ formatOptionalText(row.kol_note) }}
        </span>
      </template>

      <template #operation="{ row }">
        <Space wrap>
          <Button size="small" type="link" @click="openDetailDrawer(row)">
            {{ $t('page.review.taskKol.actions.detail') }}
          </Button>
          <Button
            v-if="isPending(row)"
            size="small"
            type="link"
            @click="openReviewModal(row)"
          >
            {{ $t('page.review.taskKol.actions.review') }}
          </Button>
        </Space>
      </template>

      <template #empty>
        <Empty :description="$t('page.review.taskKol.messages.no-data')" />
      </template>
    </Grid>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailDrawerOpen"
      :title="$t('page.review.taskKol.detail.title')"
      placement="right"
      width="560"
      :closable="true"
    >
      <Spin :spinning="detailLoading">
        <template v-if="detailError">
          <Alert
            :message="$t('page.review.taskKol.messages.detail-load-error')"
            :description="detailError"
            type="error"
            show-icon
          />
        </template>
        <template v-if="selectedRecord">
          <!-- 任务信息 -->
          <Descriptions
            :column="1"
            bordered
            size="small"
            :title="$t('page.review.taskKol.detail.task-info')"
            class="!mb-4"
          >
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.task-name')"
            >
              {{ selectedRecord.task_name || '-' }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.product-url')"
            >
              <a
                v-if="selectedRecord.product_url"
                :href="selectedRecord.product_url"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                {{ selectedRecord.product_url }}
              </a>
              <span v-else>-</span>
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.taskKol.detail.brand')">
              {{ selectedRecord.brand || '-' }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.sku-name')"
            >
              {{ selectedRecord.sku_name || '-' }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.commission')"
            >
              {{ selectedRecord.commission_public ?? '-' }}
            </Descriptions.Item>
          </Descriptions>

          <!-- 达人信息 -->
          <Descriptions
            :column="1"
            bordered
            size="small"
            :title="$t('page.review.taskKol.detail.kol-info')"
            class="!mb-4"
          >
            <Descriptions.Item :label="$t('page.review.taskKol.detail.kol-id')">
              {{ selectedRecord.kol_id }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.kol-url')"
            >
              <a
                v-if="selectedRecord.kol_url"
                :href="selectedRecord.kol_url"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                {{ selectedRecord.kol_url }}
              </a>
              <span v-else>-</span>
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.followers')"
            >
              {{ (selectedRecord.kol_followers ?? '-').toLocaleString() }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.contact-info')"
            >
              {{ selectedRecord.kol_contact_info || '-' }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.taskKol.detail.score')">
              {{ selectedRecord.kol_score ?? '-' }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.kol-notes')"
            >
              {{ selectedRecord.kol_notes || '-' }}
            </Descriptions.Item>
          </Descriptions>

          <!-- 提交信息 -->
          <Descriptions
            :column="1"
            bordered
            size="small"
            :title="$t('page.review.taskKol.detail.submit-info')"
          >
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.has-budget')"
            >
              <Tag :color="getBudgetColor(selectedRecord.has_budget)">
                {{ getBudgetText(selectedRecord.has_budget) }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.taskKol.detail.budget')">
              {{
                selectedRecord.has_budget === 1 && selectedRecord.budget
                  ? `฿${selectedRecord.budget.toLocaleString()}`
                  : '-'
              }}
            </Descriptions.Item>
            <Descriptions.Item
              :label="$t('page.review.taskKol.detail.kol-note')"
            >
              {{ selectedRecord.kol_note || '-' }}
            </Descriptions.Item>
          </Descriptions>
        </template>
      </Spin>
    </Drawer>

    <!-- Review Modal -->
    <Modal
      v-model:open="reviewModalOpen"
      :title="reviewModalTitle"
      :confirm-loading="reviewSubmitting"
      @ok="handleReview"
      @cancel="reviewTargetRows = []"
    >
      <Form layout="vertical">
        <FormItem :label="$t('page.review.taskKol.columns.review-status')">
          <Select v-model:value="reviewForm.pass" :disabled="isBatchMode">
            <Select.Option :value="true">
              {{ $t('page.review.taskKol.review-modal.pass') }}
            </Select.Option>
            <Select.Option :value="false">
              {{ $t('page.review.taskKol.review-modal.reject') }}
            </Select.Option>
          </Select>
        </FormItem>
        <FormItem :label="$t('page.review.taskKol.columns.has-budget')">
          <Switch v-model:checked="reviewForm.has_budget" />
        </FormItem>
        <FormItem :label="$t('page.review.taskKol.columns.budget')">
          <InputNumber
            v-model:value="reviewForm.budget"
            :disabled="!reviewForm.has_budget"
            :min="0"
            :precision="2"
            :placeholder="
              $t('page.review.taskKol.review-modal.budget-placeholder')
            "
            class="!w-full"
          />
        </FormItem>
        <FormItem :label="$t('page.review.taskKol.review-modal.note-label')">
          <Input.TextArea
            v-model:value="reviewForm.note"
            :placeholder="
              $t('page.review.taskKol.review-modal.note-placeholder')
            "
            :rows="3"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
