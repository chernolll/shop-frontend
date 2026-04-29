<script lang="ts" setup>
import type { BdTaskApi } from '#/api';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBdTaskList } from '#/api';

import { useColumns } from './data';

const router = useRouter();

// TODO: 替换为真实 API 调用 - getMyTaskList()
async function fetchMyTaskList({
  page,
}: {
  page: { currentPage: number; pageSize: number };
}) {
  // const mockData: MyTaskItem[] = [
  //   {
  //     briefUrl: 'https://docs.example.com/brief/skincare.pdf',
  //     commission: 15,
  //     completedVideos: 2,
  //     deadline: Date.parse('2025-06-30'),
  //     hasBudget: 1,
  //     productUrl:
  //       'https://www.tiktok.com/@beauty_guru_th/video/123456',
  //     relationId: 1,
  //     taskId: 1,
  //     totalVideos: 3,
  //   },
  //   {
  //     briefUrl: 'https://docs.example.com/brief/phonecase.pdf',
  //     commission: 12,
  //     completedVideos: 0,
  //     deadline: Date.parse('2025-05-15'),
  //     hasBudget: 0,
  //     productUrl:
  //       'https://www.tiktok.com/@tech_review_th/video/789012',
  //     relationId: 2,
  //     taskId: 2,
  //     totalVideos: 2,
  //   },
  //   {
  //     briefUrl: 'https://docs.example.com/brief/powerbank.pdf',
  //     commission: 18,
  //     completedVideos: 1,
  //     deadline: Date.parse('2025-08-20'),
  //     hasBudget: 1,
  //     productUrl:
  //       'https://www.tiktok.com/@mom_life_th/video/345678',
  //     relationId: 3,
  //     taskId: 3,
  //     totalVideos: 1,
  //   },
  // ];
  let result: BdTaskApi.BdTasListResult = { total: 0, list: [] };
  try {
    const { currentPage, pageSize } = page;
    result = await getBdTaskList({ page: currentPage, pageSize });
  } catch {}
  // 模拟分页

  return {
    items: result.list,
    total: result.total,
  };
}

const [Grid] = useVbenVxeGrid<BdTaskApi.BDTaskRow>({
  gridOptions: {
    columns: useColumns(),
    proxyConfig: {
      ajax: {
        query: async ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          return await fetchMyTaskList({ page });
        },
      },
    },
    rowConfig: { keyField: 'relationId' },
    toolbarConfig: { refresh: true, zoom: true },
  },
});

function goPrepare(row: BdTaskApi.BDTaskRow) {
  router.push(`/bd/my-task/${row.relationId}`);
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="我的任务">
      <template #productUrl="{ row }">
        <a
          :href="row.productUrl"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.productUrl }}
        </a>
      </template>
      <template #briefUrl="{ row }">
        <a
          :href="row.briefUrl"
          target="_blank"
          class="text-blue-500 hover:underline"
        >
          {{ row.briefUrl }}
        </a>
      </template>
      <template #videoProgress="{ row }">
        {{ row.totalVideos }}
      </template>
      <template #hasBudget="{ row }">
        <Tag :color="row.hasBudget ? 'green' : 'default'">
          {{ row.hasBudget ? '有' : '无' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="link" @click="goPrepare(row)"> 上传达人筹备表 </Button>
      </template>
    </Grid>
  </Page>
</template>
