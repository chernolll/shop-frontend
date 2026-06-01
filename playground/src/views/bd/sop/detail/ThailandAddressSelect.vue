<script lang="ts" setup>
import type { ThailandApi } from '#/api/common/thailand';

import { ref, watch } from 'vue';

import { Input, Select } from 'ant-design-vue';

import {
  getThailandDistricts,
  getThailandPostcodes,
} from '#/api/common/thailand';
import { $t } from '#/locales';

export interface ThailandAddress {
  city?: string;
  contact_name?: string;
  contact_phone?: string;
  detail_address?: string;
  district?: string;
  postcode?: string;
  province?: string;
}

const props = withDefaults(
  defineProps<{
    labelPrefix?: string;
    modelValue?: ThailandAddress;
  }>(),
  {
    labelPrefix: 'page.bd.sop.detail.sample',
    modelValue: () => ({}),
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: ThailandAddress];
}>();

// ---- postcodes ----
const postcodesLoading = ref(false);
const postcodesLoaded = ref(false);
const postcodesError = ref('');
const postcodeOptions = ref<{ label: string; value: string }[]>([]);

// ---- districts ----
const districtsLoading = ref(false);
const districtsError = ref('');
const districtOptions = ref<{ label: string; value: string }[]>([]);

// ---- local selections ----
const selectedPostcode = ref<string | undefined>(props.modelValue?.postcode);
const selectedDistrict = ref<string | undefined>(props.modelValue?.district);
const localCity = ref<string>(props.modelValue?.city ?? '');
const localProvince = ref<string>(props.modelValue?.province ?? '');
const localDetailAddress = ref<string>(props.modelValue?.detail_address ?? '');
const localContactName = ref<string>(props.modelValue?.contact_name ?? '');
const localContactPhone = ref<string>(props.modelValue?.contact_phone ?? '');

const districtMap = ref<Map<string, ThailandApi.DistrictInfo>>(new Map());

function buildValue(): ThailandAddress {
  return {
    city: localCity.value || undefined,
    contact_name: localContactName.value || undefined,
    contact_phone: localContactPhone.value || undefined,
    detail_address: localDetailAddress.value || undefined,
    district: selectedDistrict.value,
    postcode: selectedPostcode.value,
    province: localProvince.value || undefined,
  };
}

function emitValue() {
  emit('update:modelValue', buildValue());
}

// ---- load postcodes ----
async function loadPostcodes() {
  if (postcodesLoaded.value || postcodesLoading.value) {
    return;
  }
  try {
    postcodesLoading.value = true;
    postcodesError.value = '';
    const result = await getThailandPostcodes();
    postcodeOptions.value = (result.postcodes ?? []).map((pc) => ({
      label: pc,
      value: pc,
    }));
    postcodesLoaded.value = true;
  } catch (error: any) {
    postcodesError.value =
      error?.response?.data?.message ??
      error?.message ??
      $t(`${props.labelPrefix}.postcodes-load-failed`);
  } finally {
    postcodesLoading.value = false;
  }
}

// ---- load districts ----
async function loadDistricts(postcode: string) {
  try {
    districtsLoading.value = true;
    districtsError.value = '';
    districtOptions.value = [];
    districtMap.value = new Map();
    const result = await getThailandDistricts(postcode);
    const districts = result.districts ?? [];
    districtOptions.value = districts.map((d) => ({
      label: d.name,
      value: d.name,
    }));
    for (const d of districts) {
      districtMap.value.set(d.name, d);
    }
  } catch (error: any) {
    districtsError.value =
      error?.response?.data?.message ??
      error?.message ??
      $t(`${props.labelPrefix}.districts-load-failed`);
    districtOptions.value = [];
  } finally {
    districtsLoading.value = false;
  }
}

// ---- handlers ----
function onPostcodeChange(value: any) {
  const pc = typeof value === 'string' ? value : undefined;
  selectedPostcode.value = pc;
  selectedDistrict.value = undefined;
  localCity.value = '';
  localProvince.value = '';
  districtOptions.value = [];
  districtMap.value = new Map();
  districtsError.value = '';

  if (pc) {
    loadDistricts(pc);
  }
  emitValue();
}

function onDistrictChange(value: any) {
  const district = typeof value === 'string' ? value : undefined;
  selectedDistrict.value = district;
  const info = district ? districtMap.value.get(district) : undefined;
  localCity.value = info?.city ?? '';
  localProvince.value = info?.province ?? '';
  emitValue();
}

function onDetailFieldChange() {
  emitValue();
}

// ---- filter postcode ----
function filterPostcode(input: string, option: any) {
  return (option?.label ?? '').startsWith(input);
}

// ---- init ----
loadPostcodes();

// Sync external modelValue changes back in
watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    if (val.postcode !== selectedPostcode.value) {
      selectedPostcode.value = val.postcode;
      if (val.postcode) loadDistricts(val.postcode);
    }
    if (val.district !== selectedDistrict.value) {
      selectedDistrict.value = val.district;
    }
    localCity.value = val.city ?? '';
    localProvince.value = val.province ?? '';
    localDetailAddress.value = val.detail_address ?? '';
    localContactName.value = val.contact_name ?? '';
    localContactPhone.value = val.contact_phone ?? '';
  },
  { deep: true },
);
</script>

<template>
  <div class="space-y-4">
    <!-- 邮编 -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.postcode-label`) }}
      </div>
      <Select
        :value="selectedPostcode"
        show-search
        :filter-option="filterPostcode"
        :loading="postcodesLoading"
        :not-found-content="
          postcodesLoading
            ? $t(`${props.labelPrefix}.loading`)
            : postcodesError
              ? postcodesError
              : $t(`${props.labelPrefix}.no-postcodes`)
        "
        :options="postcodeOptions"
        :placeholder="$t(`${props.labelPrefix}.postcode-placeholder`)"
        class="w-full"
        @change="onPostcodeChange"
      />
    </div>

    <!-- 区 -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.district-label`) }}
      </div>
      <Select
        :value="selectedDistrict"
        :disabled="!selectedPostcode || districtsLoading"
        :loading="districtsLoading"
        :not-found-content="
          districtsLoading
            ? $t(`${props.labelPrefix}.loading`)
            : districtsError
              ? districtsError
              : $t(`${props.labelPrefix}.no-districts`)
        "
        :options="districtOptions"
        :placeholder="$t(`${props.labelPrefix}.district-placeholder`)"
        class="w-full"
        @change="onDistrictChange"
      />
    </div>

    <!-- 市（只读） -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.city-label`) }}
      </div>
      <Input
        :value="localCity"
        disabled
        :placeholder="$t(`${props.labelPrefix}.city-placeholder`)"
      />
    </div>

    <!-- 省/府（只读） -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.province-label`) }}
      </div>
      <Input
        :value="localProvince"
        disabled
        :placeholder="$t(`${props.labelPrefix}.province-placeholder`)"
      />
    </div>

    <!-- 详细地址 -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.detail-address-label`) }}
      </div>
      <Input.TextArea
        :value="localDetailAddress"
        :auto-size="{ minRows: 2, maxRows: 4 }"
        :placeholder="$t(`${props.labelPrefix}.detail-address-placeholder`)"
        @input="
          localDetailAddress = ($event?.target as any)?.value ?? '';
          onDetailFieldChange();
        "
      />
    </div>

    <!-- 联系人 -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.contact-name-label`) }}
      </div>
      <Input
        :value="localContactName"
        :placeholder="$t(`${props.labelPrefix}.contact-name-placeholder`)"
        @input="
          localContactName = ($event?.target as any)?.value ?? '';
          onDetailFieldChange();
        "
      />
    </div>

    <!-- 联系电话 -->
    <div class="space-y-2">
      <div class="text-sm font-medium text-foreground">
        {{ $t(`${props.labelPrefix}.contact-phone-label`) }}
      </div>
      <Input
        :value="localContactPhone"
        :placeholder="$t(`${props.labelPrefix}.contact-phone-placeholder`)"
        @input="
          localContactPhone = ($event?.target as any)?.value ?? '';
          onDetailFieldChange();
        "
      />
    </div>
  </div>
</template>
