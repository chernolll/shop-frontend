import type { SseRequestOptions } from '@vben/request';

import { requestClient } from '../request';

export namespace NotificationApi {
  export type MessageType = 'audit' | 'message' | 'system' | 'task';

  export interface MessageItem {
    avatar: string;
    content: string;
    createdAt: number; // 毫秒时间戳
    extra: null | Record<string, any>;
    id: number;
    isRead: boolean;
    link: null | string;
    priority: number; // 0=普通 1=重要 2=紧急
    query: null | Record<string, any>;
    readAt: null | number;
    senderId: string;
    senderName: string;
    state: null | Record<string, any>;
    title: string;
    type: MessageType;
  }

  export interface UnreadCounts {
    audit: number;
    message: number;
    system: number;
    task: number;
    total: number;
  }

  export interface MessageSettings {
    accountPassword: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    systemMessage: boolean;
    todoTask: boolean;
  }

  export interface MessageListParams {
    endTime?: number;
    isRead?: 0 | 1;
    keyword?: string;
    page: number;
    pageSize: number;
    startTime?: number;
    type?: MessageType;
  }

  export interface MessageListResult {
    list: MessageItem[];
    total: number;
    unreadCount: number;
  }
}

/** 分页获取通知列表 */
export async function getNotificationList(
  params: NotificationApi.MessageListParams,
) {
  return requestClient.get<NotificationApi.MessageListResult>(
    '/notifications',
    { params },
  );
}

/** 获取各类型未读数量 */
export async function getUnreadCount() {
  return requestClient.get<NotificationApi.UnreadCounts>(
    '/notifications/unread-count',
  );
}

/** 标记单条通知已读 */
export async function markNotificationRead(id: number) {
  return requestClient.put<{ readAt: number; success: boolean }>(
    `/notifications/${id}/read`,
  );
}

/** 全部标记已读 */
export async function markAllNotificationsRead(data?: {
  type?: NotificationApi.MessageType;
}) {
  return requestClient.put<{ affectedCount: number }>(
    '/notifications/read-all',
    data,
  );
}

/** 删除单条通知 */
export async function deleteNotification(id: number) {
  return requestClient.delete<{ success: boolean }>(`/notifications/${id}`);
}

/** 清空通知（按类型可选） */
export async function clearNotifications(data?: {
  type?: NotificationApi.MessageType;
}) {
  return requestClient.delete<{ deletedCount: number }>(
    '/notifications/clear',
    data ? { data } : undefined,
  );
}

/** 获取用户通知偏好设置 */
export async function getNotificationSettings() {
  return requestClient.get<NotificationApi.MessageSettings>(
    '/notifications/settings',
  );
}

/** 更新用户通知偏好设置 */
export async function updateNotificationSettings(
  data: Partial<NotificationApi.MessageSettings>,
) {
  return requestClient.put<{ success: boolean }>(
    '/notifications/settings',
    data,
  );
}

/** 建立 SSE 实时推送连接 */
export async function connectNotificationStream(options: SseRequestOptions) {
  return requestClient.postSSE('/notifications/stream', {}, options);
}
