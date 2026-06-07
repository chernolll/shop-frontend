<!-- eslint-disable unicorn/no-nested-ternary -->
<!-- eslint-disable unicorn/prefer-add-event-listener -->
<!-- eslint-disable unicorn/prefer-blob-reading-methods -->
<script lang="ts" setup>
// oxlint-disable typescript/no-non-null-assertion
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { KolPrepareApi } from '#/api/bd/kol-prepare';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
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
  createKolPrepare,
  deleteKolPrepare,
  getMyKolPrepareList,
  validateKolPrepare,
} from '#/api/bd/kol-prepare';
import { KolPrepareReasonCode } from '#/consts/bd-sop';

interface ParsedKolRow {
  kol_id: string;
  kol_url?: string;
}

interface PreviewRow {
  budget_amount: null | number;
  can_prepare: boolean;
  has_budget: 0 | 1;
  kol_id: string;
  kol_url: string;
  reason_code: number;
  reason_msg: string;
  remark: string;
}

// --- Reason code helpers ---
function reasonCodeText(code: number): string {
  const map: Record<number, string> = {
    [KolPrepareReasonCode.CAN_PREPARE]: '可筹备',
    [KolPrepareReasonCode.TASK_DUPLICATE]: '已在筹备列表中',
    [KolPrepareReasonCode.HAS_BD]: '达人已有所属BD',
    [KolPrepareReasonCode.PREPARED_BY_OTHER]: '已被其他BD筹备占用',
    [KolPrepareReasonCode.KOL_DELETED]: '达人已删除',
    [KolPrepareReasonCode.KOL_ABNORMAL]: '达人状态异常',
  };
  return map[code] ?? String(code);
}

function availabilityTagColor(row: PreviewRow) {
  if (row.can_prepare) return 'success';
  if (row.reason_code === KolPrepareReasonCode.TASK_DUPLICATE) return 'warning';
  return 'error';
}

// --- State ---
const submitting = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const previewData = ref<PreviewRow[]>([]);
const previewVisible = ref(false);
const selectedReasonCode = ref<'all' | number>('all');

const hasNonNormal = computed(() =>
  previewData.value.some((row) => !row.can_prepare),
);
const canSubmit = computed(
  () => previewData.value.length > 0 && !hasNonNormal.value,
);
const filteredPreviewData = computed(() =>
  selectedReasonCode.value === 'all'
    ? previewData.value
    : previewData.value.filter(
        (row) => row.reason_code === selectedReasonCode.value,
      ),
);

const reasonCodeOptions = computed(() => [
  { label: '全部校验结果', value: 'all' as const },
  ...Object.values(KolPrepareReasonCode)
    .filter((v): v is number => typeof v === 'number')
    .map((v) => ({ label: reasonCodeText(v), value: v })),
]);

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
    width: 80,
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

// --- Preview grid ---
const previewColumns: VxeGridProps<PreviewRow>['columns'] = [
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
    field: 'reason_msg',
    minWidth: 140,
    slots: { default: 'reason' },
    title: '校验结果',
  },
  {
    field: 'has_budget',
    slots: { default: 'has_budget_edit' },
    title: '有无预算',
    width: 100,
  },
  {
    field: 'budget_amount',
    slots: { default: 'budget_amount_edit' },
    title: '预算金额',
    width: 140,
  },
  {
    field: 'remark',
    slots: { default: 'remark_edit' },
    minWidth: 160,
    title: '备注',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 80,
  },
];

const [PreviewGrid, previewGridApi] = useVbenVxeGrid<PreviewRow>({
  gridOptions: {
    columns: previewColumns,
    data: [],
    maxHeight: 520,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'kol_id' },
    scrollY: { enabled: true, gt: 0 },
    showOverflow: true,
  },
});

// --- Actions ---
function syncPreviewGrid() {
  previewGridApi.setGridOptions({ data: filteredPreviewData.value });
}

function normalizeKolId(value: string) {
  return value.trim();
}

function dedupeKolIds(items: ParsedKolRow[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = normalizeKolId(item.kol_id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function validateAndPreview(items: ParsedKolRow[]) {
  const deduped = dedupeKolIds(items);
  if (deduped.length === 0) {
    message.warning('请输入有效的达人ID');
    return;
  }

  const existingIds = new Set(previewData.value.map((r) => r.kol_id));
  const newItems = deduped.filter((item) => !existingIds.has(item.kol_id));

  if (newItems.length === 0) {
    message.warning('所有达人已在预览列表中');
    return;
  }

  const result = await validateKolPrepare({
    kol_ids: newItems.map((item) => item.kol_id),
  });

  const linkMap = new Map(
    newItems.map((item) => [item.kol_id, item.kol_url ?? '']),
  );
  const rows: PreviewRow[] = result.map((item) => ({
    budget_amount: null,
    can_prepare: item.can_prepare,
    has_budget: 0,
    kol_id: item.kol_id,
    kol_url: linkMap.get(item.kol_id) ?? '',
    reason_code: item.reason_code,
    reason_msg: item.reason_msg,
    remark: '',
  }));

  previewData.value = [...previewData.value, ...rows];
  syncPreviewGrid();
  previewVisible.value = true;
  message.success(`已校验 ${rows.length} 个达人`);
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const rows = await parseExcelFile(file);
    if (rows.length === 0) {
      message.warning('Excel 中没有有效的达人ID');
      return;
    }
    await validateAndPreview(rows);
  } catch (error: any) {
    message.error(error?.message || '解析文件失败');
  } finally {
    input.value = '';
  }
}

function parseExcelFile(file: File): Promise<ParsedKolRow[]> {
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
        const kolIdIndex = header.indexOf('kol_id');
        const kolUrlIndex = header.indexOf('kol_url');
        if (kolIdIndex === -1) {
          reject(new Error('缺少 kol_id 列'));
          return;
        }

        const parsed = rows
          .slice(1)
          .map((row) => ({
            kol_id: String(row[kolIdIndex] ?? '').trim(),
            kol_url:
              kolUrlIndex === -1
                ? undefined
                : String(row[kolUrlIndex] ?? '').trim(),
          }))
          .filter((row) => row.kol_id);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function triggerUpload() {
  fileInputRef.value?.click();
}

function downloadTemplate() {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = '/bd-prepare-template.xlsx';
  document.body.append(link);
  link.download = 'bd-prepare-template.xlsx';
  link.click();
  link.remove();
}

function removePreviewRow(kolId: string) {
  previewData.value = previewData.value.filter((row) => row.kol_id !== kolId);
  syncPreviewGrid();
}

function clearPreviewData() {
  previewData.value = [];
  selectedReasonCode.value = 'all';
  syncPreviewGrid();
}

async function handleSubmit() {
  if (previewData.value.length === 0) return;
  if (hasNonNormal.value) {
    message.warning('存在不可筹备的达人，请先删除后再提交');
    return;
  }

  submitting.value = true;
  try {
    await createKolPrepare({
      list: previewData.value.map((row) => ({
        kol_id: row.kol_id,
        kol_url: row.kol_url || undefined,
        has_budget: row.has_budget,
        budget_amount: row.has_budget === 1 ? row.budget_amount : null,
        remark: row.remark || undefined,
      })),
    });
    message.success(`成功提交 ${previewData.value.length} 条筹备记录`);
    clearPreviewData();
    previewVisible.value = false;
    listGridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

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
      class="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold text-slate-900">达人筹备</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            管理你的达人筹备记录。上传 Excel
            或手动添加达人，校验通过后即可提交。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button @click="downloadTemplate">下载模板</Button>
          <Button type="primary" @click="triggerUpload">上传 Excel</Button>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      accept=".xlsx,.xls"
      style="display: none"
      type="file"
      @change="handleFileChange"
    />

    <!-- My Preparation List -->
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-900">我的筹备记录</h3>
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
          <span v-else class="text-slate-400">-</span>
        </template>
        <template #has_budget="{ row }">
          <Tag :color="row.has_budget === 1 ? 'green' : 'default'">
            {{ row.has_budget === 1 ? '有' : '无' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Button
            danger
            size="small"
            type="link"
            @click="handleDelete((row as any).prepare_id)"
          >
            删除
          </Button>
        </template>
      </ListGrid>
    </Card>

    <!-- Preview Modal -->
    <Modal
      v-model:open="previewVisible"
      :footer="null"
      title="达人校验预览"
      width="1000px"
    >
      <div v-if="previewData.length > 0" class="space-y-4">
        <Alert
          v-if="hasNonNormal"
          show-icon
          type="warning"
          message="存在不可筹备的达人"
          description="请删除异常行后再提交。"
        />

        <div class="mb-4 flex items-center justify-between">
          <Select
            v-model:value="selectedReasonCode"
            :options="reasonCodeOptions"
            class="min-w-[160px]"
          />
          <div class="flex gap-2">
            <Button @click="clearPreviewData">清空列表</Button>
            <Button
              type="primary"
              :disabled="!canSubmit"
              :loading="submitting"
              @click="handleSubmit"
            >
              提交筹备 ({{ previewData.filter((r) => r.can_prepare).length }})
            </Button>
          </div>
        </div>

        <PreviewGrid>
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
          <template #reason="{ row }">
            <Tag :color="availabilityTagColor(row)">
              {{ reasonCodeText(row.reason_code) }}
            </Tag>
          </template>
          <template #has_budget_edit="{ row }">
            <Switch
              v-model:checked="row.has_budget"
              :checked-value="1"
              :unchecked-value="0"
              :disabled="!row.can_prepare"
            />
          </template>
          <template #budget_amount_edit="{ row }">
            <InputNumber
              v-model:value="row.budget_amount"
              :disabled="!row.can_prepare || row.has_budget !== 1"
              :min="0"
              :precision="2"
              class="w-full"
              placeholder="预算金额"
            />
          </template>
          <template #remark_edit="{ row }">
            <Input
              v-model:value="row.remark"
              :disabled="!row.can_prepare"
              placeholder="备注（可选）"
            />
          </template>
          <template #action="{ row }">
            <Button
              danger
              size="small"
              type="link"
              @click="removePreviewRow(row.kol_id)"
            >
              删除
            </Button>
          </template>
        </PreviewGrid>
      </div>
      <div v-else class="py-16 text-center text-slate-500">暂无数据</div>
    </Modal>
  </Page>
</template>
