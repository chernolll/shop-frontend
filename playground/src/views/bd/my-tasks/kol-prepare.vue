<script lang="ts" setup>
import type { VxeGridProps } from 'vxe-table';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, message, Tabs, Tag } from 'ant-design-vue';
import * as XLSX from 'xlsx';

import { KoaPrepareAuditStatus, KoaPrepareKolStatus } from '#/consts/bd-sop';

const route = useRoute();
const taskId = Number(route.params.task_id);

// ---------- 达人状态显示工具 ----------
function kolStatusText(status: KoaPrepareKolStatus | null): string {
  if (status === null) return '校验中...';
  const map: Record<number, string> = {
    [KoaPrepareKolStatus.HAS_BD]: '已有所属BD',
    [KoaPrepareKolStatus.NORMAL]: '正常',
    [KoaPrepareKolStatus.PREPARED]: '已被筹备',
    [KoaPrepareKolStatus.TASK_REPEAT]: '重复',
  };
  return map[status] ?? String(status);
}

function kolStatusColor(status: KoaPrepareKolStatus | null): string {
  if (status === null) return 'processing';
  const map: Record<number, string> = {
    [KoaPrepareKolStatus.HAS_BD]: 'red',
    [KoaPrepareKolStatus.NORMAL]: 'green',
    [KoaPrepareKolStatus.PREPARED]: 'red',
    [KoaPrepareKolStatus.TASK_REPEAT]: 'orange',
  };
  return map[status] ?? 'default';
}

function auditStatusText(status: KoaPrepareAuditStatus): string {
  const map: Record<number, string> = {
    [KoaPrepareAuditStatus.PASS]: '已通过',
    [KoaPrepareAuditStatus.PENDING]: '审核中',
    [KoaPrepareAuditStatus.REJECT]: '不通过',
  };
  return map[status] ?? String(status);
}

function auditStatusColor(status: KoaPrepareAuditStatus): string {
  const map: Record<number, string> = {
    [KoaPrepareAuditStatus.PASS]: 'green',
    [KoaPrepareAuditStatus.PENDING]: 'processing',
    [KoaPrepareAuditStatus.REJECT]: 'red',
  };
  return map[status] ?? 'default';
}

// ---------- 上传筹备 tab ----------
interface PrepareRow {
  entryTime: string;
  kolId: string;
  status: KoaPrepareKolStatus | null;
  taskId: number;
}

const activeTab = ref('upload');
const previewData = ref<PrepareRow[]>([]);
const parsedKolIds = ref<string[]>([]);
const validating = ref(false);
const submitting = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const hasNonNormal = computed(() =>
  previewData.value.some((row) => row.status !== KoaPrepareKolStatus.NORMAL),
);

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

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const kolIds = await parseExcelFile(file);
    if (kolIds.length === 0) {
      message.warning('未在 Excel 中检测到有效的达人ID数据');
      return;
    }
    parsedKolIds.value = kolIds;
  } catch (error: any) {
    message.error(error?.message || 'Excel 文件解析失败，请检查文件格式');
  } finally {
    input.value = '';
  }
}

function parseExcelFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
        if (rows.length === 0) {
          reject(new Error('文件为空'));
          return;
        }
        // 检测 kol_id 列位置
        const header = rows[0].map((h) => String(h ?? '').trim());
        const kolIdIndex = header.indexOf('kol_id');
        if (kolIdIndex === -1) {
          reject(new Error('未检测到 kol_id 列'));
          return;
        }
        // 从 kol_id 列收集数据
        const kolIds = rows
          .slice(1)
          .map((row) => String(row[kolIdIndex] ?? '').trim())
          .filter(Boolean);
        resolve(kolIds);
      } catch (error) {
        reject(error);
      }
    });
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// TODO: 替换为真实 API 调用 - POST /bd/my-task/prepare/validate-kols
async function validateKolStatus() {
  if (previewData.value.length === 0) return;

  validating.value = true;
  try {
    // mock 接口延迟
    await new Promise((r) => setTimeout(r, 500));
    // mock: 按序号模拟不同状态，方便测试各状态展示
    previewData.value = previewData.value.map((row, i) => ({
      ...row,
      status:
        i % 4 === 0
          ? KoaPrepareKolStatus.TASK_REPEAT
          : i % 4 === 1
            ? KoaPrepareKolStatus.HAS_BD
            : i % 4 === 2
              ? KoaPrepareKolStatus.PREPARED
              : KoaPrepareKolStatus.NORMAL,
    }));
  } finally {
    validating.value = false;
  }
}

function removeRow(index: number) {
  previewData.value.splice(index, 1);
}

// TODO: 替换为真实 API 调用 - POST /bd/my-task/prepare/submit
async function handleSubmit() {
  if (hasNonNormal.value) {
    message.warning('存在状态异常的达人数据，请先删除后再提交');
    return;
  }

  submitting.value = true;
  try {
    // mock 接口延迟
    await new Promise((r) => setTimeout(r, 500));
    message.success(`成功提交 ${previewData.value.length} 条达人筹备记录`);
    previewData.value = [];
    // 刷新提交记录
    await fetchRecords();
  } catch {
    message.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
}

// ---------- 提交记录 tab ----------
interface PrepareRecord {
  auditStatus: KoaPrepareAuditStatus;
  entryTime: string;
  id: number;
  kolId: string;
  remark: string;
  status: KoaPrepareKolStatus;
  taskId: number;
}

const records = ref<PrepareRecord[]>([]);
const recordsLoading = ref(false);

// TODO: 替换为真实 API 调用 - GET /bd/my-task/prepare/records?taskId=xxx
async function fetchRecords() {
  recordsLoading.value = true;
  try {
    // mock 接口延迟
    await new Promise((r) => setTimeout(r, 300));
    records.value = [
      {
        auditStatus: KoaPrepareAuditStatus.PASS,
        entryTime: '2024-10-02 10:00:00',
        id: 1,
        kolId: 'KOL_TT_001',
        remark: '审核通过',
        status: KoaPrepareKolStatus.NORMAL,
        taskId,
      },
      {
        auditStatus: KoaPrepareAuditStatus.PENDING,
        entryTime: '2024-10-02 11:00:00',
        id: 2,
        kolId: 'KOL_TT_002',
        remark: '',
        status: KoaPrepareKolStatus.NORMAL,
        taskId,
      },
      {
        auditStatus: KoaPrepareAuditStatus.REJECT,
        entryTime: '2024-10-03 09:00:00',
        id: 3,
        kolId: 'KOL_TT_005',
        remark: '该达人已被其他任务筹备',
        status: KoaPrepareKolStatus.PREPARED,
        taskId,
      },
    ];
  } finally {
    recordsLoading.value = false;
  }
}

watch(activeTab, (tab) => {
  if (tab === 'records') {
    fetchRecords();
  }
});

// ---------- 表格列定义 ----------
const previewColumns: VxeGridProps['columns'] = [
  { field: 'taskId', title: '所属任务ID', width: 130 },
  { field: 'kolId', title: '达人ID', width: 180 },
  { field: 'entryTime', title: '录入时间', width: 200 },
  { field: 'status', slots: { default: 'status' }, title: '状态', width: 150 },
  {
    field: 'action',
    slots: { default: 'action' },
    title: '操作',
    width: 100,
  },
];

const recordColumns: VxeGridProps['columns'] = [
  { field: 'taskId', title: '所属任务ID', width: 120 },
  { field: 'kolId', title: '达人ID', width: 180 },
  { field: 'entryTime', title: '录入时间', width: 200 },
  {
    field: 'status',
    slots: { default: 'status' },
    title: '达人状态',
    width: 150,
  },
  {
    field: 'auditStatus',
    slots: { default: 'auditStatus' },
    title: '审核状态',
    width: 120,
  },
  { field: 'remark', minWidth: 150, title: '审核意见' },
];
</script>

<template>
  <Page auto-content-height>
    <div
      class="mb-4 flex items-center rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
    >
      <router-link
        to="/bd/my-tasks"
        class="text-sm text-gray-400 transition-colors hover:text-blue-500"
      >
        &larr; 我的任务
      </router-link>
      <span class="mx-3 text-gray-300">/</span>
      <span class="font-semibold text-gray-700"> 视频链接 #{{ taskId }} </span>
      <span class="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-500">
        达人筹备
      </span>
    </div>

    <Tabs v-model:active-key="activeTab">
      <Tabs.TabPane key="upload" tab="上传筹备">
        <!-- 操作按钮行 -->
        <div class="mb-4 flex gap-2">
          <Button @click="downloadTemplate">下载模板</Button>
          <Button type="primary" @click="triggerUpload">上传 Excel</Button>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none"
          @change="handleFileChange"
        />

        <!-- 解析结果占位 -->
        <div
          v-if="parsedKolIds.length > 0"
          class="rounded-lg border border-gray-100 bg-white px-5 py-10 text-center"
        >
          <p class="text-lg text-gray-800">
            已解析
            <span class="font-semibold text-blue-500">{{
              parsedKolIds.length
            }}</span>
            条达人ID
          </p>
          <p class="mt-2 text-sm text-gray-400">校验与提交功能待接入</p>
        </div>

        <!-- 空状态 -->
        <div
          v-if="parsedKolIds.length === 0"
          class="py-12 text-center text-gray-400"
        >
          请下载模板，填写达人ID后上传 Excel 文件
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="records" tab="提交记录">
        <vxe-grid
          :data="records"
          :columns="recordColumns"
          :loading="recordsLoading"
          border
          size="small"
          min-height="120"
          show-overflow
        >
          <template #status="{ row }">
            <Tag :color="kolStatusColor(row.status)">
              {{ kolStatusText(row.status) }}
            </Tag>
          </template>
          <template #auditStatus="{ row }">
            <Tag :color="auditStatusColor(row.auditStatus)">
              {{ auditStatusText(row.auditStatus) }}
            </Tag>
          </template>
        </vxe-grid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
