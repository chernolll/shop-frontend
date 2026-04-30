<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card } from 'ant-design-vue';

import { $t } from '#/locales';

const route = useRoute();
const sopId = computed(() => route.params.sop_id);
</script>

<template>
  <Page auto-content-height>
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <h1 class="text-xl font-semibold text-slate-900">
        {{ $t('page.bd.sop.detail.heading') }} #{{ sopId }}
      </h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        {{ $t('page.bd.sop.detail.description') }}
      </p>
    </Card>
  </Page>
</template>
