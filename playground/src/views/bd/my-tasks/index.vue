<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BdTaskApi } from '#/api';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMyTaskList } from '#/api';

import { useColumns, useGridFormSchema } from './data';

function handleActionClick(code: string, row: BdTaskApi.MyTaskItem) {
  switch (code) {
    case 'upload': {
      message.info(`上传筹备表: ${row.productName} (taskId: ${row.taskId})`);
      break;
    }
    case 'view': {
      message.info(`查看达人: ${row.productName} (taskId: ${row.taskId})`);
      break;
    }
  }
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['deadline', ['deadlineStart', 'deadlineEnd']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(handleActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const result = await getMyTaskList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          return result;
        },
      },
    },
    rowConfig: {
      keyField: 'taskId',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<BdTaskApi.MyTaskItem>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="我的任务" table-title-help="任务收件箱" />
  </Page>
</template>
