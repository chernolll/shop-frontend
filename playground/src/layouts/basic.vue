<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import {
  computed,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useTabbarStore, useUserStore } from '@vben/stores';

import { $t } from '#/locales';
import { useAuthStore, useNotificationStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const { setMenuList } = useTabbarStore();
setMenuList([
  'close',
  'affix',
  'maximize',
  'reload',
  'open-in-new-window',
  'close-left',
  'close-right',
  'close-other',
  'close-all',
]);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const notificationStore = useNotificationStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const avatar = computed(() => {
  const src = userStore.userInfo?.avatar;
  return src && isValidUrl(src) ? src : preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleClickLogo() {}

const handleClick = (item: NotificationItem) => {
  // 1. 标记已读（幂等）
  if (!item.isRead) {
    notificationStore.markRead(item.id as number);
  }
  // 2. 跳转到业务路由
  if (item.link) {
    navigateTo(item.link, item.query, item.state);
  }
};

function navigateTo(
  link: string,
  query?: Record<string, any>,
  state?: Record<string, any>,
) {
  if (link.startsWith('http://') || link.startsWith('https://')) {
    // 外部链接，在新标签页打开
    window.open(link, '_blank');
  } else {
    // 内部路由链接，支持 query 参数和 state
    router.push({
      path: link,
      query: query || {},
      state,
    });
  }
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);

onBeforeMount(() => {
  if (preferences.app.watermark) {
    destroyWatermark();
  }
});

// 通知：初始加载 + SSE 连接（需 token 就绪，否则 401 会触发注销）
onMounted(async () => {
  if (!accessStore.accessToken) {
    console.warn(
      '[BasicLayout] accessToken not available, skipping notification init',
    );
    return;
  }
  await notificationStore.fetchMessages(1);
  notificationStore.connectSSE();
});

onBeforeUnmount(() => {
  notificationStore.disconnectSSE();
});
</script>

<template>
  <BasicLayout
    @clear-preferences-and-logout="handleLogout"
    @click-logo="handleClickLogo"
  >
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        description="ann.vben@gmail.com"
        tag-text="Pro"
        trigger="both"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="notificationStore.showDot"
        :notifications="notificationStore.messages"
        @clear="notificationStore.clearMessages()"
        @read="
          (item) => item.id && notificationStore.markRead(item.id as number)
        "
        @remove="
          (item) =>
            item.id && notificationStore.removeMessage(item.id as number)
        "
        @make-all="notificationStore.markAllRead()"
        @on-click="handleClick"
        @view-all="router.push({ name: 'Notifications' })"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
