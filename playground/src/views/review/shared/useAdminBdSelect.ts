import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import { AdminTaskApi, getAdminBdList } from '#/api/bd/tasks';
import { $t } from '#/locales';

interface BdSelectOption {
  label: string;
  value: string;
}

export function useAdminBdSelect() {
  const loading = ref(false);
  const options = ref<BdSelectOption[]>([]);

  function getBdStatusText(status?: number) {
    return status === AdminTaskApi.BdStatus.LEFT
      ? $t('page.bd.task-center.bd-status.left')
      : $t('page.bd.task-center.bd-status.active');
  }

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const result = await getAdminBdList({
        bd_code: search.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      options.value = result.list.map((item) => ({
        label: `${item.bd_code} (${getBdStatusText(item.status)})`,
        value: item.bd_code,
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
