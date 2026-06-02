<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdKolListApi } from '#/api/bd/kol';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Drawer,
  Input,
  message,
  Modal,
  Space,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';
import * as XLSX from 'xlsx';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKolCandidate,
  deleteKolCandidate,
  getBdKolList,
} from '#/api/bd/kol';
import { $t } from '#/locales';

const deletingId = ref(0);
const createDrawerOpen = ref(false);
const activeTab = ref('manual');

// --- Manual single entry ---
const manualSubmitting = ref(false);
const manualKolId = ref('');
const manualKolLink = ref('');

// --- Excel import ---
const excelSubmitting = ref(false);
const excelRows = ref<{ kol_id: string; kol_link: string }[]>([]);
const excelParsedCount = computed(() => excelRows.value.length);

// --- Batch paste ---
const batchText = ref('');
const batchSubmitting = ref(false);
const parsedBatchRows = computed(() => {
  return batchText.value
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      // Support "kol_id, kol_link" or just "kol_id"
      const parts = trimmed.split(',').map((s) => s.trim());
      return { kol_id: parts[0], kol_link: parts[1] || '' };
    })
    .filter(
      (r): r is { kol_id: string; kol_link: string } =>
        r !== null && !!r.kol_id,
    );
});
const batchParsedCount = computed(() => parsedBatchRows.value.length);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function formatFollowers(value?: null | number) {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

function isDeleting(row: BdKolListApi.ListItem) {
  return deletingId.value === row.id;
}

function confirmDelete(row: BdKolListApi.ListItem) {
  Modal.confirm({
    okText: $t('common.confirm'),
    title: $t('page.bd.kols.delete.confirm-title'),
    content: $t('page.bd.kols.delete.confirm-content', [row.kol_id]),
    async onOk() {
      try {
        deletingId.value = row.id;
        await deleteKolCandidate({ id: row.id });
        message.success($t('page.bd.kols.messages.delete-success'));
        await gridApi.query();
      } finally {
        deletingId.value = 0;
      }
    },
  });
}

function openCreateDrawer() {
  activeTab.value = 'manual';
  resetManualForm();
  resetExcel();
  resetBatch();
  createDrawerOpen.value = true;
}

// --- Manual ---
function resetManualForm() {
  manualKolId.value = '';
  manualKolLink.value = '';
}

async function submitManual() {
  const kolId = manualKolId.value.trim();
  if (!kolId) {
    message.warning($t('page.bd.kols.messages.kol-id-required'));
    return;
  }

  manualSubmitting.value = true;
  try {
    const results = await createKolCandidate({
      items: [{ kol_id: kolId, kol_link: manualKolLink.value.trim() }],
    });

    if (results && results.length > 0) {
      const r = results[0];
      if (r?.is_duplicate) {
        message.info($t('page.bd.kols.messages.create-duplicate', [r.kol_id]));
      } else {
        message.success(
          $t('page.bd.kols.messages.create-success', [r?.kol_id ?? kolId]),
        );
      }
    } else {
      message.success($t('page.bd.kols.messages.create-success', [kolId]));
    }

    createDrawerOpen.value = false;
    await gridApi.query();
  } finally {
    manualSubmitting.value = false;
  }
}

// --- Excel ---
function resetExcel() {
  excelRows.value = [];
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['kol_id', 'kol_link'],
    ['example_kol_001', 'https://www.example.com/example_kol_001'],
  ]);
  ws['!cols'] = [{ wch: 24 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'bd-prepare-template.xlsx');
}

async function handleExcelFile(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0] as string];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws as string[][], {
    header: 1,
  });
  if (rows.length <= 1) {
    throw new Error($t('page.bd.kols.messages.file-empty'));
  }

  const header = (rows[0] as string[]).map((h) => String(h ?? '').trim());
  const kolIdIndex = header.indexOf('kol_id');
  const kolLinkIndex = header.indexOf('kol_link');
  if (kolIdIndex === -1) {
    throw new Error($t('page.bd.kols.messages.missing-kol-id-column'));
  }

  const parsed = rows
    .slice(1)
    .map((row) => {
      const kolId = String(row[kolIdIndex] ?? '').trim();
      const kolLink =
        kolLinkIndex === -1 ? '' : String(row[kolLinkIndex] ?? '').trim();
      return { kol_id: kolId, kol_link: kolLink };
    })
    .filter((row) => row.kol_id);

  if (parsed.length === 0) {
    throw new Error($t('page.bd.kols.messages.no-valid-kol-id-in-excel'));
  }

  excelRows.value = parsed;
}

async function submitExcel() {
  if (excelRows.value.length === 0) {
    message.warning($t('page.bd.kols.messages.no-data-to-import'));
    return;
  }

  excelSubmitting.value = true;
  try {
    const results = await createKolCandidate({
      items: excelRows.value,
    });

    const duplicateCount = results.filter((r) => r.is_duplicate).length;
    const successCount = results.length - duplicateCount;
    message.success(
      $t('page.bd.kols.messages.import-result', [
        String(successCount),
        String(duplicateCount),
      ]),
    );

    createDrawerOpen.value = false;
    await gridApi.query();
  } catch (error: any) {
    message.error(error?.message || $t('page.bd.kols.messages.import-failed'));
  } finally {
    excelSubmitting.value = false;
  }
}

// --- Batch ---
function resetBatch() {
  batchText.value = '';
}

async function submitBatch() {
  const items = parsedBatchRows.value;
  if (items.length === 0) {
    message.warning($t('page.bd.kols.messages.no-data-to-import'));
    return;
  }

  batchSubmitting.value = true;
  try {
    const results = await createKolCandidate({ items });

    const duplicateCount = results.filter((r) => r.is_duplicate).length;
    const successCount = results.length - duplicateCount;
    message.success(
      $t('page.bd.kols.messages.import-result', [
        String(successCount),
        String(duplicateCount),
      ]),
    );

    createDrawerOpen.value = false;
    await gridApi.query();
  } catch (error: any) {
    message.error(error?.message || $t('page.bd.kols.messages.import-failed'));
  } finally {
    batchSubmitting.value = false;
  }
}

// --- Form & Grid ---
const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'kol_id',
      label: $t('page.bd.kols.filters.kol-id'),
    },
    {
      component: 'Input',
      fieldName: 'prepared_bd_code',
      label: $t('page.bd.kols.filters.prepared-bd-code'),
    },
  ],
  submitOnChange: false,
  submitOnEnter: false,
};

function getKolStatusText(status?: null | number) {
  switch (status) {
    case 1: {
      return $t('page.bd.kols.status.normal');
    }
    case 2: {
      return $t('page.bd.kols.status.lost');
    }
    case 3: {
      return $t('page.bd.kols.status.blacklist');
    }
    default: {
      return $t('page.bd.kols.status.unrecorded');
    }
  }
}

function getKolStatusColor(status?: null | number) {
  switch (status) {
    case 1: {
      return 'success';
    }
    case 2: {
      return 'warning';
    }
    case 3: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

const gridOptions: VxeTableGridOptions<BdKolListApi.ListItem> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'kol_id',
      minWidth: 140,
      title: $t('page.bd.kols.columns.kol-id'),
    },
    {
      field: 'kol_link',
      minWidth: 200,
      slots: { default: 'kol_link' },
      title: $t('page.bd.kols.columns.kol-link'),
    },
    {
      field: 'is_duplicate',
      minWidth: 100,
      slots: { default: 'is_duplicate' },
      title: $t('page.bd.kols.columns.is-duplicate'),
    },
    {
      field: 'prepared_bd_code',
      minWidth: 140,
      title: $t('page.bd.kols.columns.prepared-bd'),
    },
    {
      field: 'has_belong_bd',
      minWidth: 120,
      slots: { default: 'has_belong_bd' },
      title: $t('page.bd.kols.columns.has-belong-bd'),
    },
    {
      field: 'kol_followers',
      minWidth: 120,
      slots: { default: 'kol_followers' },
      title: $t('page.bd.kols.columns.followers'),
    },
    {
      field: 'kol_status',
      minWidth: 110,
      slots: { default: 'kol_status' },
      title: $t('page.bd.kols.columns.status'),
    },
    {
      field: 'entry_time',
      minWidth: 170,
      slots: { default: 'entry_time' },
      title: $t('page.bd.kols.columns.entry-time'),
    },
    {
      field: 'created_at',
      minWidth: 170,
      slots: { default: 'created_at' },
      title: $t('page.bd.kols.columns.created-at'),
    },
    {
      field: 'operation',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'operation' },
      title: $t('page.bd.kols.columns.operation'),
    },
  ],
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const result = await getBdKolList({
          kol_id: formValues.kol_id?.trim() || undefined,
          prepared_bd_code: formValues.prepared_bd_code?.trim() || undefined,
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
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div>
        <div class="text-lg font-semibold text-foreground">
          {{ $t('page.bd.kols.title') }}
        </div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ $t('page.bd.kols.description') }}
        </div>
      </div>
    </Card>

    <Grid :table-title="$t('page.bd.kols.list-title')">
      <template #toolbar-tools>
        <Button type="primary" @click="openCreateDrawer">
          {{ $t('page.bd.kols.actions.create') }}
        </Button>
      </template>

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
        <span v-else>-</span>
      </template>

      <template #is_duplicate="{ row }">
        <Tag v-if="row.is_duplicate" color="warning">
          {{ $t('page.bd.kols.is-duplicate.yes') }}
        </Tag>
        <Tag v-else color="default">
          {{ $t('page.bd.kols.is-duplicate.no') }}
        </Tag>
      </template>

      <template #has_belong_bd="{ row }">
        <Tag v-if="row.has_belong_bd" color="blue">
          {{ $t('page.bd.kols.has-belong-bd.yes') }}
        </Tag>
        <span v-else>-</span>
      </template>

      <template #kol_followers="{ row }">
        <span>{{ formatFollowers(row.kol_followers) }}</span>
      </template>

      <template #kol_status="{ row }">
        <Tag :color="getKolStatusColor(row.kol_status)">
          {{ getKolStatusText(row.kol_status) }}
        </Tag>
      </template>

      <template #entry_time="{ row }">
        <span>{{ formatTimestamp(row.entry_time) }}</span>
      </template>

      <template #created_at="{ row }">
        <span>{{ formatTimestamp(row.created_at) }}</span>
      </template>

      <template #operation="{ row }">
        <Space size="small">
          <Button
            danger
            type="link"
            size="small"
            :loading="isDeleting(row)"
            @click="confirmDelete(row)"
          >
            {{ $t('page.bd.kols.actions.delete') }}
          </Button>
        </Space>
      </template>
    </Grid>

    <!-- 新增候选达人 Drawer (多方式上传) -->
    <Drawer
      :open="createDrawerOpen"
      :title="$t('page.bd.kols.create.title')"
      :width="640"
      @close="createDrawerOpen = false"
    >
      <Tabs v-model:active-key="activeTab">
        <!-- Tab 1: 手动输入 -->
        <Tabs.TabPane key="manual" :tab="$t('page.bd.kols.create.tabs.manual')">
          <div class="space-y-4 pt-2">
            <div>
              <div class="mb-1 text-sm font-medium">
                {{ $t('page.bd.kols.columns.kol-id') }}
                <span class="text-red-500">*</span>
              </div>
              <Input
                v-model:value="manualKolId"
                :placeholder="$t('page.bd.kols.create.kol-id-placeholder')"
              />
            </div>
            <div>
              <div class="mb-1 text-sm font-medium">
                {{ $t('page.bd.kols.columns.kol-link') }}
              </div>
              <Input
                v-model:value="manualKolLink"
                :placeholder="$t('page.bd.kols.create.kol-link-placeholder')"
              />
            </div>
            <div class="pt-2">
              <Button
                type="primary"
                :loading="manualSubmitting"
                @click="submitManual"
              >
                {{ $t('page.bd.kols.actions.create') }}
              </Button>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 2: Excel 导入 -->
        <Tabs.TabPane key="excel" :tab="$t('page.bd.kols.create.tabs.excel')">
          <div class="space-y-4 pt-2">
            <div class="flex flex-wrap gap-2">
              <Button @click="downloadTemplate">
                {{ $t('page.bd.kols.create.excel.download-template') }}
              </Button>
              <Upload
                accept=".xlsx,.xls"
                :before-upload="
                  (file: File) => {
                    handleExcelFile(file)
                      .then(() => {
                        message.success(
                          $t('page.bd.kols.messages.file-parsed', [
                            String(excelParsedCount),
                          ]),
                        );
                      })
                      .catch((err: Error) => {
                        message.error(err.message);
                      });
                    return false;
                  }
                "
                :show-upload-list="false"
              >
                <Button type="primary">
                  {{ $t('page.bd.kols.create.excel.upload') }}
                </Button>
              </Upload>
            </div>

            <div v-if="excelRows.length > 0">
              <div class="mb-2 text-sm text-muted-foreground">
                {{
                  $t('page.bd.kols.create.excel.preview', [
                    String(excelParsedCount),
                  ])
                }}
              </div>
              <div
                class="max-h-64 overflow-y-auto rounded-lg border border-border"
              >
                <table class="w-full text-sm">
                  <thead class="bg-muted/50 sticky top-0">
                    <tr class="border-b border-border">
                      <th class="px-3 py-2 text-left font-medium">#</th>
                      <th class="px-3 py-2 text-left font-medium">
                        {{ $t('page.bd.kols.columns.kol-id') }}
                      </th>
                      <th class="px-3 py-2 text-left font-medium">
                        {{ $t('page.bd.kols.columns.kol-link') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, idx) in excelRows"
                      :key="idx"
                      class="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td class="px-3 py-1.5 text-muted-foreground">
                        {{ idx + 1 }}
                      </td>
                      <td class="px-3 py-1.5">{{ row.kol_id }}</td>
                      <td class="px-3 py-1.5 max-w-52 truncate">
                        {{ row.kol_link || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="pt-3">
                <Button
                  type="primary"
                  :loading="excelSubmitting"
                  @click="submitExcel"
                >
                  {{ $t('page.bd.kols.create.excel.import') }}
                </Button>
              </div>
            </div>

            <div v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ $t('page.bd.kols.create.excel.no-data') }}
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 3: 批量粘贴 -->
        <Tabs.TabPane key="batch" :tab="$t('page.bd.kols.create.tabs.batch')">
          <div class="space-y-4 pt-2">
            <div>
              <div class="mb-1 text-sm font-medium">
                {{ $t('page.bd.kols.create.batch.label') }}
              </div>
              <Input.TextArea
                v-model:value="batchText"
                :auto-size="{ minRows: 6, maxRows: 14 }"
                :placeholder="$t('page.bd.kols.create.batch.placeholder')"
              />
            </div>

            <div
              v-if="batchParsedCount > 0"
              class="text-sm text-muted-foreground"
            >
              {{
                $t('page.bd.kols.create.batch.parsed', [
                  String(batchParsedCount),
                ])
              }}
            </div>

            <div class="pt-2">
              <Button
                type="primary"
                :loading="batchSubmitting"
                :disabled="batchParsedCount === 0"
                @click="submitBatch"
              >
                {{ $t('page.bd.kols.create.batch.submit') }}
              </Button>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  </Page>
</template>
