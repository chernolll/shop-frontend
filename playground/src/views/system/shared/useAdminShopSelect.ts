import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { getAdminShopList } from '#/api/system/admin-shop';
import { $t } from '#/locales';

interface ShopSelectOption {
  label: string;
  value: number;
}

export function useAdminShopSelect() {
  const loading = ref(false);
  const options = ref<ShopSelectOption[]>([]);

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const keyword = search.trim();
      const result = await getAdminShopList({
        shop_name: keyword || undefined,
        platform_shop_id: keyword || undefined,
        page: 1,
        page_size: 200,
      });
      options.value = result.list.map((item) => ({
        label: `${item.shop_name} (${item.platform_shop_id})`,
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
    placeholder: $t('page.shop.form.shop-name-placeholder'),
    showSearch: true,
  }));

  return { componentProps, loadOptions };
}
