import type { NotificationItem } from '@vben/layouts';

import type { NotificationApi } from '#/api';

import { computed, ref } from 'vue';

import { preferences } from '@vben/preferences';

import { defineStore } from 'pinia';

import {
  clearNotifications,
  connectNotificationStream,
  deleteNotification,
  getNotificationList,
  getNotificationSettings,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationSettings,
} from '#/api';

// ==================== 工具函数 ====================

/** 将后端 MessageItem 映射为前端 NotificationItem */
function mapMessageToNotificationItem(
  item: NotificationApi.MessageItem,
): NotificationItem {
  // 头像兜底：后端可能返回空字符串或无效 URL
  const avatarSrc =
    item.avatar && isValidAvatarUrl(item.avatar)
      ? item.avatar
      : preferences.app.defaultAvatar;

  // 消息内容：有发送人时前置 "发送人: "，让用户能看到是谁
  const messageText = item.senderName
    ? `${item.senderName}: ${item.content}`
    : item.content;

  return {
    id: item.id,
    avatar: avatarSrc,
    title: item.title,
    message: messageText, // content → message（含发送人前缀）
    date: formatRelativeTime(item.createdAt), // timestamp → 相对时间
    isRead: item.isRead,
    link: item.link ?? undefined,
    query: item.query ?? undefined,
    state: item.state ?? undefined,
    // 通过 [key: string]: any 索引签名携带额外字段
    type: item.type,
    priority: item.priority,
    senderId: item.senderId,
    senderName: item.senderName,
    extra: item.extra,
    createdAt: item.createdAt,
    readAt: item.readAt,
  };
}

/** 毫秒时间戳 → 中文相对时间字符串 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0) return '刚刚';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;

  // 超过 7 天显示日期
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 校验头像 URL 是否有效（非空且是合法 HTTP(S) URL） */
function isValidAvatarUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** SSE 事件解析结果 */
interface SseEvent {
  data: string;
  event: string;
}

/** 从原始文本缓冲区中解析 SSE 事件 */
function parseSseEvents(buffer: string): {
  completeEvents: SseEvent[];
  remaining: string;
} {
  const completeEvents: SseEvent[] = [];
  // 按双换行分割事件
  const parts = buffer.split('\n\n');
  // 最后一段可能不完整，保留在缓冲区
  const remaining = parts.pop() || '';

  for (const part of parts) {
    if (!part.trim()) continue;

    let eventType = 'message'; // 默认事件类型
    let dataContent = '';

    const lines = part.split('\n');
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataContent = line.slice(5).trim();
      }
    }

    if (dataContent) {
      completeEvents.push({ event: eventType, data: dataContent });
    }
  }

  return { completeEvents, remaining };
}

// ==================== Store ====================

export const useNotificationStore = defineStore('notification', () => {
  // ---------- State ----------
  const messages = ref<NotificationItem[]>([]);
  const unreadCounts = ref<NotificationApi.UnreadCounts>({
    total: 0,
    system: 0,
    task: 0,
    audit: 0,
    message: 0,
  });
  const settings = ref<NotificationApi.MessageSettings>({
    accountPassword: true,
    systemMessage: true,
    todoTask: true,
    emailEnabled: false,
    smsEnabled: false,
  });
  const listTotal = ref(0);
  const listLoading = ref(false);
  const settingsLoading = ref(false);
  const sseConnected = ref(false);
  const currentPage = ref(1);

  // SSE 内部状态
  let abortController: AbortController | null = null;
  let sseBuffer = '';
  let reconnectDelay = 3000; // 当前重连延迟
  let reconnectTimer: null | ReturnType<typeof setTimeout> = null;
  let shouldReconnect = false; // 是否应该重连（disconnectSSE 调用时设为 false）

  // ---------- Getters ----------
  const showDot = computed(() => unreadCounts.value.total > 0);
  const hasMore = computed(() => messages.value.length < listTotal.value);
  const isReconnecting = computed(() => !sseConnected.value && shouldReconnect);

  // ---------- SSE 事件处理 ----------
  function handleSseMessage(rawChunk: string) {
    sseBuffer += rawChunk;
    const { completeEvents, remaining } = parseSseEvents(sseBuffer);
    sseBuffer = remaining;

    for (const { event, data } of completeEvents) {
      try {
        switch (event) {
          case 'notification': {
            const item: NotificationApi.MessageItem = JSON.parse(data);
            prependMessage(item);
            break;
          }
          case 'unread-count': {
            const counts: NotificationApi.UnreadCounts = JSON.parse(data);
            updateUnreadCountsFromSse(counts);
            break;
          }
          default: {
            // 未知事件类型，忽略
            break;
          }
        }
      } catch (error) {
        console.error(
          '[NotificationStore] SSE event parse error:',
          event,
          data,
          error,
        );
      }
    }
  }

  function handleSseEnd() {
    sseConnected.value = false;
    abortController = null;

    // 如果允许重连，则启动指数退避重连
    if (shouldReconnect) {
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      if (shouldReconnect) {
        connectSSE();
      }
    }, reconnectDelay);

    // 指数退避：3s → 6s → 12s → 24s → 48s → 60s (max)
    reconnectDelay = Math.min(reconnectDelay * 2, 60_000);
  }

  // ---------- Actions ----------

  /** 获取通知列表 */
  async function fetchMessages(
    page: number = 1,
    filters?: {
      endTime?: number;
      isRead?: 0 | 1;
      keyword?: string;
      startTime?: number;
      type?: NotificationApi.MessageType;
    },
  ) {
    listLoading.value = true;
    try {
      const result = await getNotificationList({
        page,
        pageSize: 10,
        ...filters,
      });

      const notificationItems = result.list.map((element) =>
        mapMessageToNotificationItem(element),
      );

      if (page === 1) {
        // 第一页：替换列表
        messages.value = notificationItems;
      } else {
        // 后续页：追加到列表末尾
        // 去重：已存在的 id 跳过
        const existingIds = new Set(messages.value.map((m) => m.id));
        const newItems = notificationItems.filter(
          (item) => !existingIds.has(item.id),
        );
        messages.value.push(...newItems);
      }

      listTotal.value = result.total;
      currentPage.value = page;
      updateUnreadCountsFromSse({
        total: result.unreadCount,
        system: unreadCounts.value.system,
        task: unreadCounts.value.task,
        audit: unreadCounts.value.audit,
        message: unreadCounts.value.message,
      });
    } catch (error) {
      console.error('[NotificationStore] fetchMessages failed:', error);
    } finally {
      listLoading.value = false;
    }
  }

  /** 获取未读数量 */
  async function fetchUnreadCounts() {
    try {
      const result = await getUnreadCount();
      unreadCounts.value = result;
    } catch (error) {
      console.error('[NotificationStore] fetchUnreadCounts failed:', error);
    }
  }

  /** 标记单条已读 */
  async function markRead(id: number) {
    try {
      await markNotificationRead(id);
      // 本地更新
      const item = messages.value.find((m) => m.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        // 更新未读数
        const type = item.type as NotificationApi.MessageType;
        if (type && unreadCounts.value[type] > 0) {
          unreadCounts.value[type]--;
          unreadCounts.value.total = Math.max(0, unreadCounts.value.total - 1);
        }
      }
    } catch {
      // API 失败不更新本地状态
    }
  }

  /** 全部标记已读 */
  async function markAllRead(type?: NotificationApi.MessageType) {
    try {
      await markAllNotificationsRead(type ? { type } : undefined);
      // 本地更新
      if (type) {
        messages.value.forEach((item) => {
          if ((item as any).type === type && !item.isRead) {
            item.isRead = true;
          }
        });
        // 重置该类型未读数
        unreadCounts.value[type] = 0;
        // 重新计算 total
        unreadCounts.value.total =
          unreadCounts.value.system +
          unreadCounts.value.task +
          unreadCounts.value.audit +
          unreadCounts.value.message;
      } else {
        messages.value.forEach((item) => {
          item.isRead = true;
        });
        unreadCounts.value = {
          total: 0,
          system: 0,
          task: 0,
          audit: 0,
          message: 0,
        };
      }
    } catch {
      // API 失败不更新本地状态
    }
  }

  /** 删除单条通知 */
  async function removeMessage(id: number) {
    try {
      await deleteNotification(id);
      // 本地移除
      const item = messages.value.find((m) => m.id === id);
      messages.value = messages.value.filter((m) => m.id !== id);

      // 如果删除的是未读消息，更新未读数
      if (item && !item.isRead) {
        const type = item.type as NotificationApi.MessageType;
        if (type && unreadCounts.value[type] > 0) {
          unreadCounts.value[type]--;
          unreadCounts.value.total = Math.max(0, unreadCounts.value.total - 1);
        }
      }
    } catch {
      // API 失败不更新本地状态
    }
  }

  /** 清空通知 */
  async function clearMessages(type?: NotificationApi.MessageType) {
    try {
      await clearNotifications(type ? { type } : undefined);
      // 本地清空
      if (type) {
        // 按类型清空时也重置未读数
        messages.value = messages.value.filter((m) => (m as any).type !== type);
        unreadCounts.value[type] = 0;
        unreadCounts.value.total =
          unreadCounts.value.system +
          unreadCounts.value.task +
          unreadCounts.value.audit +
          unreadCounts.value.message;
      } else {
        messages.value = [];
        unreadCounts.value = {
          total: 0,
          system: 0,
          task: 0,
          audit: 0,
          message: 0,
        };
      }
    } catch {
      // API 失败不更新本地状态
    }
  }

  /** 获取通知设置 */
  async function fetchSettings() {
    settingsLoading.value = true;
    try {
      const result = await getNotificationSettings();
      settings.value = result;
    } finally {
      settingsLoading.value = false;
    }
  }

  /** 更新通知设置 */
  async function updateSettings(
    data: Partial<NotificationApi.MessageSettings>,
  ) {
    try {
      await updateNotificationSettings(data);
      // 本地更新
      Object.assign(settings.value, data);
    } catch {
      // API 失败不更新本地状态
    }
  }

  /** SSE 推送新消息时插入列表顶部 */
  function prependMessage(item: NotificationApi.MessageItem) {
    const notificationItem = mapMessageToNotificationItem(item);
    // 去重：已存在则跳过
    if (messages.value.some((m) => m.id === notificationItem.id)) return;
    messages.value.unshift(notificationItem);
    listTotal.value++;

    // 更新未读数
    if (!notificationItem.isRead) {
      const type = item.type;
      if (type && unreadCounts.value[type] !== undefined) {
        unreadCounts.value[type]++;
        unreadCounts.value.total++;
      }
    }
  }

  /** SSE 推送未读数更新时同步 */
  function updateUnreadCountsFromSse(counts: NotificationApi.UnreadCounts) {
    unreadCounts.value = counts;
  }

  /** 建立 SSE 连接 */
  function connectSSE() {
    if (sseConnected.value) return; // 已连接

    // 清理旧的 AbortController
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    shouldReconnect = true;

    connectNotificationStream({
      onMessage: (rawChunk: string) => {
        handleSseMessage(rawChunk);
      },
      onEnd: () => {
        handleSseEnd();
      },
      signal: abortController.signal,
    })
      .then(() => {
        // SSE 连接正常结束
        handleSseEnd();
      })
      .catch((error) => {
        // 连接失败（非主动断开）
        console.error('[NotificationStore] SSE connection failed:', error);
        handleSseEnd();
      });

    sseConnected.value = true;
    reconnectDelay = 3000; // 重置重连延迟
  }

  /** 断开 SSE 连接 */
  function disconnectSSE() {
    shouldReconnect = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    sseConnected.value = false;
    sseBuffer = '';
    reconnectDelay = 3000;
  }

  /** Pinia $reset() — setup store 需手动实现，供 logout 时 resetAllStores() 调用 */
  function $reset() {
    disconnectSSE();
    messages.value = [];
    unreadCounts.value = {
      total: 0,
      system: 0,
      task: 0,
      audit: 0,
      message: 0,
    };
    settings.value = {
      accountPassword: true,
      systemMessage: true,
      todoTask: true,
      emailEnabled: false,
      smsEnabled: false,
    };
    listTotal.value = 0;
    listLoading.value = false;
    settingsLoading.value = false;
    currentPage.value = 1;
  }

  // ---------- 导出 ----------
  return {
    // state
    messages,
    unreadCounts,
    settings,
    listTotal,
    listLoading,
    settingsLoading,
    sseConnected,
    currentPage,
    // getters
    showDot,
    hasMore,
    isReconnecting,
    // actions
    fetchMessages,
    fetchUnreadCounts,
    markRead,
    markAllRead,
    removeMessage,
    clearMessages,
    fetchSettings,
    updateSettings,
    connectSSE,
    disconnectSSE,
    prependMessage,
    $reset,
  };
});
