<script lang="ts" setup>
import { ref, watch } from 'vue';

import { InputNumber, Space } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    max?: number;
    min?: number;
    placeholderEnd?: string;
    placeholderStart?: string;
    precision?: number;
    value?: Array<number | string | undefined>;
  }>(),
  {
    max: undefined,
    min: 0,
    placeholderEnd: '',
    placeholderStart: '',
    precision: 0,
    value: undefined,
  },
);

const emit = defineEmits(['blur', 'change', 'update:value']);

const startValue = ref<number | string | undefined>(undefined);
const endValue = ref<number | string | undefined>(undefined);
const startInputKey = ref(0);
const endInputKey = ref(0);
const startInputRef = ref();
const endInputRef = ref();

function isEmptyRangeValue(value: unknown) {
  if (!Array.isArray(value)) {
    return true;
  }

  return value.every(
    (item) => item === null || item === '' || item === undefined,
  );
}

watch(
  () => props.value,
  (value, previousValue) => {
    const nextValue = Array.isArray(value) ? value : [];
    startValue.value = nextValue[0];
    endValue.value = nextValue[1];

    if (previousValue !== undefined && isEmptyRangeValue(value)) {
      startInputKey.value += 1;
      endInputKey.value += 1;
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

function normalizeValue(index: 0 | 1, value: null | number | string) {
  const nextValue = [startValue.value, endValue.value];
  nextValue[index] = value ?? undefined;
  startValue.value = nextValue[0];
  endValue.value = nextValue[1];
  emit('update:value', nextValue);
  emit('change', nextValue);
}

function isEmptyValue(value: null | number | string | undefined) {
  return value === null || value === '' || value === undefined;
}

function getInputText(inputRef: any) {
  const element = inputRef?.$el as HTMLElement | undefined;
  return element?.querySelector('input')?.value ?? '';
}

function remountInput(index: 0 | 1) {
  if (index === 0) {
    startInputKey.value += 1;
    return;
  }

  endInputKey.value += 1;
}

function handleBlur(index: 0 | 1) {
  emit('blur');

  window.setTimeout(() => {
    const currentValue = index === 0 ? startValue.value : endValue.value;
    const currentInputRef =
      index === 0 ? startInputRef.value : endInputRef.value;
    const hasDraftText = !!getInputText(currentInputRef);

    if (isEmptyValue(currentValue) && hasDraftText) {
      remountInput(index);
    }
  }, 0);
}
</script>

<template>
  <Space.Compact block>
    <InputNumber
      :key="startInputKey"
      ref="startInputRef"
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderStart"
      :value="startValue as any"
      class="w-full"
      @blur="handleBlur(0)"
      @update:value="(value) => normalizeValue(0, value)"
    />
    <InputNumber
      :key="endInputKey"
      ref="endInputRef"
      :max="max"
      :min="min"
      :precision="precision"
      :placeholder="placeholderEnd"
      :value="endValue as any"
      class="w-full"
      @blur="handleBlur(1)"
      @update:value="(value) => normalizeValue(1, value)"
    />
  </Space.Compact>
</template>
