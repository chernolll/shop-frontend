<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Descriptions, Space, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

const taskId = computed(() => String(route.params.task_id ?? ''));

function goBack() {
  router.push('/review/kol-prepare');
}
</script>

<template>
  <Page auto-content-height>
    <Space direction="vertical" :size="16" class="w-full">
      <Card :bordered="false" class="rounded-2xl shadow-sm">
        <Space direction="vertical" :size="16" class="w-full">
          <Space class="flex w-full items-start justify-between" wrap>
            <div>
              <div class="text-xl font-semibold text-foreground">
                {{ $t('page.review.kolPrepare.detail-title') }}
              </div>
              <div class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ $t('page.review.kolPrepare.detail-description') }}
              </div>
            </div>
            <Tag color="processing"> Task #{{ taskId || '-' }} </Tag>
          </Space>

          <Alert
            show-icon
            type="info"
            :message="$t('page.review.kolPrepare.detail-card-title')"
            :description="$t('page.review.kolPrepare.detail-card-description')"
            class="rounded-xl"
          />

          <Descriptions bordered size="small" :column="1">
            <Descriptions.Item :label="$t('page.review.fields.module')">
              {{ $t('page.review.kolPrepare.title') }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.fields.task-id')">
              {{ taskId || '-' }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.fields.route')">
              /review/kol-prepare/{{ taskId || ':task_id' }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('page.review.fields.status')">
              {{ $t('page.review.status.waiting-api') }}
            </Descriptions.Item>
          </Descriptions>

          <Space wrap>
            <Button @click="goBack">
              {{ $t('page.review.actions.back-to-list') }}
            </Button>
          </Space>
        </Space>
      </Card>
    </Space>
  </Page>
</template>
