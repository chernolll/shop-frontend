import { computed, ref } from 'vue';

import { useDebounceFn } from '@vueuse/core';

import {
  AdminEmployeeApi,
  getAdminEmployeeList,
} from '#/api/system/admin-employee';

interface EmployeeSelectOption {
  label: string;
  value: number;
}

export function useAdminEmployeeSelect(
  status: AdminEmployeeApi.Status = AdminEmployeeApi.Status.ACTIVE,
) {
  const employeeItems = ref<AdminEmployeeApi.EmployeeItem[]>([]);
  const loading = ref(false);
  const options = ref<EmployeeSelectOption[]>([]);

  async function loadOptions(search = '') {
    try {
      loading.value = true;
      const keyword = search.trim();
      const result = await getAdminEmployeeList({
        employee_no: keyword || undefined,
        name: keyword || undefined,
        page: 1,
        page_size: 100,
        status,
      });
      employeeItems.value = result.list;
      options.value = result.list.map((item) => ({
        label: `${item.employee_no} / ${item.display_name}`,
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
    employeeItems,
    loadOptions,
  };
}
