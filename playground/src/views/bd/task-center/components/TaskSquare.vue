<script lang="ts" setup>
import type { TaskSquareItem } from '../mockData';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Empty, Input, Pagination, Select, Tag } from 'ant-design-vue';

import { getTagColor, mockTaskSquareList } from '../mockData';

const router = useRouter();

// --- Search & Filter ---
const searchKeyword = ref('');
const selectedTag = ref<string | undefined>(undefined);

const allTags = computed(() => {
  const tagSet = new Set<string>();
  for (const item of mockTaskSquareList) {
    for (const tag of item.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].toSorted();
});

// --- Pagination ---
const currentPage = ref(1);
const pageSize = ref(12);

const filteredList = computed(() => {
  let list = mockTaskSquareList;
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.mainSku.toLowerCase().includes(kw) ||
        item.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }
  if (selectedTag.value) {
    const tag = selectedTag.value;
    list = list.filter((item) => item.tags.includes(tag));
  }
  return list;
});

const totalFiltered = computed(() => filteredList.value.length);

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

function onPageChange(page: number, size: number) {
  currentPage.value = page;
  pageSize.value = size;
}

function onSearchChange() {
  currentPage.value = 1;
}

function onTagFilterChange() {
  currentPage.value = 1;
}

// --- Navigation ---
function goDetail(task: TaskSquareItem) {
  router.push({ name: 'BD-TaskCenter-Detail', params: { taskId: task.id } });
}

// --- Formatting ---
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString()}`;
}
</script>

<template>
  <div class="task-square">
    <!-- Search Bar -->
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索任务名称、SKU 或标签..."
        allow-clear
        class="!w-full sm:!w-[320px]"
        @change="onSearchChange"
      >
        <template #prefix>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </template>
      </Input>
      <Select
        v-model:value="selectedTag"
        placeholder="按标签筛选"
        allow-clear
        class="!w-full sm:!w-[200px]"
        :options="allTags.map((t) => ({ label: t, value: t }))"
        @change="onTagFilterChange"
      />
      <span class="text-sm text-gray-400"> {{ totalFiltered }} 个任务 </span>
    </div>

    <!-- Card Grid -->
    <div v-if="pagedList.length > 0" class="task-card-grid">
      <div
        v-for="task in pagedList"
        :key="task.id"
        class="task-card"
        @click="goDetail(task)"
      >
        <!-- Card Header -->
        <div class="task-card-header">
          <h3 class="task-card-title">{{ task.name }}</h3>
          <div class="task-card-tags">
            <Tag
              v-for="(tag, i) in task.tags"
              :key="tag"
              :color="getTagColor(i)"
              class="!m-0 text-[11px]"
            >
              {{ tag }}
            </Tag>
          </div>
        </div>

        <!-- Card Body -->
        <div class="task-card-body">
          <div class="task-card-field">
            <span class="task-card-label">商品链接</span>
            <a
              :href="task.productUrl"
              target="_blank"
              class="task-card-link"
              @click.stop
            >
              {{ task.productUrl }}
            </a>
          </div>
          <div class="task-card-meta">
            <div class="task-card-field">
              <span class="task-card-label">佣金</span>
              <span class="task-card-value task-card-commission">
                {{ formatCurrency(task.commission) }}
              </span>
            </div>
            <div class="task-card-field">
              <span class="task-card-label">视频数</span>
              <span class="task-card-value">{{ task.videoNum }}</span>
            </div>
            <div class="task-card-field">
              <span class="task-card-label">参与 BD</span>
              <span class="task-card-value">{{ task.bdCount }} 人</span>
            </div>
          </div>
          <div class="task-card-field">
            <span class="task-card-label">创建时间</span>
            <span class="task-card-value">{{
              formatDate(task.createdAt)
            }}</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="task-card-footer">
          <button class="task-card-action-btn" @click.stop="goDetail(task)">
            查看详情
            <span class="task-card-action-arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="flex min-h-[320px] items-center justify-center">
      <Empty description="暂无符合条件的任务" />
    </div>

    <!-- Pagination -->
    <div v-if="totalFiltered > pageSize" class="mt-8 flex justify-center">
      <Pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="totalFiltered"
        show-size-changer
        :page-size-options="['8', '12', '16', '24']"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* --- Card Grid --- */
.task-card-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 20px;
}

@media (min-width: 640px) {
  .task-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .task-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .task-card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* --- Card --- */
.task-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px;
  overflow: hidden;
  cursor: pointer;
  background: var(--card, #fff);
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 14px;
  box-shadow:
    0 1px 2px hsl(var(--border) / 30%),
    0 0 0 1px transparent;
  transition:
    transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
    border-color 0.25s ease,
    box-shadow 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.task-card:hover {
  border-color: hsl(var(--primary) / 30%);
  box-shadow:
    0 8px 24px hsl(var(--border) / 25%),
    0 2px 8px hsl(var(--border) / 15%);
  transform: translateY(-4px);
}

/* --- Card Header --- */
.task-card-header {
  margin-bottom: 16px;
}

.task-card-title {
  display: -webkit-box;
  margin: 0 0 10px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: hsl(var(--foreground));
  -webkit-box-orient: vertical;
}

.task-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* --- Card Body --- */
.task-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.task-card-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-card-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground, 215 16% 47%));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-card-value {
  font-size: 13px;
  color: hsl(var(--foreground));
}

.task-card-link {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: hsl(var(--primary));
  white-space: nowrap;
  text-decoration: none;
}

.task-card-link:hover {
  text-decoration: underline;
}

.task-card-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid hsl(var(--border) / 40%);
  border-bottom: 1px solid hsl(var(--border) / 40%);
}

.task-card-commission {
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--primary));
}

/* --- Card Footer --- */
.task-card-footer {
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px solid hsl(var(--border) / 30%);
}

.task-card-action-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: none;
  border: none;
  transition:
    color 0.2s ease,
    gap 0.2s ease;
}

.task-card:hover .task-card-action-btn {
  color: hsl(var(--primary));
}

.task-card-action-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.task-card:hover .task-card-action-arrow {
  transform: translateX(3px);
}
</style>
