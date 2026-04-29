<!-- eslint-disable unicorn/no-nested-ternary -->
<!-- eslint-disable unicorn/prefer-add-event-listener -->
<!-- eslint-disable unicorn/prefer-blob-reading-methods -->
<script lang="ts" setup>
// oxlint-disable typescript/no-non-null-assertion
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { BdTaskApi } from '#/api/bd/bd-my-task';
import type { KolApi } from '#/api/bd/kol';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Tabs,
  Tag,
} from 'ant-design-vue';
import * as XLSX from 'xlsx';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { queryKolPrepareData, uploadKolPrepareData } from '#/api/bd/bd-my-task';
import { queryKolPrepareState } from '#/api/bd/kol';
import { KoaPrepareAuditStatus, KolPrepareReasonCode } from '#/consts/bd-sop';

const route = useRoute();
const taskRelationId = Number(route.params.task_id);

function reasonCodeText(code: number): string {
  const map: Record<number, string> = {
    [KolPrepareReasonCode.CAN_PREPARE]: '可筹备',
    [KolPrepareReasonCode.TASK_DUPLICATE]: '任务内重复',
    [KolPrepareReasonCode.HAS_BD]: '已有所属BD',
    [KolPrepareReasonCode.PREPARED_BY_OTHER]: '被其他BD筹备',
    [KolPrepareReasonCode.KOL_DELETED]: '达人已删除',
    [KolPrepareReasonCode.KOL_ABNORMAL]: '状态异常',
  };
  return map[code] ?? String(code);
}

function kolStatusLabel(kolStatus: null | number): string {
  if (kolStatus === null) return '未录入';
  const map: Record<number, string> = { 1: '正常', 2: '流失', 3: '黑名单' };
  return map[kolStatus] ?? '-';
}

function auditStatusText(status: KoaPrepareAuditStatus): string {
  const map: Record<number, string> = {
    [KoaPrepareAuditStatus.PASS]: '已通过',
    [KoaPrepareAuditStatus.WAITING]: '待审核',
    [KoaPrepareAuditStatus.PENDING]: '审核中',
    [KoaPrepareAuditStatus.REJECT]: '不通过',
  };
  return map[status] ?? String(status);
}

function auditStatusColor(status: KoaPrepareAuditStatus): string {
  const map: Record<number, string> = {
    [KoaPrepareAuditStatus.PASS]: 'green',
    [KoaPrepareAuditStatus.WAITING]: 'processing',
    [KoaPrepareAuditStatus.PENDING]: 'processing',
    [KoaPrepareAuditStatus.REJECT]: 'red',
  };
  return map[status] ?? 'default';
}

interface PrepareRow {
  belong_bd_code?: string;
  can_prepare: boolean;
  entry_time: null | number;
  kol_id: string;
  kol_link?: string;
  kol_status: null | number;
  prepare_status: null | number;
  prepared_bd_code?: string;
  reason_code: number;
  reason_msg: string;
  taskId: number;
}

interface ParsedKolRow {
  kol_id: string;
  kol_link?: string;
}

const activeTab = ref('upload');
const previewData = ref<PrepareRow[]>([]);
const submitting = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const editorVisible = ref(false);
const editorSubmitting = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editingOriginalKolId = ref('');
const editorForm = ref<ParsedKolRow>({
  kol_id: '',
  kol_link: '',
});
const selectedReasonCode = ref<'all' | number>('all');
const selectedKolStatus = ref<'all' | number>('all');
const recordStatusFilter = ref<'all' | KoaPrepareAuditStatus>('all');

const hasNonNormal = computed(() =>
  previewData.value.some((row) => !row.can_prepare),
);
const canSubmit = computed(
  () => previewData.value.length > 0 && !hasNonNormal.value,
);
const filteredPreviewData = computed(() =>
  previewData.value.filter((row) => {
    const selectedStatus =
      selectedKolStatus.value === -1 ? null : selectedKolStatus.value;
    const matchesReasonCode =
      selectedReasonCode.value === 'all' ||
      row.reason_code === selectedReasonCode.value;
    const matchesKolStatus =
      selectedStatus === 'all' || row.kol_status === selectedStatus;
    return matchesReasonCode && matchesKolStatus;
  }),
);
const summary = computed(() => {
  const total = filteredPreviewData.value.length;
  const valid = filteredPreviewData.value.filter(
    (row) => row.can_prepare,
  ).length;
  const retryable = filteredPreviewData.value.filter(
    (row) =>
      row.can_prepare && row.prepare_status === KoaPrepareAuditStatus.REJECT,
  ).length;
  return {
    invalid: total - valid,
    retryable,
    total,
    valid,
  };
});
const hasActiveFilters = computed(
  () => selectedReasonCode.value !== 'all' || selectedKolStatus.value !== 'all',
);
const editorTitle = computed(() =>
  editorMode.value === 'create' ? '添加达人' : '编辑达人',
);
const reasonCodeOptions = computed(() => [
  { label: '全部校验结果', value: 'all' },
  ...Object.values(KolPrepareReasonCode)
    .filter((value): value is number => typeof value === 'number')
    .map((value) => ({
      label: reasonCodeText(value),
      value,
    })),
]);
const kolStatusOptions = computed(() => [
  { label: '全部达人状态', value: 'all' },
  { label: kolStatusLabel(1), value: 1 },
  { label: kolStatusLabel(2), value: 2 },
  { label: kolStatusLabel(3), value: 3 },
  { label: kolStatusLabel(null), value: -1 },
]);
const recordStatusOptions = computed(() => [
  { label: '全部审核状态', value: 'all' },
  // { label: auditStatusText(KoaPrepareAuditStatus.WAITING), value: KoaPrepareAuditStatus.WAITING },
  {
    label: auditStatusText(KoaPrepareAuditStatus.PENDING),
    value: KoaPrepareAuditStatus.PENDING,
  },
  {
    label: auditStatusText(KoaPrepareAuditStatus.REJECT),
    value: KoaPrepareAuditStatus.REJECT,
  },
  {
    label: auditStatusText(KoaPrepareAuditStatus.PASS),
    value: KoaPrepareAuditStatus.PASS,
  },
]);

function normalizeKolId(value: string) {
  return value.trim();
}

function normalizeKolLink(value?: string) {
  return value?.trim() ?? '';
}

function dedupeKolIds(kolIds: string[]) {
  return [
    ...new Set(kolIds.map((item) => normalizeKolId(item)).filter(Boolean)),
  ];
}

function mapPrepareRows(
  data: KolApi.ValidKolStateResult[],
  linkMap: Map<string, string> = new Map(),
): PrepareRow[] {
  return data.map((item) => ({
    ...item,
    kol_link: linkMap.has(item.kol_id) ? linkMap.get(item.kol_id) : undefined,
    taskId: taskRelationId,
  }));
}

function mergePrepareRows(
  currentRows: PrepareRow[],
  incomingRows: PrepareRow[],
) {
  const rowMap = new Map(currentRows.map((row) => [row.kol_id, row]));

  for (const row of incomingRows) {
    const previousRow = rowMap.get(row.kol_id);
    rowMap.set(row.kol_id, {
      ...previousRow,
      ...row,
      kol_link: row.kol_link || previousRow?.kol_link,
    });
  }

  return [...rowMap.values()];
}

function prepareDetailText(row: PrepareRow) {
  if (row.can_prepare) {
    if (row.prepare_status === KoaPrepareAuditStatus.REJECT) {
      return '该达人此前申请被驳回，本次可重新提交。';
    }
    return row.reason_msg || '当前达人状态正常，可进入筹备提交流程。';
  }

  switch (row.reason_code) {
    case KolPrepareReasonCode.HAS_BD: {
      return row.belong_bd_code
        ? `该达人已归属 ${row.belong_bd_code}，当前不可重复筹备。`
        : '该达人已有归属 BD，当前不可重复筹备。';
    }
    case KolPrepareReasonCode.KOL_ABNORMAL: {
      return '达人状态不是正常可合作状态，请先确认达人情况。';
    }
    case KolPrepareReasonCode.KOL_DELETED: {
      return '达人资料已删除，不能继续进入筹备流程。';
    }
    case KolPrepareReasonCode.PREPARED_BY_OTHER: {
      return row.prepared_bd_code
        ? `该达人当前由 ${row.prepared_bd_code} 筹备，请更换达人。`
        : '该达人已被其他 BD 筹备，请更换达人。';
    }
    case KolPrepareReasonCode.TASK_DUPLICATE: {
      return '当前任务下已存在你的有效筹备记录，请勿重复提交。';
    }
    default: {
      return row.reason_msg || '-';
    }
  }
}

function availabilityTagColor(row: PrepareRow) {
  if (row.can_prepare) return 'success';
  if (row.reason_code === KolPrepareReasonCode.TASK_DUPLICATE) return 'warning';
  return 'error';
}

function availabilityTagText(row: PrepareRow) {
  if (row.can_prepare && row.prepare_status === KoaPrepareAuditStatus.REJECT) {
    return '可重新提交';
  }
  return row.can_prepare ? '可筹备' : reasonCodeText(row.reason_code);
}

function syncUploadGrid() {
  uploadGridApi.setGridOptions({ data: filteredPreviewData.value });
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

async function validateKolIds(items: ParsedKolRow[]) {
  const ids = dedupeKolIds(items.map((item) => item.kol_id));
  if (ids.length === 0) {
    return [];
  }

  const linkMap = new Map(
    items
      .filter((item) => item.kol_link !== undefined)
      .map((item) => [item.kol_id, item.kol_link ?? ''] as const),
  );
  const data = await queryKolPrepareState({
    kol_ids: ids,
    task_id: taskRelationId,
  });
  return mapPrepareRows(data, linkMap);
}

async function appendValidatedRows(items: ParsedKolRow[]) {
  const normalizedItems = dedupeKolIds(items.map((item) => item.kol_id)).map(
    (kolId) =>
      items.find((item) => item.kol_id === kolId) ?? {
        kol_id: kolId,
      },
  );
  if (normalizedItems.length === 0) {
    message.warning('请输入至少一个有效的达人ID');
    return;
  }

  const beforeIds = new Set(previewData.value.map((row) => row.kol_id));
  const duplicateCount = normalizedItems.filter((item) =>
    beforeIds.has(item.kol_id),
  ).length;
  const validatedRows = await validateKolIds(normalizedItems);

  previewData.value = mergePrepareRows(previewData.value, validatedRows);
  syncUploadGrid();

  const appendedCount = validatedRows.filter(
    (row) => !beforeIds.has(row.kol_id),
  ).length;
  const updatedCount = validatedRows.length - appendedCount;
  const duplicateMessage =
    duplicateCount > 0 ? `，其中 ${duplicateCount} 条已存在并已刷新状态` : '';

  message.success(
    `已校验 ${validatedRows.length} 条达人ID，新增 ${appendedCount} 条，更新 ${updatedCount} 条${duplicateMessage}`,
  );
}

function removePrepareRow(kolId: string) {
  previewData.value = previewData.value.filter((row) => row.kol_id !== kolId);
  syncUploadGrid();
}

function clearPreviewData() {
  previewData.value = [];
  selectedReasonCode.value = 'all';
  selectedKolStatus.value = 'all';
  syncUploadGrid();
}

function resetFilters() {
  selectedReasonCode.value = 'all';
  selectedKolStatus.value = 'all';
}

function openCreateEditor() {
  editorMode.value = 'create';
  editingOriginalKolId.value = '';
  editorForm.value = {
    kol_id: '',
    kol_link: '',
  };
  editorVisible.value = true;
}

function openEditEditor(row: PrepareRow) {
  editorMode.value = 'edit';
  editingOriginalKolId.value = row.kol_id;
  editorForm.value = {
    kol_id: row.kol_id,
    kol_link: row.kol_link ?? '',
  };
  editorVisible.value = true;
}

function closeEditor() {
  editorVisible.value = false;
  editorSubmitting.value = false;
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const rows = await parseExcelFile(file);
    if (rows.length === 0) {
      message.warning('未在 Excel 中检测到有效的达人ID数据');
      return;
    }
    uploadGridApi.setLoading(true);
    await appendValidatedRows(rows);
  } catch (error: any) {
    message.error(error?.message || 'Excel 文件解析失败，请检查文件格式');
  } finally {
    uploadGridApi.setLoading(false);
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
        const kolLinkIndex = header.indexOf('kol_link');
        if (kolIdIndex === -1) {
          reject(new Error('未检测到 kol_id 列'));
          return;
        }

        const parsedRows = rows
          .slice(1)
          .map((row) => {
            const kolId = String(row[kolIdIndex] ?? '').trim();
            const kolLink =
              kolLinkIndex === -1
                ? undefined
                : String(row[kolLinkIndex] ?? '').trim();
            return {
              kol_id: kolId,
              kol_link: kolLink,
            };
          })
          .filter((row) => row.kol_id);
        resolve(parsedRows);
      } catch (error) {
        reject(error);
      }
    });
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function handleEditorSubmit() {
  const kolId = normalizeKolId(editorForm.value.kol_id);
  const kolLink = normalizeKolLink(editorForm.value.kol_link);
  if (!kolId) {
    message.warning('请输入达人ID');
    return;
  }
  if (!kolLink) {
    message.warning('请输入达人链接');
    return;
  }

  const previousRows = [...previewData.value];
  editorSubmitting.value = true;
  try {
    if (editingOriginalKolId.value && editingOriginalKolId.value !== kolId) {
      previewData.value = previewData.value.filter(
        (row) => row.kol_id !== editingOriginalKolId.value,
      );
      syncUploadGrid();
    }
    await appendValidatedRows([
      {
        kol_id: kolId,
        kol_link: kolLink,
      },
    ]);
    closeEditor();
  } catch (error: any) {
    previewData.value = previousRows;
    syncUploadGrid();
    message.error(error?.message || '保存失败，请稍后重试');
  } finally {
    editorSubmitting.value = false;
  }
}

async function handleSubmit() {
  if (previewData.value.length === 0) {
    message.warning('当前没有可提交的达人筹备数据');
    return;
  }
  if (hasNonNormal.value) {
    message.warning('存在状态异常的达人数据，请先删除后再提交');
    return;
  }

  const missingLinkRow = previewData.value.find(
    (row) => !normalizeKolLink(row.kol_link),
  );
  if (missingLinkRow) {
    message.warning(
      `达人 ${missingLinkRow.kol_id} 缺少达人链接，请补充后再提交`,
    );
    return;
  }

  submitting.value = true;
  try {
    const payload: BdTaskApi.BdKolPrepareParams = {
      list: previewData.value.map((row) => ({
        kol_id: row.kol_id,
        kol_link: normalizeKolLink(row.kol_link),
      })),
      task_id: taskRelationId,
    };
    await uploadKolPrepareData(payload);
    message.success(`成功提交 ${previewData.value.length} 条达人筹备记录`);
    clearPreviewData();
    activeTab.value = 'records';
    recordGridApi.reload();
  } catch (error: any) {
    message.error(error?.message || '提交失败，请重试');
  } finally {
    submitting.value = false;
  }
}

watch(activeTab, (tab) => {
  if (tab === 'records') {
    recordGridApi.reload();
  }
});

const uploadColumns: VxeGridProps<PrepareRow>['columns'] = [
  { field: 'kol_id', title: '达人ID', width: 180 },
  {
    field: 'kol_link',
    minWidth: 220,
    slots: { default: 'kol_link' },
    title: '达人链接',
  },
  {
    field: 'reason_msg',
    minWidth: 160,
    slots: { default: 'reason' },
    title: '校验结果',
  },
  {
    field: 'detail',
    minWidth: 320,
    slots: { default: 'detail' },
    title: '结果说明',
  },
  {
    field: 'kol_status',
    slots: { default: 'kol_status' },
    title: '达人状态',
    width: 120,
  },
  {
    field: 'prepare_status',
    slots: { default: 'prepare_status' },
    title: '历史审核',
    width: 120,
  },
  {
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: '录入时间',
    width: 180,
  },
  {
    field: 'action',
    slots: { default: 'action' },
    title: '操作',
    width: 150,
  },
];

const recordColumns: VxeGridProps<BdTaskApi.PrepareDataRow>['columns'] = [
  { field: 'kol_id', title: '达人ID', width: 180 },
  {
    field: 'kol_link',
    minWidth: 220,
    slots: { default: 'kol_link' },
    title: '达人链接',
  },
  {
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: '录入时间',
    width: 180,
  },
  {
    field: 'status',
    slots: { default: 'status' },
    title: '审核状态',
    width: 150,
  },
  {
    field: 'reviewer_name',
    title: '审核人',
    width: 140,
  },
  {
    field: 'audit_time',
    formatter: 'formatDateTime',
    title: '审核时间',
    width: 180,
  },
  { field: 'reason', minWidth: 180, title: '审核原因' },
];

const [UploadGrid, uploadGridApi] = useVbenVxeGrid<PrepareRow>({
  gridOptions: {
    columns: uploadColumns,
    data: [],
    maxHeight: 520,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'kol_id' },
    scrollY: {
      enabled: true,
      gt: 0,
    },
    showOverflow: true,
  },
});

const [RecordGrid, recordGridApi] = useVbenVxeGrid<BdTaskApi.PrepareDataRow>({
  gridOptions: {
    columns: recordColumns,
    height: 'auto',
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const result = await queryKolPrepareData({
            page: page.currentPage,
            page_size: page.pageSize,
            status:
              recordStatusFilter.value === 'all'
                ? undefined
                : recordStatusFilter.value,
            task_id: taskRelationId,
          });
          return {
            items: result.list,
            total: result.total,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'kol_id',
    },
    toolbarConfig: { refresh: true },
  },
});

watch(
  [previewData, filteredPreviewData, selectedReasonCode, selectedKolStatus],
  () => {
    uploadGridApi.setGridOptions({ data: filteredPreviewData.value });
  },
  { deep: true },
);

watch(recordStatusFilter, () => {
  if (activeTab.value === 'records') {
    recordGridApi.reload();
  }
});
</script>

<template>
  <Page auto-content-height>
    <div
      class="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div>
          <div class="mb-2 flex items-center text-sm text-slate-400">
            <router-link
              to="/bd/my-tasks"
              class="transition-colors hover:text-blue-500"
            >
              我的任务
            </router-link>
            <span class="mx-2 text-slate-300">/</span>
            <span>达人筹备</span>
          </div>
          <h1 class="text-xl font-semibold text-slate-900">
            任务分配 #{{ taskRelationId }} 达人筹备表
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            上传 Excel
            或手动补充达人ID，系统会按当前任务分配和达人占用状态做预校验；
            你可以先整理名单，再统一提交筹备记录。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 lg:min-w-[360px] lg:grid-cols-2">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <div class="text-xs text-slate-500">
              {{ hasActiveFilters ? '筛选结果' : '当前名单' }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-slate-900">
              {{ summary.total }}
            </div>
            <div v-if="hasActiveFilters" class="mt-1 text-xs text-slate-400">
              全部 {{ previewData.length }} 条
            </div>
          </div>
          <div class="rounded-xl bg-emerald-50 px-4 py-3">
            <div class="text-xs text-emerald-700">可筹备</div>
            <div class="mt-1 text-2xl font-semibold text-emerald-700">
              {{ summary.valid }}
            </div>
          </div>
          <div v-if="false" class="rounded-xl bg-amber-50 px-4 py-3">
            <div class="text-xs text-amber-700">待处理</div>
            <div class="mt-1 text-2xl font-semibold text-amber-700">
              {{ summary.invalid }}
            </div>
          </div>
          <div v-if="false" class="rounded-xl bg-sky-50 px-4 py-3">
            <div class="text-xs text-sky-700">可重提</div>
            <div class="mt-1 text-2xl font-semibold text-sky-700">
              {{ summary.retryable }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="upload" tab="上传筹备">
        <Card :bordered="false" class="rounded-2xl shadow-sm">
          <div
            class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 class="text-base font-semibold text-slate-900">
                Excel 导入与名单维护
              </h3>
              <p class="mt-1 text-sm text-slate-500">
                模板首行需要包含 `kol_id` 与 `kol_link`
                列。导入后可在结果表格里继续编辑或补充达人。
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button @click="downloadTemplate">下载模板</Button>
              <Button type="primary" @click="triggerUpload">上传 Excel</Button>
              <Button @click="openCreateEditor">添加行</Button>
              <Button
                v-if="previewData.length > 0"
                danger
                ghost
                @click="clearPreviewData"
              >
                清空名单
              </Button>
            </div>
          </div>
        </Card>

        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none"
          @change="handleFileChange"
        />

        <div v-if="previewData.length > 0" class="mt-4 space-y-4">
          <Alert
            v-if="hasNonNormal"
            type="warning"
            show-icon
            message="当前名单中存在不可筹备达人"
            description="请删除异常行，或调整达人后再提交；处于“可重新提交”的达人可以直接保留。"
          />

          <Card :bordered="false" class="rounded-2xl shadow-sm">
            <div
              class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 class="text-base font-semibold text-blue-900">解析结果</h3>
                <p class="mt-1 text-sm text-slate-500">
                  当前共 {{ summary.total }} 条，其中
                  {{ summary.valid }} 条可筹备，
                  {{ summary.invalid }} 条需处理。
                  <template v-if="hasActiveFilters">
                    当前为筛选视图，全部名单共 {{ previewData.length }} 条。
                  </template>
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Select
                  v-model:value="selectedReasonCode"
                  :options="reasonCodeOptions"
                  class="min-w-[160px]"
                />
                <Select
                  v-model:value="selectedKolStatus"
                  :options="kolStatusOptions"
                  class="min-w-[160px]"
                />
                <Button v-if="hasActiveFilters" @click="resetFilters">
                  清空筛选
                </Button>
                <Button
                  type="primary"
                  :loading="submitting"
                  :disabled="!canSubmit"
                  @click="handleSubmit"
                >
                  提交筹备
                </Button>
              </div>
            </div>

            <UploadGrid>
              <template #kol_link="{ row }">
                <a
                  v-if="row.kol_link"
                  :href="row.kol_link"
                  target="_blank"
                  rel="noreferrer"
                  class="text-blue-500 hover:underline"
                >
                  {{ row.kol_link }}
                </a>
                <span v-else class="text-slate-400">-</span>
              </template>
              <template #reason="{ row }">
                <Tag :color="availabilityTagColor(row)">
                  {{ availabilityTagText(row) }}
                </Tag>
              </template>
              <template #detail="{ row }">
                <div class="leading-6 text-slate-600">
                  {{ prepareDetailText(row) }}
                </div>
              </template>
              <template #kol_status="{ row }">
                <Tag
                  :color="
                    row.kol_status === 1
                      ? 'green'
                      : row.kol_status
                        ? 'orange'
                        : 'default'
                  "
                >
                  {{ kolStatusLabel(row.kol_status) }}
                </Tag>
              </template>
              <template #prepare_status="{ row }">
                <Tag
                  v-if="row.prepare_status !== null"
                  :color="auditStatusColor(row.prepare_status)"
                >
                  {{ auditStatusText(row.prepare_status) }}
                </Tag>
                <span v-else class="text-slate-400">-</span>
              </template>
              <template #action="{ row }">
                <Button size="small" type="link" @click="openEditEditor(row)">
                  编辑
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="removePrepareRow(row.kol_id)"
                >
                  删除
                </Button>
              </template>
            </UploadGrid>
          </Card>
        </div>

        <div
          v-if="previewData.length === 0"
          class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-16 text-center"
        >
          <div class="text-base font-medium text-slate-700">
            还没有导入任何达人
          </div>
          <div class="mt-2 text-sm text-slate-500">
            可以先上传 Excel 模板，或点击“添加行”手动补充达人信息后再校验。
          </div>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="records" tab="提交记录">
        <Card :bordered="false" class="rounded-2xl shadow-sm">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-slate-900">提交记录</h3>
              <p class="mt-1 text-sm text-slate-500">
                支持按审核状态筛选，并按分页查看当前任务的达人筹备记录。
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Select
                v-model:value="recordStatusFilter"
                :options="recordStatusOptions"
                class="min-w-[180px]"
              />
              <Button
                v-if="recordStatusFilter !== 'all'"
                @click="recordStatusFilter = 'all'"
              >
                清空筛选
              </Button>
            </div>
          </div>
          <RecordGrid>
            <template #status="{ row }">
              <Tag :color="auditStatusColor(row.status)">
                {{ auditStatusText(row.status) }}
              </Tag>
            </template>
            <template #kol_link="{ row }">
              <a
                :href="row.kol_link"
                target="_blank"
                rel="noreferrer"
                class="text-blue-500 hover:underline"
              >
                {{ row.kol_link }}
              </a>
            </template>
          </RecordGrid>
        </Card>
      </Tabs.TabPane>
    </Tabs>

    <Modal
      :open="editorVisible"
      :title="editorTitle"
      :confirm-loading="editorSubmitting"
      ok-text="保存并校验"
      cancel-text="取消"
      @cancel="closeEditor"
      @ok="handleEditorSubmit"
    >
      <div class="space-y-4 pt-2">
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">达人ID</div>
          <Input
            v-model:value="editorForm.kol_id"
            placeholder="请输入达人ID"
            :maxlength="100"
          />
        </div>
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">达人链接</div>
          <Input
            v-model:value="editorForm.kol_link"
            placeholder="请输入达人链接"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>
