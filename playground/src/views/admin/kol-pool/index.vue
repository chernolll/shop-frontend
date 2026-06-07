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
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';
import * as XLSX from 'xlsx';

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

// --- Editor ---
const editorVisible = ref(false);
const editorSubmitting = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editingId = ref<null | number>(null);
const editorForm = ref({
  kol_id: '',
  kol_url: '',
  has_budget: 0 as 0 | 1,
  budget_amount: null as null | number,
  remark: '',
});

function openCreateEditor() {
  editorMode.value = 'create';
  editingId.value = null;
  editorForm.value = {
    kol_id: '',
    kol_url: '',
    has_budget: 0,
    budget_amount: null,
    remark: '',
  };
  editorVisible.value = true;
}

function openEditEditor(row: AdminKolPoolApi.ListItem) {
  editorMode.value = 'edit';
  editingId.value = row.id;
  editorForm.value = {
    kol_id: row.kol_id,
    kol_url: row.kol_url ?? '',
    has_budget: row.has_budget,
    budget_amount: row.budget_amount,
    remark: row.remark ?? '',
  };
  editorVisible.value = true;
}

function closeEditor() {
  editorVisible.value = false;
  editorSubmitting.value = false;
}

async function handleEditorSubmit() {
  if (editorMode.value === 'create' && !editorForm.value.kol_id.trim()) {
    message.warning('请输入达人ID');
    return;
  }
  if (editorForm.value.has_budget === 1 && !editorForm.value.budget_amount) {
    message.warning('有预算时必须填写预算金额');
    return;
  }

  editorSubmitting.value = true;
  try {
    if (editorMode.value === 'create') {
      await createKolPoolRecord({
        kol_id: editorForm.value.kol_id.trim(),
        kol_url: editorForm.value.kol_url || undefined,
        has_budget: editorForm.value.has_budget,
        budget_amount:
          editorForm.value.has_budget === 1
            ? editorForm.value.budget_amount
            : null,
        remark: editorForm.value.remark || undefined,
      });
      message.success('新增成功');
    } else {
      await updateKolPoolRecord({
        id: editingId.value!,
        kol_url: editorForm.value.kol_url || undefined,
        has_budget: editorForm.value.has_budget,
        budget_amount:
          editorForm.value.has_budget === 1
            ? editorForm.value.budget_amount
            : null,
        remark: editorForm.value.remark || undefined,
      });
      message.success('更新成功');
    }
    closeEditor();
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '操作失败');
  } finally {
    editorSubmitting.value = false;
  }
}

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

// --- Excel import ---
const fileInputRef = ref<HTMLInputElement>();
const importSubmitting = ref(false);

function triggerUpload() {
  fileInputRef.value?.click();
}

function downloadTemplate() {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = '/bd-prepare-template.xlsx';
  document.body.append(link);
  link.download = 'kol-pool-template.xlsx';
  link.click();
  link.remove();
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  importSubmitting.value = true;
  try {
    const rows = await parseExcelFile(file);
    if (rows.length === 0) {
      message.warning('Excel 中没有有效数据');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const row of rows) {
      try {
        await createKolPoolRecord({
          kol_id: row.kol_id,
          kol_url: row.kol_url || undefined,
          has_budget: row.has_budget ?? 0,
          budget_amount: row.budget_amount ?? null,
          remark: row.remark || undefined,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    message.success(`导入完成：${successCount} 条成功，${failCount} 条失败`);
    gridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '解析文件失败');
  } finally {
    importSubmitting.value = false;
    input.value = '';
  }
}

interface ExcelRow {
  budget_amount?: null | number;
  has_budget?: 0 | 1;
  kol_id: string;
  kol_url?: string;
  remark?: string;
}

function parseExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]!];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws!, { header: 1 });
        if (rows.length === 0) {
          reject(new Error('文件为空'));
          return;
        }

        const header = rows[0]!.map((h) => String(h ?? '').trim());
        const kolIdIdx = header.indexOf('kol_id');
        const kolUrlIdx = header.indexOf('kol_url');
        const hasBudgetIdx = header.indexOf('has_budget');
        const budgetAmountIdx = header.indexOf('budget_amount');
        const remarkIdx = header.indexOf('remark');

        if (kolIdIdx === -1) {
          reject(new Error('缺少 kol_id 列'));
          return;
        }

        const parsed = rows
          .slice(1)
          .map((row) => ({
            kol_id: String(row[kolIdIdx] ?? '').trim(),
            kol_url:
              kolUrlIdx === -1
                ? undefined
                : String(row[kolUrlIdx] ?? '').trim(),
            has_budget:
              hasBudgetIdx === -1
                ? undefined
                : (Number(row[hasBudgetIdx]) as 0 | 1),
            budget_amount:
              budgetAmountIdx === -1
                ? undefined
                : Number(row[budgetAmountIdx]) || null,
            remark:
              remarkIdx === -1
                ? undefined
                : String(row[remarkIdx] ?? '').trim(),
          }))
          .filter((r) => r.kol_id);

        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    reader.onerror = reject;
    // eslint-disable-next-line unicorn/prefer-blob-reading-methods
    reader.readAsArrayBuffer(file);
  });
}

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
      class="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-900">达人池管理</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理公共达人池中的达人。支持手动添加、Excel批量导入、编辑和删除。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button @click="downloadTemplate">下载模板</Button>
          <Button :loading="importSubmitting" @click="triggerUpload">
            批量导入
          </Button>
          <Button type="primary" @click="openCreateEditor">新增达人</Button>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      accept=".xlsx,.xls"
      style="display: none"
      type="file"
      @change="handleFileChange"
    />

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
          <span v-else class="text-slate-400">-</span>
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

    <!-- Editor Modal -->
    <Modal
      v-model:open="editorVisible"
      :confirm-loading="editorSubmitting"
      :title="editorMode === 'create' ? '新增达人' : '编辑达人'"
      @cancel="closeEditor"
      @ok="handleEditorSubmit"
    >
      <div class="space-y-4 pt-2">
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">达人ID</div>
          <Input
            v-model:value="editorForm.kol_id"
            :disabled="editorMode === 'edit'"
            :maxlength="100"
            placeholder="请输入达人ID"
          />
        </div>
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">
            达人主页链接
          </div>
          <Input
            v-model:value="editorForm.kol_url"
            placeholder="请输入达人主页链接（可选）"
          />
        </div>
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">有无预算</div>
          <Switch
            v-model:checked="editorForm.has_budget"
            :checked-value="1"
            :unchecked-value="0"
          />
        </div>
        <div v-if="editorForm.has_budget === 1">
          <div class="mb-2 text-sm font-medium text-slate-700">预算金额</div>
          <InputNumber
            v-model:value="editorForm.budget_amount"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="请输入预算金额"
          />
        </div>
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">备注</div>
          <Input v-model:value="editorForm.remark" placeholder="备注（可选）" />
        </div>
      </div>
    </Modal>
  </Page>
</template>
