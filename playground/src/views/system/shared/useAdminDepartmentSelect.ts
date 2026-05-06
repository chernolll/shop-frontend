import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { getAdminDepartmentList } from '#/api/system/admin-department';

interface DepartmentSelectOption {
  label: string;
  value: number;
}

export function useAdminDepartmentSelect() {
  const loading = ref(false);
  const options = ref<DepartmentSelectOption[]>([]);

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const keyword = search.trim();
      const result = await getAdminDepartmentList({
        code: keyword || undefined,
        name: keyword || undefined,
        page: 1,
        page_size: 100,
      });
      options.value = result.list.map((item) => ({
        label: `${item.name} (${item.code})`,
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
