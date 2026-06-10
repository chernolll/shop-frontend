<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';

import { useNotificationStore } from '#/store';

const store = useNotificationStore();

onMounted(() => {
  store.fetchSettings();
});

const formSchema = computed(() => [
  {
    value: store.settings.accountPassword ?? true,
    fieldName: 'accountPassword',
    label: '账户密码',
    description: '其他用户的消息将以站内信的形式通知',
  },
  {
    value: store.settings.systemMessage ?? true,
    fieldName: 'systemMessage',
    label: '系统消息',
    description: '系统消息将以站内信的形式通知',
  },
  {
    value: store.settings.todoTask ?? true,
    fieldName: 'todoTask',
    label: '待办任务',
    description: '待办任务将以站内信的形式通知',
  },
]);

function handleChange(evt: Record<string, any>) {
  const { fieldName, value } = evt;
  store.updateSettings({ [fieldName]: value });
}
</script>
<template>
  <ProfileNotificationSetting
    :form-schema="formSchema"
    @change="handleChange"
  />
</template>
