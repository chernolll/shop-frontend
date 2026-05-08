import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { AdminProductApi, getAdminSkuList } from '#/api/product';
import { $t } from '#/locales';

interface SkuOption {
  label: string;
  value: number;
}

function getSkuStatusText(status?: number) {
  return status === AdminProductApi.Status.ON_SALE
    ? $t('page.product.common.status.on-sale')
    : $t('page.product.common.status.off-shelf');
}

export function useAdminMainSkuSelect() {
  const loading = ref(false);
  const options = ref<SkuOption[]>([]);

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const keyword = search.trim();
      const result = await getAdminSkuList({
        brand: keyword || undefined,
        page: 1,
        page_size: 100,
        sku_code: keyword || undefined,
        sku_name: keyword || undefined,
        sku_type: AdminProductApi.SkuType.SINGLE,
      });
      options.value = result.list.map((item) => ({
        label: `${item.sku_code} / ${item.sku_name} / ${item.brand} (${getSkuStatusText(item.status)})`,
        value: item.id,
      }));
    } finally {
      loading.value = false;
    }
  }

  const handleSearch = useDebounceFn((value: string) => {
    void loadOptions(value);
  }, 300);

  const componentProps = computed(() => ({
    allowClear: true,
    filterOption: false,
    loading: loading.value,
    onDropdownVisibleChange: (open: boolean) => {
      if (open) {
        void loadOptions();
      }
    },
    onSearch: handleSearch,
    options: options.value,
    showSearch: true,
  }));

  return {
    componentProps,
    loadOptions,
    options,
  };
}
