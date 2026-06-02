<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { Card } from 'ant-design-vue';
import { $t } from '#/locales';
</script>

<template>
  <Page auto-content-height>
    <Card :bordered="false" class="rounded-2xl shadow-sm">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <div class="text-4xl text-muted-foreground/30 mb-4">
          🚧
        </div>
        <div class="text-lg text-muted-foreground">
          {{ $t('page.sample.dashboard-title') }}
        </div>
        <div class="mt-2 text-sm text-muted-foreground/60">
          Coming soon...
        </div>
      </div>
    </Card>
  </Page>
</template>
