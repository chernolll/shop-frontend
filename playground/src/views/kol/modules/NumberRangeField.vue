<script lang="ts" setup>
import { InputNumber, Space } from 'ant-design-vue';

withDefaults(
  defineProps<{
    max?: number;
    min?: number;
    placeholderEnd?: string;
    placeholderStart?: string;
    precision?: number;
  }>(),
  {
    max: undefined,
    min: 0,
    placeholderEnd: '',
    placeholderStart: '',
    precision: 0,
  },
);

const emit = defineEmits(['blur', 'change']);

const modelValue = defineModel<Array<number | string | undefined>>('value', {
  default: () => [undefined, undefined],
});

function normalizeValue(index: 0 | 1, value: null | number | string) {
  const nextValue = Array.isArray(modelValue.value)
    ? [...modelValue.value]
    : [undefined, undefined];
  nextValue[index] = value ?? undefined;
  modelValue.value = nextValue;
  emit('change', modelValue.value);
}
</script>

<template>
  <Space.Compact block>
    <InputNumber
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderStart"
      :value="modelValue?.[0] as any"
      class="w-full"
      @blur="emit('blur')"
      @change="(value) => normalizeValue(0, value)"
      @update:value="(value) => normalizeValue(0, value)"
    />
    <InputNumber
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderEnd"
      :value="modelValue?.[1] as any"
      class="w-full"
      @blur="emit('blur')"
      @change="(value) => normalizeValue(1, value)"
      @update:value="(value) => normalizeValue(1, value)"
    />
  </Space.Compact>
</template>
