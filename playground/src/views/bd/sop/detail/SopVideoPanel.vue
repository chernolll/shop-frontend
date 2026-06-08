<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  advanceStageBDSop,
  BDSopApi,
  getBDSopVideoDetail,
  updateBDSopVideo,
} from '#/api/bd/sop';
import { $t } from '#/locales';

const props = defineProps<{
  sopId: number;
}>();

const emit = defineEmits<{
  refreshDetail: [];
}>();

const detailLoading = ref(false);
const detailLoaded = ref(false);
const detailError = ref('');
const videoDetail = ref<BDSopApi.VideoDetail | null>(null);
const advancing = ref(false);
const submitting = ref(false);

const formState = reactive<{
  ads_code: string;
  upload_time: string | undefined;
  video_url: string;
}>({
  ads_code: '',
  upload_time: undefined,
  video_url: '',
});

const hasSubmittedVideo = computed(() => {
  const videoUrl = videoDetail.value?.video_url?.trim();
  const uploadTime = Number(videoDetail.value?.upload_time ?? 0);
  return Boolean(videoUrl) && uploadTime > 0;
});
const canSubmit = computed(() => Boolean(videoDetail.value));
const hasBudget = computed(
  () => Number(videoDetail.value?.has_budget ?? 0) === 1,
);
const canAdvance = computed(() => {
  if (!videoDetail.value) return false;
  if (videoDetail.value.sop_status !== BDSopApi.Status.RECOVER) return false;
  if (!hasSubmittedVideo.value) return false;
  return true;
});
const advanceButtonLabel = computed(() =>
  hasBudget.value
    ? $t('page.bd.sop.detail.video.advance-to-remittance-button')
    : $t('page.bd.sop.detail.video.advance-to-complete-button'),
);
const advanceConfirmContent = computed(() =>
  hasBudget.value
    ? $t('page.bd.sop.detail.video.advance-to-remittance-confirm-content')
    : $t('page.bd.sop.detail.video.advance-to-complete-confirm-content'),
);

watch(
  () => videoDetail.value,
  (detail) => {
    formState.video_url = detail?.video_url ?? '';
    formState.ads_code = detail?.ads_code ?? '';
    formState.upload_time = detail?.upload_time
      ? String(detail.upload_time)
      : undefined;
  },
  { immediate: true },
);

function formatTimestamp(value?: null | number) {
  return value ? formatDateTime(value) : '-';
}

function getSopStatusText(status?: number) {
  switch (status) {
    case BDSopApi.Status.COMPLETED: {
      return $t('page.bd.sop.status-text.completed');
    }
    case BDSopApi.Status.CONTACT: {
      return $t('page.bd.sop.status-text.contact');
    }
    case BDSopApi.Status.RECOVER: {
      return $t('page.bd.sop.status-text.recover');
    }
    case BDSopApi.Status.REMITTANCE: {
      return $t('page.bd.sop.status-text.remittance');
    }
    case BDSopApi.Status.SAMPLE: {
      return $t('page.bd.sop.status-text.sample');
    }
    case BDSopApi.Status.TERMINATED: {
      return $t('page.bd.sop.status-text.terminated');
    }
    default: {
      return '-';
    }
  }
}

function getSopStatusColor(status?: number) {
  switch (status) {
    case BDSopApi.Status.COMPLETED: {
      return 'success';
    }
    case BDSopApi.Status.CONTACT: {
      return 'default';
    }
    case BDSopApi.Status.RECOVER: {
      return 'warning';
    }
    case BDSopApi.Status.REMITTANCE: {
      return 'processing';
    }
    case BDSopApi.Status.SAMPLE: {
      return 'processing';
    }
    case BDSopApi.Status.TERMINATED: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

function extractErrorCode(error: any) {
  return error?.response?.data?.error;
}

function extractErrorMessage(error: any, fallbackKey: string) {
  return (
    error?.response?.data?.error ??
    error?.response?.data?.message ??
    error?.message ??
    $t(fallbackKey)
  );
}

function resetForm() {
  formState.video_url = videoDetail.value?.video_url ?? '';
  formState.ads_code = videoDetail.value?.ads_code ?? '';
  formState.upload_time = videoDetail.value?.upload_time
    ? String(videoDetail.value.upload_time)
    : undefined;
}

async function loadVideoDetail() {
  if (props.sopId <= 0) {
    videoDetail.value = null;
    detailLoaded.value = true;
    detailError.value = $t('page.bd.sop.detail.video.missing-sop-id');
    return;
  }

  try {
    detailLoading.value = true;
    detailError.value = '';
    videoDetail.value = await getBDSopVideoDetail({
      task_sop_id: props.sopId,
    });
  } catch (error) {
    videoDetail.value = null;
    detailError.value = extractErrorMessage(
      error,
      'page.bd.sop.detail.video.load-failed',
    );
  } finally {
    detailLoaded.value = true;
    detailLoading.value = false;
  }
}

function confirmAdvanceStage() {
  if (!canAdvance.value) return;

  Modal.confirm({
    content: advanceConfirmContent.value,
    okText: advanceButtonLabel.value,
    title: $t('page.bd.sop.detail.video.advance-confirm-title'),
    async onOk() {
      try {
        advancing.value = true;
        await advanceStageBDSop({ task_sop_id: props.sopId });
        message.success($t('page.bd.sop.detail.advance-success'));
        await loadVideoDetail();
        emit('refreshDetail');
      } finally {
        advancing.value = false;
      }
    },
  });
}

function confirmSubmit() {
  if (!videoDetail.value || !canSubmit.value) {
    return;
  }

  const videoUrl = formState.video_url.trim();
  if (!videoUrl) {
    message.warning($t('page.bd.sop.detail.video.video-url-required'));
    return;
  }

  const uploadTime = Number(formState.upload_time ?? 0);
  if (!Number.isFinite(uploadTime) || uploadTime <= 0) {
    message.warning($t('page.bd.sop.detail.video.upload-time-required'));
    return;
  }

  Modal.confirm({
    content: $t('page.bd.sop.detail.video.submit-confirm-content'),
    okText: $t('page.bd.sop.detail.video.submit'),
    title: $t('page.bd.sop.detail.video.submit-confirm-title'),
    async onOk() {
      try {
        submitting.value = true;
        await updateBDSopVideo({
          ads_code: formState.ads_code.trim() || null,
          task_sop_id: props.sopId,
          upload_time: uploadTime,
          video_url: videoUrl,
        });
        message.success($t('page.bd.sop.detail.video.submit-success'));
        await loadVideoDetail();
        emit('refreshDetail');
      } catch (error) {
        if (extractErrorCode(error) === 'sop.video_stage_only') {
          await loadVideoDetail();
          emit('refreshDetail');
        }
      } finally {
        submitting.value = false;
      }
    },
  });
}

watch(
  () => props.sopId,
  () => {
    detailLoaded.value = false;
    videoDetail.value = null;
    loadVideoDetail();
  },
  { immediate: true },
);
</script>

<template>
  <Card :bordered="false" class="min-h-[360px] rounded-2xl shadow-sm">
    <Spin :spinning="detailLoading">
      <Space direction="vertical" :size="20" class="w-full">
        <template v-if="videoDetail">
          <Space class="flex w-full items-start justify-between" wrap>
            <div>
              <div class="text-xl font-semibold text-foreground">
                {{ $t('page.bd.sop.status-text.recover') }}
              </div>
              <div
                class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground"
              >
                {{
                  canSubmit
                    ? $t('page.bd.sop.detail.video.editable-tip')
                    : $t('page.bd.sop.detail.video.readonly-tip')
                }}
              </div>
            </div>
            <Space wrap>
              <Tag color="processing">SOP #{{ sopId }}</Tag>
              <Tag :color="getSopStatusColor(videoDetail.sop_status)">
                {{ getSopStatusText(videoDetail.sop_status) }}
              </Tag>
              <Tag :color="hasSubmittedVideo ? 'success' : 'default'">
                {{
                  hasSubmittedVideo
                    ? $t('page.bd.sop.detail.video.submitted-tag')
                    : $t('page.bd.sop.detail.video.pending-tag')
                }}
              </Tag>
            </Space>
          </Space>

          <Alert
            v-if="videoDetail"
            show-icon
            type="info"
            :message="$t('page.bd.sop.detail.video.panel-title')"
            :description="
              $t('page.bd.sop.detail.video.panel-editable-description')
            "
            class="rounded-xl"
          />

          <Alert
            v-if="detailError"
            show-icon
            type="warning"
            :message="$t('page.bd.sop.detail.video.load-failed')"
            :description="detailError"
            class="rounded-xl"
          />

          <Row :gutter="[16, 16]">
            <Col :lg="14" :span="24">
              <Card
                size="small"
                class="h-full rounded-2xl border border-border"
              >
                <template #title>
                  <span class="text-sm font-semibold text-foreground">
                    {{ $t('page.bd.sop.detail.video.info-card-title') }}
                  </span>
                </template>

                <Space direction="vertical" :size="18" class="w-full">
                  <div class="space-y-2">
                    <div class="text-sm font-medium text-foreground">
                      {{ $t('page.bd.sop.detail.video.video-url-label') }}
                    </div>
                    <Input
                      v-model:value="formState.video_url"
                      :disabled="!canSubmit"
                      :placeholder="
                        $t('page.bd.sop.detail.video.video-url-placeholder')
                      "
                    />
                    <a
                      v-if="!canSubmit && videoDetail.video_url"
                      :href="videoDetail.video_url"
                      target="_blank"
                      rel="noreferrer"
                      class="text-sm text-blue-500 hover:underline"
                    >
                      {{ videoDetail.video_url }}
                    </a>
                  </div>

                  <div class="space-y-2">
                    <div class="text-sm font-medium text-foreground">
                      {{ $t('page.bd.sop.detail.video.ads-code-label') }}
                    </div>
                    <Input
                      v-model:value="formState.ads_code"
                      :disabled="!canSubmit"
                      :placeholder="
                        $t('page.bd.sop.detail.video.ads-code-placeholder')
                      "
                    />
                  </div>

                  <div class="space-y-2">
                    <div class="text-sm font-medium text-foreground">
                      {{ $t('page.bd.sop.detail.video.upload-time-label') }}
                    </div>
                    <DatePicker
                      v-model:value="formState.upload_time"
                      class="w-full"
                      :disabled="!canSubmit"
                      show-time
                      value-format="x"
                      :placeholder="
                        $t('page.bd.sop.detail.video.upload-time-placeholder')
                      "
                    />
                  </div>

                  <Space v-if="canSubmit" wrap>
                    <Button
                      type="primary"
                      :loading="submitting"
                      @click="confirmSubmit"
                    >
                      {{ $t('page.bd.sop.detail.video.submit') }}
                    </Button>
                    <Button :disabled="submitting" @click="resetForm">
                      {{ $t('page.bd.sop.detail.video.reset') }}
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>

            <Col :lg="10" :span="24">
              <Card
                size="small"
                class="h-full rounded-2xl border border-border"
              >
                <template #title>
                  <span class="text-sm font-semibold text-foreground">
                    {{ $t('page.bd.sop.detail.video.summary-card-title') }}
                  </span>
                </template>

                <div class="space-y-4 text-sm">
                  <div class="rounded-xl border border-border bg-muted/40 p-4">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{ $t('page.bd.sop.detail.current-status') }}
                    </div>
                    <div class="mt-2">
                      <Tag :color="getSopStatusColor(videoDetail.sop_status)">
                        {{ getSopStatusText(videoDetail.sop_status) }}
                      </Tag>
                    </div>
                  </div>

                  <div class="rounded-xl border border-border bg-muted/40 p-4">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{
                        $t('page.bd.sop.detail.video.latest-upload-time-title')
                      }}
                    </div>
                    <div class="mt-2 text-sm text-foreground">
                      {{ formatTimestamp(videoDetail.upload_time) }}
                    </div>
                  </div>

                  <div class="rounded-xl border border-border bg-muted/40 p-4">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{ $t('page.bd.sop.detail.video.readonly-rule-title') }}
                    </div>
                    <div class="mt-2 text-sm leading-6 text-muted-foreground">
                      {{ $t('page.bd.sop.detail.video.readonly-rule-tip') }}
                    </div>
                  </div>

                  <div class="rounded-xl border border-border bg-muted/40 p-4">
                    <div
                      class="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {{ $t('page.bd.sop.detail.video.advance-card-title') }}
                    </div>
                    <div class="mt-2 text-sm leading-6 text-muted-foreground">
                      {{
                        canAdvance
                          ? $t('page.bd.sop.detail.video.advance-ready-tip')
                          : $t('page.bd.sop.detail.video.advance-disabled-tip')
                      }}
                    </div>
                    <Button
                      class="mt-4"
                      type="primary"
                      :disabled="!canAdvance"
                      :loading="advancing"
                      @click="confirmAdvanceStage"
                    >
                      {{ advanceButtonLabel }}
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </template>

        <template v-else-if="detailLoaded">
          <Empty
            :description="$t('page.bd.sop.detail.video.empty-description')"
          />
          <Button type="primary" ghost @click="loadVideoDetail">
            {{ $t('page.bd.sop.detail.video.retry') }}
          </Button>
        </template>
      </Space>
    </Spin>
  </Card>
</template>
