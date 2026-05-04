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
import { $t } from '#/locales';

const route = useRoute();
const taskRelationId = Number(route.params.task_id);

function reasonCodeText(code: number): string {
  const map: Record<number, string> = {
    [KolPrepareReasonCode.CAN_PREPARE]: $t(
      'page.bd.my-task.kol-prepare.reason-code.can-prepare',
    ),
    [KolPrepareReasonCode.TASK_DUPLICATE]: $t(
      'page.bd.my-task.kol-prepare.reason-code.task-duplicate',
    ),
    [KolPrepareReasonCode.HAS_BD]: $t(
      'page.bd.my-task.kol-prepare.reason-code.has-bd',
    ),
    [KolPrepareReasonCode.PREPARED_BY_OTHER]: $t(
      'page.bd.my-task.kol-prepare.reason-code.prepared-by-other',
    ),
    [KolPrepareReasonCode.KOL_DELETED]: $t(
      'page.bd.my-task.kol-prepare.reason-code.kol-deleted',
    ),
    [KolPrepareReasonCode.KOL_ABNORMAL]: $t(
      'page.bd.my-task.kol-prepare.reason-code.kol-abnormal',
    ),
  };
  return map[code] ?? String(code);
}

function kolStatusLabel(kolStatus: null | number): string {
  if (kolStatus === null)
    return $t('page.bd.my-task.kol-prepare.kol-status.unrecorded');
  const map: Record<number, string> = {
    1: $t('page.bd.my-task.kol-prepare.kol-status.normal'),
    2: $t('page.bd.my-task.kol-prepare.kol-status.lost'),
    3: $t('page.bd.my-task.kol-prepare.kol-status.blacklist'),
  };
  return map[kolStatus] ?? '-';
}

function auditStatusText(status: KoaPrepareAuditStatus): string {
  const map: Record<number, string> = {
    [KoaPrepareAuditStatus.PASS]: $t(
      'page.bd.my-task.kol-prepare.audit-status.pass',
    ),
    [KoaPrepareAuditStatus.WAITING]: $t(
      'page.bd.my-task.kol-prepare.audit-status.waiting',
    ),
    [KoaPrepareAuditStatus.PENDING]: $t(
      'page.bd.my-task.kol-prepare.audit-status.pending',
    ),
    [KoaPrepareAuditStatus.REJECT]: $t(
      'page.bd.my-task.kol-prepare.audit-status.reject',
    ),
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
  editorMode.value === 'create'
    ? $t('page.bd.my-task.kol-prepare.editor.create-title')
    : $t('page.bd.my-task.kol-prepare.editor.edit-title'),
);
const reasonCodeOptions = computed(() => [
  { label: $t('page.bd.my-task.kol-prepare.filters.all-reason'), value: 'all' },
  ...Object.values(KolPrepareReasonCode)
    .filter((value): value is number => typeof value === 'number')
    .map((value) => ({
      label: reasonCodeText(value),
      value,
    })),
]);
const kolStatusOptions = computed(() => [
  {
    label: $t('page.bd.my-task.kol-prepare.filters.all-kol-status'),
    value: 'all',
  },
  { label: kolStatusLabel(1), value: 1 },
  { label: kolStatusLabel(2), value: 2 },
  { label: kolStatusLabel(3), value: 3 },
  { label: kolStatusLabel(null), value: -1 },
]);
const recordStatusOptions = computed(() => [
  {
    label: $t('page.bd.my-task.kol-prepare.filters.all-audit-status'),
    value: 'all',
  },
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
      return $t('page.bd.my-task.kol-prepare.detail.retryable');
    }
    return row.reason_msg || $t('page.bd.my-task.kol-prepare.detail.normal');
  }

  switch (row.reason_code) {
    case KolPrepareReasonCode.HAS_BD: {
      return row.belong_bd_code
        ? $t('page.bd.my-task.kol-prepare.detail.has-bd-with-code', [
            row.belong_bd_code,
          ])
        : $t('page.bd.my-task.kol-prepare.detail.has-bd');
    }
    case KolPrepareReasonCode.KOL_ABNORMAL: {
      return $t('page.bd.my-task.kol-prepare.detail.kol-abnormal');
    }
    case KolPrepareReasonCode.KOL_DELETED: {
      return $t('page.bd.my-task.kol-prepare.detail.kol-deleted');
    }
    case KolPrepareReasonCode.PREPARED_BY_OTHER: {
      return row.prepared_bd_code
        ? $t('page.bd.my-task.kol-prepare.detail.prepared-by-other-with-code', [
            row.prepared_bd_code,
          ])
        : $t('page.bd.my-task.kol-prepare.detail.prepared-by-other');
    }
    case KolPrepareReasonCode.TASK_DUPLICATE: {
      return $t('page.bd.my-task.kol-prepare.detail.task-duplicate');
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
    return $t('page.bd.my-task.kol-prepare.availability.retryable');
  }
  return row.can_prepare
    ? $t('page.bd.my-task.kol-prepare.availability.available')
    : reasonCodeText(row.reason_code);
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
    message.warning(
      $t('page.bd.my-task.kol-prepare.messages.input-valid-kol-id'),
    );
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
    duplicateCount > 0
      ? $t('page.bd.my-task.kol-prepare.messages.duplicate-refreshed', [
          duplicateCount,
        ])
      : '';

  message.success(
    $t('page.bd.my-task.kol-prepare.messages.validation-success', [
      validatedRows.length,
      appendedCount,
      updatedCount,
      duplicateMessage,
    ]),
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
      message.warning(
        $t('page.bd.my-task.kol-prepare.messages.no-valid-kol-id-in-excel'),
      );
      return;
    }
    uploadGridApi.setLoading(true);
    await appendValidatedRows(rows);
  } catch (error: any) {
    message.error(
      error?.message || $t('page.bd.my-task.kol-prepare.messages.parse-failed'),
    );
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
          reject(
            new Error($t('page.bd.my-task.kol-prepare.messages.file-empty')),
          );
          return;
        }

        const header = rows[0]!.map((h) => String(h ?? '').trim());
        const kolIdIndex = header.indexOf('kol_id');
        const kolLinkIndex = header.indexOf('kol_link');
        if (kolIdIndex === -1) {
          reject(
            new Error(
              $t('page.bd.my-task.kol-prepare.messages.missing-kol-id-column'),
            ),
          );
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
    message.warning($t('page.bd.my-task.kol-prepare.messages.input-kol-id'));
    return;
  }
  if (!kolLink) {
    message.warning($t('page.bd.my-task.kol-prepare.messages.input-kol-link'));
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
    message.error(
      error?.message || $t('page.bd.my-task.kol-prepare.messages.save-failed'),
    );
  } finally {
    editorSubmitting.value = false;
  }
}

async function handleSubmit() {
  if (previewData.value.length === 0) {
    message.warning(
      $t('page.bd.my-task.kol-prepare.messages.no-submittable-data'),
    );
    return;
  }
  if (hasNonNormal.value) {
    message.warning(
      $t('page.bd.my-task.kol-prepare.messages.has-invalid-data'),
    );
    return;
  }

  const missingLinkRow = previewData.value.find(
    (row) => !normalizeKolLink(row.kol_link),
  );
  if (missingLinkRow) {
    message.warning(
      $t('page.bd.my-task.kol-prepare.messages.missing-kol-link', [
        missingLinkRow.kol_id,
      ]),
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
    message.success(
      $t('page.bd.my-task.kol-prepare.messages.submit-success', [
        previewData.value.length,
      ]),
    );
    clearPreviewData();
    activeTab.value = 'records';
    recordGridApi.reload();
  } catch (error: any) {
    message.error(
      error?.message ||
        $t('page.bd.my-task.kol-prepare.messages.submit-failed'),
    );
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
  { type: 'seq', width: 60, title: ' ' },
  {
    field: 'kol_id',
    title: $t('page.bd.my-task.kol-prepare.columns.kol-id'),
    width: 180,
  },
  {
    field: 'kol_link',
    minWidth: 220,
    slots: { default: 'kol_link' },
    title: $t('page.bd.my-task.kol-prepare.columns.kol-link'),
  },
  {
    field: 'reason_msg',
    minWidth: 160,
    slots: { default: 'reason' },
    title: $t('page.bd.my-task.kol-prepare.columns.reason'),
  },
  {
    field: 'detail',
    minWidth: 320,
    slots: { default: 'detail' },
    title: $t('page.bd.my-task.kol-prepare.columns.detail'),
  },
  {
    field: 'kol_status',
    slots: { default: 'kol_status' },
    title: $t('page.bd.my-task.kol-prepare.columns.kol-status'),
    width: 120,
  },
  {
    field: 'prepare_status',
    slots: { default: 'prepare_status' },
    title: $t('page.bd.my-task.kol-prepare.columns.prepare-status'),
    width: 120,
  },
  {
    field: 'belong_bd_code',
    slots: { default: 'belong_bd_code' },
    title: $t('page.bd.my-task.kol-prepare.columns.belong-bd-code'),
    width: 120,
  },
  {
    field: 'prepared_bd_code',
    slots: { default: 'prepared_bd_code' },
    title: $t('page.bd.my-task.kol-prepare.columns.prepared-bd-code'),
    width: 120,
  },
  {
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: $t('page.bd.my-task.kol-prepare.columns.entry-time'),
    width: 180,
  },
  {
    field: 'action',
    slots: { default: 'action' },
    title: $t('page.bd.my-task.kol-prepare.columns.action'),
    width: 150,
  },
];

const recordColumns: VxeGridProps<BdTaskApi.PrepareDataRow>['columns'] = [
  // 序号
  { type: 'seq', width: 60, title: ' ' },
  {
    field: 'kol_id',
    title: $t('page.bd.my-task.kol-prepare.columns.kol-id'),
    width: 180,
  },
  {
    field: 'kol_link',
    minWidth: 220,
    slots: { default: 'kol_link' },
    title: $t('page.bd.my-task.kol-prepare.columns.kol-link'),
  },
  {
    field: 'entry_time',
    formatter: 'formatDateTime',
    title: $t('page.bd.my-task.kol-prepare.columns.entry-time'),
    width: 180,
  },
  {
    field: 'status',
    slots: { default: 'status' },
    title: $t('page.bd.my-task.kol-prepare.columns.record-status'),
    width: 150,
  },
  {
    field: 'reviewer_name',
    title: $t('page.bd.my-task.kol-prepare.columns.reviewer-name'),
    width: 140,
  },
  {
    field: 'audit_time',
    formatter: 'formatDateTime',
    title: $t('page.bd.my-task.kol-prepare.columns.audit-time'),
    width: 180,
  },
  {
    field: 'reason',
    minWidth: 180,
    title: $t('page.bd.my-task.kol-prepare.columns.audit-reason'),
  },
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
              {{ $t('page.bd.my-task.title') }}
            </router-link>
            <span class="mx-2 text-slate-300">/</span>
            <span>{{
              $t('page.bd.my-task.kol-prepare.breadcrumb-current')
            }}</span>
          </div>
          <h1 class="text-xl font-semibold text-slate-900">
            {{ $t('page.bd.my-task.kol-prepare.page-title', [taskRelationId]) }}
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {{ $t('page.bd.my-task.kol-prepare.page-description') }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 lg:min-w-[360px] lg:grid-cols-2">
          <div class="rounded-xl bg-slate-50 px-4 py-3">
            <div class="text-xs text-slate-500">
              {{
                hasActiveFilters
                  ? $t('page.bd.my-task.kol-prepare.summary.filtered')
                  : $t('page.bd.my-task.kol-prepare.summary.current')
              }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-slate-900">
              {{ summary.total }}
            </div>
            <div v-if="hasActiveFilters" class="mt-1 text-xs text-slate-400">
              {{
                $t('page.bd.my-task.kol-prepare.summary.all-count', [
                  previewData.length,
                ])
              }}
            </div>
          </div>
          <div class="rounded-xl bg-emerald-50 px-4 py-3">
            <div class="text-xs text-emerald-700">
              {{ $t('page.bd.my-task.kol-prepare.summary.available') }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-emerald-700">
              {{ summary.valid }}
            </div>
          </div>
          <div v-if="false" class="rounded-xl bg-amber-50 px-4 py-3">
            <div class="text-xs text-amber-700">
              {{ $t('page.bd.my-task.kol-prepare.summary.pending') }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-amber-700">
              {{ summary.invalid }}
            </div>
          </div>
          <div v-if="false" class="rounded-xl bg-sky-50 px-4 py-3">
            <div class="text-xs text-sky-700">
              {{ $t('page.bd.my-task.kol-prepare.summary.retryable') }}
            </div>
            <div class="mt-1 text-2xl font-semibold text-sky-700">
              {{ summary.retryable }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane
        key="upload"
        :tab="$t('page.bd.my-task.kol-prepare.tabs.upload')"
      >
        <Card :bordered="false" class="rounded-2xl shadow-sm">
          <div
            class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h3 class="text-base font-semibold text-slate-500">
                {{ $t('page.bd.my-task.kol-prepare.upload-card-title') }}
              </h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ $t('page.bd.my-task.kol-prepare.upload-card-description') }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button @click="downloadTemplate">
                {{
                  $t('page.bd.my-task.kol-prepare.actions.download-template')
                }}
              </Button>
              <Button type="primary" @click="triggerUpload">
                {{ $t('page.bd.my-task.kol-prepare.actions.upload-excel') }}
              </Button>
              <Button @click="openCreateEditor">
                {{ $t('page.bd.my-task.kol-prepare.actions.add-row') }}
              </Button>
              <Button
                v-if="previewData.length > 0"
                danger
                ghost
                @click="clearPreviewData"
              >
                {{ $t('page.bd.my-task.kol-prepare.actions.clear-list') }}
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
            :message="$t('page.bd.my-task.kol-prepare.invalid-alert-title')"
            :description="
              $t('page.bd.my-task.kol-prepare.invalid-alert-description')
            "
          />

          <Card :bordered="false" class="rounded-2xl shadow-sm">
            <div
              class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 class="text-base font-semibold text-blue-900">
                  {{ $t('page.bd.my-task.kol-prepare.result-title') }}
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                  {{
                    $t('page.bd.my-task.kol-prepare.result-description', [
                      summary.total,
                      summary.valid,
                      summary.invalid,
                    ])
                  }}
                  <template v-if="hasActiveFilters">
                    {{
                      $t('page.bd.my-task.kol-prepare.result-filtered-tip', [
                        previewData.length,
                      ])
                    }}
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
                  {{ $t('page.bd.my-task.kol-prepare.actions.reset-filters') }}
                </Button>
                <Button
                  type="primary"
                  :loading="submitting"
                  :disabled="!canSubmit"
                  @click="handleSubmit"
                >
                  {{ $t('page.bd.my-task.kol-prepare.actions.submit') }}
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
              <template #belong_bd_code="{ row }">
                <div class="leading-6 text-slate-600">
                  {{ row.belong_bd_code || '-' }}
                </div>
              </template>
              <template #prepared_bd_code="{ row }">
                <div class="leading-6 text-slate-600">
                  {{ row.prepared_bd_code || '-' }}
                </div>
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
                  {{ $t('page.bd.my-task.kol-prepare.actions.edit') }}
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="removePrepareRow(row.kol_id)"
                >
                  {{ $t('page.bd.my-task.kol-prepare.actions.delete') }}
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
            {{ $t('page.bd.my-task.kol-prepare.empty-title') }}
          </div>
          <div class="mt-2 text-sm text-slate-500">
            {{ $t('page.bd.my-task.kol-prepare.empty-description') }}
          </div>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane
        key="records"
        :tab="$t('page.bd.my-task.kol-prepare.tabs.records')"
      >
        <Card :bordered="false" class="rounded-2xl shadow-sm">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-slate-900">
                {{ $t('page.bd.my-task.kol-prepare.records-title') }}
              </h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ $t('page.bd.my-task.kol-prepare.records-description') }}
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
                {{ $t('page.bd.my-task.kol-prepare.actions.reset-filters') }}
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
      :ok-text="$t('page.bd.my-task.kol-prepare.editor.confirm')"
      :cancel-text="$t('page.bd.my-task.kol-prepare.editor.cancel')"
      @cancel="closeEditor"
      @ok="handleEditorSubmit"
    >
      <div class="space-y-4 pt-2">
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">
            {{ $t('page.bd.my-task.kol-prepare.editor.kol-id-label') }}
          </div>
          <Input
            v-model:value="editorForm.kol_id"
            :placeholder="
              $t('page.bd.my-task.kol-prepare.editor.kol-id-placeholder')
            "
            :maxlength="100"
          />
        </div>
        <div>
          <div class="mb-2 text-sm font-medium text-slate-700">
            {{ $t('page.bd.my-task.kol-prepare.editor.kol-link-label') }}
          </div>
          <Input
            v-model:value="editorForm.kol_link"
            :placeholder="
              $t('page.bd.my-task.kol-prepare.editor.kol-link-placeholder')
            "
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>
