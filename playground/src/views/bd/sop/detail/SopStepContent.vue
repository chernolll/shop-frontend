<script lang="ts" setup>
import { computed } from 'vue';

import { Card, Col, Row, Space, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

enum BDSOPStatus {
  CONTACT = 0,
  SAMPLE = 1,
  RECOVER = 2,
  COMPLETED = 3,
  REMITTANCE = 4,
}

const props = defineProps<{
  hasBudget: boolean;
  isTerminated: boolean;
  showTerminatedContent: boolean;
  sopId: string;
  step: {
    status: number;
    title: string;
  };
}>();

const placeholderMeta = computed(() => {
  if (props.isTerminated && props.showTerminatedContent) {
    return {
      description: '这里展示终止后的说明、操作记录和后续处理建议。',
      leftBody: '终止原因、责任说明、补救动作等信息后续可以在这里扩展。',
      leftTitle: '终止信息占位',
      rightBody: '如果后续需要恢复、复盘或交接，也可以把记录沉淀在这个区域。',
      rightTitle: '后续处理占位',
      title: $t('page.bd.sop.status-text.terminated'),
    };
  }

  const common = {
    [BDSOPStatus.COMPLETED]: {
      description: '这里后续可展示流程总结、完成时间和执行结果汇总。',
      leftBody: '已完成的流程摘要、关键结果和补充说明可以放在这里。',
      leftTitle: '完成结果占位',
      rightBody: '如需展示复盘信息、历史操作和附件，也可补充在这里。',
      rightTitle: '流程归档占位',
    },
    [BDSOPStatus.CONTACT]: {
      description: '这里后续可展示联系方式、沟通记录、预算申请等建联信息。',
      leftBody: '可放建联表单、预算申请、审批状态和沟通备注。',
      leftTitle: '建联信息占位',
      rightBody: '可放沟通补充、渠道信息、截图或操作日志。',
      rightTitle: '补充资料占位',
    },
    [BDSOPStatus.RECOVER]: {
      description: '这里后续可展示视频回收记录、分数、播放量、GMV 等结果数据。',
      leftBody: '可放视频链接列表、回收进度、质检评分和表现数据。',
      leftTitle: '视频回收占位',
      rightBody: '可放素材校验、数据备注和异常说明。',
      rightTitle: '数据说明占位',
    },
    [BDSOPStatus.REMITTANCE]: {
      description: '这里后续可展示汇款金额、聊天截图、汇款截图和审核轨迹。',
      leftBody: '可放汇款申请表、聊天记录截图与转账凭证。',
      leftTitle: '汇款资料占位',
      rightBody: '可放审核状态、审批意见和驳回原因。',
      rightTitle: '审核轨迹占位',
    },
    [BDSOPStatus.SAMPLE]: {
      description: '这里后续可展示送样地址、样品数量、物流单号等送样阶段信息。',
      leftBody: '可放地址表单、商品信息、数量和物流状态。',
      leftTitle: '送样信息占位',
      rightBody: '可放签收跟进、备注和异常处理记录。',
      rightTitle: '跟进记录占位',
    },
  };

  return {
    ...common[props.step.status as keyof typeof common],
    title: props.step.title,
  };
});

const statusTagColor = computed(() => {
  if (props.isTerminated && props.showTerminatedContent) return 'error';
  if (props.step.status === BDSOPStatus.COMPLETED) return 'success';
  if (props.step.status === BDSOPStatus.REMITTANCE) return 'processing';
  if (props.step.status === BDSOPStatus.RECOVER) return 'warning';
  return 'default';
});
</script>

<template>
  <Card :bordered="false" class="min-h-[360px] rounded-2xl shadow-sm">
    <Space direction="vertical" :size="20" class="w-full">
      <Space class="flex w-full items-start justify-between" wrap>
        <div>
          <div class="text-xl font-semibold text-foreground">
            {{ placeholderMeta.title }}
          </div>
          <div class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {{ placeholderMeta.description }}
          </div>
        </div>
        <Space wrap>
          <Tag :color="statusTagColor"> SOP #{{ sopId }} </Tag>
          <Tag :color="hasBudget ? 'blue' : 'default'">
            {{
              hasBudget
                ? $t('page.bd.sop.detail.budget-tag')
                : $t('page.bd.sop.detail.no-budget-tag')
            }}
          </Tag>
        </Space>
      </Space>

      <Row :gutter="[16, 16]">
        <Col :lg="14" :span="24">
          <Card size="small" class="h-full rounded-2xl border border-border">
            <template #title>
              <span class="text-sm font-semibold text-foreground">
                {{ placeholderMeta.leftTitle }}
              </span>
            </template>
            <div class="min-h-[180px] text-sm leading-6 text-muted-foreground">
              {{ placeholderMeta.leftBody }}
            </div>
          </Card>
        </Col>
        <Col :lg="10" :span="24">
          <Card size="small" class="h-full rounded-2xl border border-border">
            <template #title>
              <span class="text-sm font-semibold text-foreground">
                {{ placeholderMeta.rightTitle }}
              </span>
            </template>
            <div class="min-h-[180px] text-sm leading-6 text-muted-foreground">
              {{ placeholderMeta.rightBody }}
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  </Card>
</template>
