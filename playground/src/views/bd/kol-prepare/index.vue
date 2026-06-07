<script lang="ts" setup>
// oxlint-disable typescript/no-non-null-assertion
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { KolPrepareApi } from '#/api/bd/kol-prepare';

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
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKolPrepare,
  deleteKolPrepare,
  getMyKolPrepareList,
  updateKolPrepare,
} from '#/api/bd/kol-prepare';

interface PrepareFormRow {
  budget_amount: number | undefined;
  has_budget: 0 | 1;
  kol_id: string;
  kol_url: string;
  remark: string;
}

const hasBudgetOptions = [
  { label: '无', value: 0 as const },
  { label: '有', value: 1 as const },
];

// --- Drawer state ---
const prepareDrawerOpen = ref(false);
const prepareSubmitting = ref(false);
const prepareRows = ref<PrepareFormRow[]>([]);

function createEmptyRow(): PrepareFormRow {
  return {
    kol_id: '',
    kol_url: '',
    has_budget: 0,
    budget_amount: undefined,
    remark: '',
  };
}

function openPrepareDrawer() {
  prepareRows.value = [createEmptyRow()];
  prepareDrawerOpen.value = true;
}

function closePrepareDrawer() {
  prepareDrawerOpen.value = false;
  prepareSubmitting.value = false;
}

function addPrepareRow() {
  prepareRows.value.push(createEmptyRow());
}

function removePrepareRow(index: number) {
  if (prepareRows.value.length <= 1) {
    prepareRows.value[0] = createEmptyRow();
    return;
  }
  prepareRows.value.splice(index, 1);
}

function dedupeFormRows(rows: PrepareFormRow[]): PrepareFormRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = row.kol_id.trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// --- Drawer submit ---
async function handleDrawerSubmit() {
  const filledRows = prepareRows.value.filter((r) => r.kol_id.trim());
  if (filledRows.length === 0) {
    message.warning('请至少输入一个达人ID');
    return;
  }

  const deduped = dedupeFormRows(filledRows);
  if (deduped.length < filledRows.length) {
    message.warning(
      `检测到 ${filledRows.length - deduped.length} 个重复的达人ID，已自动去除`,
    );
  }

  prepareSubmitting.value = true;
  try {
    await createKolPrepare({
      list: deduped.map((row) => {
        const item: {
          budget_amount?: number;
          has_budget: 0 | 1;
          kol_id: string;
          kol_url?: string;
          remark?: string;
        } = {
          kol_id: row.kol_id.trim(),
          kol_url: row.kol_url.trim() || undefined,
          has_budget: row.has_budget,
          remark: row.remark.trim() || undefined,
        };
        if (row.has_budget === 1) {
          item.budget_amount = row.budget_amount;
        }
        return item;
      }),
    });
    message.success(`成功提交 ${deduped.length} 条筹备记录`);
    closePrepareDrawer();
    listGridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '提交失败');
  } finally {
    prepareSubmitting.value = false;
  }
}

// --- List grid ---
const listColumns: VxeGridProps<KolPrepareApi.MyListItem>['columns'] = [
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
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: '录入时间',
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

const [ListGrid, listGridApi] = useVbenVxeGrid<KolPrepareApi.MyListItem>({
  gridOptions: {
    columns: listColumns,
    height: 'auto',
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const result = await getMyKolPrepareList({
            page: page.currentPage,
            page_size: page.pageSize,
          });
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'kol_id' },
    toolbarConfig: { refresh: true },
  },
});

// --- Edit Modal ---
const editVisible = ref(false);
const editSubmitting = ref(false);
const editingPrepareId = ref<null | number>(null);
const editForm = ref({
  kol_url: '',
  has_budget: 0 as 0 | 1,
  budget_amount: null as null | number,
  remark: '',
});

function openEditModal(row: KolPrepareApi.MyListItem) {
  editingPrepareId.value = row.prepare_id;
  editForm.value = {
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
    const updateData: {
      budget_amount?: number;
      has_budget: 0 | 1;
      kol_url?: string;
      prepare_id: number;
      remark?: null | string;
    } = {
      prepare_id: editingPrepareId.value!,
      kol_url: editForm.value.kol_url || undefined,
      has_budget: editForm.value.has_budget,
      remark: editForm.value.remark || undefined,
    };
    if (editForm.value.has_budget === 1) {
      updateData.budget_amount = editForm.value.budget_amount!;
    }
    await updateKolPrepare(updateData);
    message.success('更新成功');
    closeEditModal();
    listGridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
  } finally {
    editSubmitting.value = false;
  }
}

// --- Delete ---
async function handleDelete(prepareId: number) {
  Modal.confirm({
    content: '确认删除该筹备记录吗？',
    onOk: async () => {
      await deleteKolPrepare({ prepare_id: prepareId });
      message.success('删除成功');
      listGridApi.reload();
    },
    title: '确认删除',
  });
}
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
            达人筹备
          </h1>
          <p
            class="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            管理你的达人筹备记录。点击按钮填写达人信息，支持多行录入，提交后即可生效。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button type="primary" @click="openPrepareDrawer">新增筹备</Button>
        </div>
      </div>
    </div>

    <!-- My Preparation List -->
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          我的筹备记录
        </h3>
      </div>
      <ListGrid>
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
        <template #action="{ row }">
          <Button size="small" type="link" @click="openEditModal(row)">
            编辑
          </Button>
          <Button
            danger
            size="small"
            type="link"
            @click="handleDelete(row.prepare_id)"
          >
            删除
          </Button>
        </template>
      </ListGrid>
    </Card>

    <!-- Prepare Drawer: Multi-row form -->
    <Drawer
      :open="prepareDrawerOpen"
      :width="680"
      title="达人筹备录入"
      @close="closePrepareDrawer"
    >
      <div class="flex flex-col gap-4">
        <!-- Row cards -->
        <div
          v-for="(row, idx) in prepareRows"
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
            <Button
              danger
              size="small"
              type="link"
              @click="removePrepareRow(idx)"
            >
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
              <Select
                v-model:value="row.has_budget"
                :options="hasBudgetOptions"
                class="w-20"
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
        <Button block type="dashed" @click="addPrepareRow"> + 添加达人 </Button>
      </div>

      <!-- Drawer footer -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="closePrepareDrawer">取消</Button>
          <Button
            type="primary"
            :loading="prepareSubmitting"
            @click="handleDrawerSubmit"
          >
            提交
          </Button>
        </div>
      </template>
    </Drawer>

    <!-- Edit Modal -->
    <Modal
      v-model:open="editVisible"
      :confirm-loading="editSubmitting"
      title="编辑达人筹备"
      @cancel="closeEditModal"
      @ok="handleEditSubmit"
    >
      <div class="space-y-4 pt-2">
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
          <Select
            v-model:value="editForm.has_budget"
            :options="hasBudgetOptions"
            class="w-20"
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
