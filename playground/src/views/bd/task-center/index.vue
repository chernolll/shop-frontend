<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import MyTasks from './components/MyTasks.vue';
import TaskSquare from './components/TaskSquare.vue';

const activeTab = ref('square');
</script>

<template>
  <Page auto-content-height>
    <div class="task-center">
      <!-- Page Header -->
      <div class="task-center-header">
        <h1 class="task-center-heading">任务中心</h1>
        <p class="task-center-subtitle">
          浏览任务广场发现新机会，或管理已分配的任务
        </p>
      </div>

      <!-- Tabs -->
      <div class="task-center-tabs">
        <Tabs v-model:active-key="activeTab" size="large">
          <TabPane key="square" tab="任务广场">
            <TaskSquare />
          </TabPane>

          <TabPane key="my-tasks" tab="我的任务">
            <MyTasks />
          </TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.task-center {
  padding: 0;
}

/* --- Header --- */
.task-center-header {
  margin-bottom: 8px;
}

.task-center-heading {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: hsl(var(--foreground));
  letter-spacing: -0.5px;
}

.task-center-subtitle {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground, 215 16% 47%));
}

/* --- Tabs --- */
.task-center-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 24px;
}
</style>
