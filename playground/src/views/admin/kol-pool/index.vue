<!-- eslint-disable unicorn/prefer-add-event-listener -->
<script lang="ts" setup>
// oxlint-disable typescript/no-non-null-assertion
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AdminKolPoolApi } from '#/api/admin/kol-pool';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Drawer,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKolPoolRecord,
  deleteKolPoolRecord,
  getAdminKolPoolList,
  updateKolPoolRecord,
} from '#/api/admin/kol-pool';

// --- Filters ---
const kolIdFilter = ref('');
const sourceTypeFilter = ref<1 | 2 | undefined>(undefined);
const hasBudgetFilter = ref<0 | 1 | undefined>(undefined);

const sourceTypeOptions = [
  { label: '全部来源', value: undefined },
  { label: '离职BD释放', value: 1 },
  { label: 'Admin上传', value: 2 },
];

const hasBudgetOptions = [
  { label: '全部预算', value: undefined },
  { label: '有预算', value: 1 },
  { label: '无预算', value: 0 },
];

// --- Drawer: multi-row batch create ---
interface PoolFormRow {
  budget_amount: number | undefined;
  has_budget: 0 | 1;
  kol_id: string;
  kol_url: string;
  remark: string;
}

const poolDrawerOpen = ref(false);
const poolSubmitting = ref(false);
const poolRows = ref<PoolFormRow[]>([]);

function createEmptyPoolRow(): PoolFormRow {
  return {
    kol_id: '',
    kol_url: '',
    has_budget: 0,
    budget_amount: undefined,
    remark: '',
  };
}

function openPoolDrawer() {
  poolRows.value = [createEmptyPoolRow()];
  poolDrawerOpen.value = true;
}

function closePoolDrawer() {
  poolDrawerOpen.value = false;
  poolSubmitting.value = false;
}

function addPoolRow() {
  poolRows.value.push(createEmptyPoolRow());
}

function removePoolRow(index: number) {
  if (poolRows.value.length <= 1) {
    poolRows.value[0] = createEmptyPoolRow();
    return;
  }
  poolRows.value.splice(index, 1);
}

function dedupePoolRows(rows: PoolFormRow[]): PoolFormRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = row.kol_id.trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function handlePoolDrawerSubmit() {
  const filledRows = poolRows.value.filter((r) => r.kol_id.trim());
  if (filledRows.length === 0) {
    message.warning('请至少输入一个达人ID');
    return;
  }

  const deduped = dedupePoolRows(filledRows);
  if (deduped.length < filledRows.length) {
    message.warning(
      `检测到 ${filledRows.length - deduped.length} 个重复的达人ID，已自动去除`,
    );
  }

  poolSubmitting.value = true;
  let successCount = 0;
  let failCount = 0;
  try {
    for (const row of deduped) {
      try {
        await createKolPoolRecord({
          kol_id: row.kol_id.trim(),
          kol_url: row.kol_url.trim() || undefined,
          has_budget: row.has_budget,
          budget_amount:
            row.has_budget === 1 ? (row.budget_amount ?? null) : null,
          remark: row.remark.trim() || undefined,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    const msg =
      failCount > 0
        ? `提交完成：${successCount} 条成功，${failCount} 条失败`
        : `成功提交 ${successCount} 条记录`;
    if (failCount > 0) message.warning(msg);
    else message.success(msg);
    closePoolDrawer();
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '提交失败');
  } finally {
    poolSubmitting.value = false;
  }
}

// --- Edit Modal (single-record) ---
const editVisible = ref(false);
const editSubmitting = ref(false);
const editingId = ref<null | number>(null);
const editForm = ref({
  kol_id: '',
  kol_url: '',
  has_budget: 0 as 0 | 1,
  budget_amount: null as null | number,
  remark: '',
});

function openEditEditor(row: AdminKolPoolApi.ListItem) {
  editingId.value = row.id;
  editForm.value = {
    kol_id: row.kol_id,
    kol_url: row.kol_url ?? '',
    has_budget: row.has_budget,
    budget_amount: row.budget_amount,
    remark: row.remark ?? '',
  };
  editVisible.value = true;
}

function closeEditModal() {
  editVisible.value = false;
  editSubmitting.value = false;
}

async function handleEditSubmit() {
  if (editForm.value.has_budget === 1 && !editForm.value.budget_amount) {
    message.warning('有预算时必须填写预算金额');
    return;
  }

  editSubmitting.value = true;
  try {
    await updateKolPoolRecord({
      id: editingId.value!,
      kol_url: editForm.value.kol_url || undefined,
      has_budget: editForm.value.has_budget,
      budget_amount:
        editForm.value.has_budget === 1 ? editForm.value.budget_amount : null,
      remark: editForm.value.remark || undefined,
    });
    message.success('更新成功');
    closeEditModal();
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
  } finally {
    editSubmitting.value = false;
  }
}

// --- Delete ---
async function handleDelete(id: number) {
  Modal.confirm({
    content: '确认删除该达人池记录吗？',
    onOk: async () => {
      await deleteKolPoolRecord(id);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '确认删除',
  });
}

// --- Search / Reset ---
function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  kolIdFilter.value = '';
  sourceTypeFilter.value = undefined;
  hasBudgetFilter.value = undefined;
  gridApi.reload();
}

// --- Grid ---
const columns: VxeGridProps<AdminKolPoolApi.ListItem>['columns'] = [
  { type: 'seq', width: 60 },
  {
    field: 'kol_id',
    title: '达人ID',
    width: 160,
  },
  {
    field: 'kol_url',
    minWidth: 200,
    slots: { default: 'kol_url' },
    title: '达人主页',
  },
  {
    field: 'has_budget',
    slots: { default: 'has_budget' },
    title: '有无预算',
    width: 100,
  },
  {
    field: 'budget_amount',
    title: '预算金额',
    width: 120,
  },
  {
    field: 'remark',
    minWidth: 160,
    title: '备注',
  },
  {
    field: 'source_type',
    slots: { default: 'source_type' },
    title: '来源',
    width: 120,
  },
  {
    field: 'source_bd_code',
    title: '来源BD',
    width: 120,
  },
  {
    field: 'uploader_id',
    title: '上传人ID',
    width: 100,
  },
  {
    field: 'created_at',
    formatter: 'formatDateTime',
    title: '创建时间',
    width: 180,
  },
  {
    field: 'updated_at',
    formatter: 'formatDateTime',
    title: '更新时间',
    width: 180,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 140,
  },
];

const [Grid, gridApi] = useVbenVxeGrid<AdminKolPoolApi.ListItem>({
  gridOptions: {
    columns,
    height: 'auto',
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const params: AdminKolPoolApi.ListParams = {
            page: page.currentPage,
            page_size: page.pageSize,
          };
          if (kolIdFilter.value) params.kol_id = kolIdFilter.value;
          if (sourceTypeFilter.value !== undefined)
            params.source_type = sourceTypeFilter.value;
          if (hasBudgetFilter.value !== undefined)
            params.has_budget = hasBudgetFilter.value;

          const result = await getAdminKolPoolList(params);
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: { refresh: true },
  },
});
</script>

<template>
  <Page auto-content-height>
    <!-- Header -->
    <div
      class="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            达人池管理
          </h1>
          <p
            class="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            管理公共达人池中的达人。支持多行录入、编辑和删除。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button type="primary" @click="openPoolDrawer">新增达人</Button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <Card :bordered="false" class="mb-4 rounded-2xl shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <Select
          v-model:value="sourceTypeFilter"
          :options="sourceTypeOptions"
          allow-clear
          class="min-w-[140px]"
          placeholder="来源筛选"
        />
        <Select
          v-model:value="hasBudgetFilter"
          :options="hasBudgetOptions"
          allow-clear
          class="min-w-[120px]"
          placeholder="预算筛选"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </Card>

    <!-- Pool List -->
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <Grid>
        <template #kol_url="{ row }">
          <a
            v-if="row.kol_url"
            :href="row.kol_url"
            class="text-blue-500 hover:underline"
            rel="noreferrer"
            target="_blank"
          >
            {{ row.kol_url }}
          </a>
          <span v-else class="text-gray-400 dark:text-gray-500">-</span>
        </template>
        <template #has_budget="{ row }">
          <Tag :color="row.has_budget === 1 ? 'green' : 'default'">
            {{ row.has_budget === 1 ? '有' : '无' }}
          </Tag>
        </template>
        <template #source_type="{ row }">
          <Tag :color="row.source_type === 1 ? 'blue' : 'purple'">
            {{ row.source_type === 1 ? '离职BD释放' : 'Admin上传' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Button size="small" type="link" @click="openEditEditor(row)">
            编辑
          </Button>
          <Button danger size="small" type="link" @click="handleDelete(row.id)">
            删除
          </Button>
        </template>
      </Grid>
    </Card>

    <!-- Pool Drawer: Multi-row batch create -->
    <Drawer
      :open="poolDrawerOpen"
      :width="680"
      title="达人池录入"
      @close="closePoolDrawer"
    >
      <div class="flex flex-col gap-4">
        <!-- Row cards -->
        <div
          v-for="(row, idx) in poolRows"
          :key="idx"
          class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60"
        >
          <!-- Row header -->
          <div
            class="mb-3 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700"
          >
            <span
              class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              达人 #{{ idx + 1 }}
            </span>
            <Button danger size="small" type="link" @click="removePoolRow(idx)">
              删除
            </Button>
          </div>

          <!-- Form fields -->
          <div class="grid grid-cols-2 gap-3">
            <!-- kol_id -->
            <div>
              <div
                class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                达人ID
                <span class="text-red-500">*</span>
              </div>
              <Input
                v-model:value="row.kol_id"
                :maxlength="100"
                placeholder="请输入达人ID"
              />
            </div>

            <!-- kol_url -->
            <div>
              <div
                class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                达人主页链接
              </div>
              <Input v-model:value="row.kol_url" placeholder="选填" />
            </div>

            <!-- has_budget -->
            <div>
              <div
                class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                有无预算
              </div>
              <Switch
                v-model:checked="row.has_budget"
                :checked-value="1"
                :unchecked-value="0"
              />
            </div>

            <!-- budget_amount (conditional) -->
            <div v-if="row.has_budget === 1">
              <div
                class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                预算金额
              </div>
              <InputNumber
                v-model:value="row.budget_amount"
                :min="0"
                :precision="2"
                class="w-full"
                placeholder="请输入预算金额"
              />
            </div>

            <!-- remark (full width) -->
            <div class="col-span-2">
              <div
                class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                备注
              </div>
              <Input v-model:value="row.remark" placeholder="选填" />
            </div>
          </div>
        </div>

        <!-- Add row button -->
        <Button block type="dashed" @click="addPoolRow"> + 添加达人 </Button>
      </div>

      <!-- Drawer footer -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="closePoolDrawer">取消</Button>
          <Button
            type="primary"
            :loading="poolSubmitting"
            @click="handlePoolDrawerSubmit"
          >
            提交
          </Button>
        </div>
      </template>
    </Drawer>

    <!-- Edit Modal (single-record) -->
    <Modal
      v-model:open="editVisible"
      :confirm-loading="editSubmitting"
      title="编辑达人"
      @cancel="closeEditModal"
      @ok="handleEditSubmit"
    >
      <div class="space-y-4 pt-2">
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            达人ID
          </div>
          <Input
            v-model:value="editForm.kol_id"
            :maxlength="100"
            disabled
            placeholder="请输入达人ID"
          />
        </div>
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            达人主页链接
          </div>
          <Input
            v-model:value="editForm.kol_url"
            placeholder="请输入达人主页链接（可选）"
          />
        </div>
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            有无预算
          </div>
          <Switch
            v-model:checked="editForm.has_budget"
            :checked-value="1"
            :unchecked-value="0"
          />
        </div>
        <div v-if="editForm.has_budget === 1">
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            预算金额
          </div>
          <InputNumber
            v-model:value="editForm.budget_amount"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="请输入预算金额"
          />
        </div>
        <div>
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            备注
          </div>
          <Input v-model:value="editForm.remark" placeholder="备注（可选）" />
        </div>
      </div>
    </Modal>
  </Page>
</template>
