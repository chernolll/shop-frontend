import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { getAdminPostList } from '#/api/system/admin-post';

interface PostSelectOption {
  label: string;
  value: number;
}

export function useAdminPostSelect() {
  const loading = ref(false);
  const options = ref<PostSelectOption[]>([]);

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const keyword = search.trim();
      const result = await getAdminPostList({
        name: keyword || undefined,
        page: 1,
        page_size: 100,
      });
      options.value = result.list.map((item) => ({
        label: item.name,
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
  };
}
