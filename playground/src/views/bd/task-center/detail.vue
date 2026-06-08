<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Divider, Image, message, Tag } from 'ant-design-vue';

import { getTagColor, mockTaskSquareList } from './mockData';

const router = useRouter();

// For UI mock: use the first task
const currentTaskId = 1;
const task = computed(() =>
  mockTaskSquareList.find((t) => t.id === currentTaskId),
);

function goBack() {
  router.back();
}

function handleJoin() {
  message.success('参与成功！');
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString()}`;
}

// Placeholder data for the detail page sections
const placeholderImages = [
  'https://picsum.photos/seed/task1/400/300',
  'https://picsum.photos/seed/task2/400/300',
  'https://picsum.photos/seed/task3/400/300',
];

const placeholderVideos = [
  { title: '示例视频 1', duration: '0:45' },
  { title: '示例视频 2', duration: '1:20' },
];

const placeholderAttachments = [
  { name: '任务说明文档.pdf', size: '2.4 MB' },
  { name: '品牌指南.zip', size: '5.1 MB' },
  { name: '参考素材包.zip', size: '12.8 MB' },
];

const requirements = [
  '视频时长不少于 30 秒，不超过 3 分钟',
  '需包含产品实际使用场景展示',
  '视频需在 TikTok / Shopee Live 平台发布',
  '需在视频描述中标注产品链接',
  '提交后需等待审核通过方可获得奖励',
];

const notes = [
  '请确保视频内容符合平台社区规范',
  '禁止使用侵权音乐或素材',
  '奖励将在审核通过后 7 个工作日内发放',
  '如有疑问请联系 BD 运营团队',
];
</script>

<template>
  <div class="task-detail">
    <!-- Back Button -->
    <button class="detail-back-btn" @click="goBack">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      <span>返回任务中心</span>
    </button>

    <div v-if="task" class="detail-container">
      <!-- Detail Card -->
      <div class="detail-card">
        <!-- Header Section -->
        <div class="detail-header-top">
          <h1 class="detail-title">{{ task.name }}</h1>
          <div class="detail-tags">
            <Tag
              v-for="(tag, i) in task.tags"
              :key="tag"
              :color="getTagColor(i)"
            >
              {{ tag }}
            </Tag>
          </div>
        </div>

        <Divider class="!my-6" />

        <!-- Info Grid -->
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <span class="detail-info-label">奖励</span>
            <span class="detail-info-value detail-info-reward">
              {{ formatCurrency(task.commission) }}
            </span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">发布时间</span>
            <span class="detail-info-value">
              {{ formatDate(task.createdAt) }}
            </span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">截止时间</span>
            <span class="detail-info-value">
              {{ task.deadline ? formatDate(task.deadline) : '长期有效' }}
            </span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">创建者</span>
            <span class="detail-info-value">Admin</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">需求视频数</span>
            <span class="detail-info-value">{{ task.videoNum }} 个</span>
          </div>
          <div class="detail-info-item">
            <span class="detail-info-label">已参与 BD</span>
            <span class="detail-info-value">{{ task.bdCount }} 人</span>
          </div>
        </div>

        <Divider class="!my-6" />

        <!-- Task Description -->
        <section class="detail-section">
          <h2 class="detail-section-title">任务说明</h2>
          <p class="detail-section-text">{{ task.description }}</p>
          <a
            :href="task.productUrl"
            target="_blank"
            class="detail-product-link"
          >
            {{ task.productUrl }}
          </a>
        </section>

        <Divider class="!my-6" />

        <!-- Example Images -->
        <section class="detail-section">
          <h2 class="detail-section-title">示例图片</h2>
          <div class="detail-image-grid">
            <div
              v-for="(img, i) in placeholderImages"
              :key="i"
              class="detail-image-item"
            >
              <Image
                :src="img"
                :preview="true"
                class="detail-image"
                :placeholder="true"
              />
            </div>
          </div>
        </section>

        <Divider class="!my-6" />

        <!-- Example Videos -->
        <section class="detail-section">
          <h2 class="detail-section-title">示例视频</h2>
          <div class="detail-video-list">
            <div
              v-for="(video, i) in placeholderVideos"
              :key="i"
              class="detail-video-item"
            >
              <div class="detail-video-placeholder">
                <span class="detail-video-icon">▶</span>
              </div>
              <div>
                <span class="detail-video-name">{{ video.title }}</span>
                <span class="detail-video-duration">{{ video.duration }}</span>
              </div>
            </div>
          </div>
        </section>

        <Divider class="!my-6" />

        <!-- Attachments -->
        <section class="detail-section">
          <h2 class="detail-section-title">附件下载</h2>
          <div class="detail-attachment-list">
            <div
              v-for="(file, i) in placeholderAttachments"
              :key="i"
              class="detail-attachment-item"
            >
              <div class="flex items-center gap-3">
                <span class="detail-attachment-icon">📄</span>
                <span class="detail-attachment-name">{{ file.name }}</span>
                <span class="detail-attachment-size">{{ file.size }}</span>
              </div>
              <Button type="link" size="small">
                <template #icon>
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </template>
                下载
              </Button>
            </div>
          </div>
        </section>

        <Divider class="!my-6" />

        <!-- Requirements -->
        <section class="detail-section">
          <h2 class="detail-section-title">提交要求</h2>
          <ul class="detail-list">
            <li v-for="(req, i) in requirements" :key="i">
              <span class="detail-list-marker">{{ i + 1 }}.</span>
              {{ req }}
            </li>
          </ul>
        </section>

        <Divider class="!my-6" />

        <!-- Notes -->
        <section class="detail-section">
          <h2 class="detail-section-title">注意事项</h2>
          <div class="detail-notes">
            <div v-for="(note, i) in notes" :key="i" class="detail-note-item">
              <span class="detail-note-icon">ℹ️</span>
              <span>{{ note }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Not Found -->
    <div
      v-else
      class="flex min-h-[400px] items-center justify-center text-gray-400"
    >
      任务未找到
    </div>

    <!-- Fixed Bottom Bar -->
    <div class="detail-bottom-bar">
      <div class="detail-bottom-bar-inner">
        <div class="detail-bottom-info">
          <span class="detail-bottom-title">{{ task?.name }}</span>
          <span class="detail-bottom-reward">
            奖励: {{ task ? formatCurrency(task.commission) : '-' }}
          </span>
        </div>
        <Button type="primary" size="large" class="!px-10" @click="handleJoin">
          立即参与
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Layout --- */
.task-detail {
  position: relative;
  max-width: 880px;
  padding-bottom: 100px;
  margin: 0 auto;
}

/* --- Back Button --- */
.detail-back-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.2s ease;
}

.detail-back-btn:hover {
  color: hsl(var(--primary));
}

/* --- Card --- */
.detail-card {
  padding: 40px;
  background: var(--card, #fff);
  border: 1px solid hsl(var(--border) / 60%);
  border-radius: 16px;
  box-shadow:
    0 1px 3px hsl(var(--border) / 20%),
    0 4px 12px hsl(var(--border) / 10%);
}

/* --- Header --- */
.detail-header-top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.detail-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: hsl(var(--foreground));
  letter-spacing: -0.5px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* --- Info Grid --- */
.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .detail-info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.detail-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-info-label {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--muted-foreground, 215 16% 47%));
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-info-value {
  font-size: 16px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.detail-info-reward {
  font-size: 20px;
  font-weight: 700;
  color: hsl(var(--primary));
}

/* --- Sections --- */
.detail-section {
  margin: 0;
}

.detail-section-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: -0.2px;
}

.detail-section-text {
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 1.75;
  color: hsl(var(--foreground) / 80%);
}

.detail-product-link {
  display: inline-block;
  font-size: 14px;
  color: hsl(var(--primary));
  word-break: break-all;
  text-decoration: none;
}

.detail-product-link:hover {
  text-decoration: underline;
}

/* --- Image Grid --- */
.detail-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.detail-image-item {
  overflow: hidden;
  border: 1px solid hsl(var(--border) / 40%);
  border-radius: 12px;
}

.detail-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

/* --- Video List --- */
.detail-video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-video-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid hsl(var(--border) / 40%);
  border-radius: 10px;
}

.detail-video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: hsl(var(--background-deep, 216 20% 96%));
  border-radius: 8px;
}

.detail-video-icon {
  font-size: 18px;
  color: hsl(var(--primary));
}

.detail-video-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.detail-video-duration {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

/* --- Attachments --- */
.detail-attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid hsl(var(--border) / 40%);
  border-radius: 10px;
}

.detail-attachment-icon {
  font-size: 20px;
}

.detail-attachment-name {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.detail-attachment-size {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

/* --- Requirements List --- */
.detail-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.detail-list li {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: hsl(var(--foreground) / 85%);
}

.detail-list-marker {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--primary));
}

/* --- Notes --- */
.detail-notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-note-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--foreground) / 80%);
  background: hsl(var(--background-deep, 216 20% 96%) / 60%);
  border-radius: 8px;
}

.detail-note-icon {
  flex-shrink: 0;
  font-size: 14px;
}

/* --- Bottom Bar --- */
.detail-bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  padding: 16px 24px;
  background: hsl(var(--card, 0 0% 100%) / 90%);
  border-top: 1px solid hsl(var(--border) / 40%);
  box-shadow: 0 -4px 20px hsl(var(--border) / 15%);
  backdrop-filter: blur(12px);
}

.detail-bottom-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 880px;
  margin: 0 auto;
}

.detail-bottom-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-bottom-title {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.detail-bottom-reward {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
