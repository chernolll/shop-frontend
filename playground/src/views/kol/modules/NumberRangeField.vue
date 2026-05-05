<script lang="ts" setup>
import { computed } from 'vue';

import { InputNumber, Space } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    max?: number;
    min?: number;
    modelValue?: Array<number | string | undefined>;
    placeholderEnd?: string;
    placeholderStart?: string;
    precision?: number;
  }>(),
  {
    max: undefined,
    min: 0,
    modelValue: () => [undefined, undefined],
    placeholderEnd: '',
    placeholderStart: '',
    precision: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [Array<number | string | undefined>];
}>();

const currentValue = computed(() => {
  const source = Array.isArray(props.modelValue) ? props.modelValue : [];
  return [source[0], source[1]];
});

function updateValue(index: 0 | 1, value: null | number | string) {
  const nextValue = [...currentValue.value];
  nextValue[index] = value ?? undefined;
  emit('update:modelValue', nextValue);
}
</script>

<template>
  <Space.Compact block>
    <InputNumber
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderStart"
      :value="currentValue[0] as any"
      class="w-full"
      @update:value="(value) => updateValue(0, value)"
    />
    <InputNumber
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderEnd"
      :value="currentValue[1] as any"
      class="w-full"
      @update:value="(value) => updateValue(1, value)"
    />
  </Space.Compact>
</template>
