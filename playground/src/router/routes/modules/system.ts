import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ion:settings-outline',
      order: 1030,
      title: $t('system.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'System',
    path: '/system',
    children: [
      {
        path: '/system/departments',
        name: 'SystemDepartments',
        meta: {
          icon: 'charm:organisation',
          title: $t('system.department.title'),
          authority: [RoleEnum.ADMIN],
        },
        component: () => import('#/views/system/department/index.vue'),
      },
      {
        path: '/system/employees',
        name: 'SystemEmployees',
        meta: {
          icon: 'mdi:card-account-details-outline',
          title: $t('system.employee.title'),
          authority: [RoleEnum.ADMIN],
        },
        component: () => import('#/views/system/employee/index.vue'),
      },
      {
        path: '/system/bd-persons',
        name: 'SystemBdPersons',
        meta: {
          icon: 'lucide:badge-plus',
          title: $t('system.bdPerson.title'),
          authority: [RoleEnum.ADMIN],
        },
        component: () => import('#/views/system/bd-person/index.vue'),
      },
      {
        path: '/system/shops',
        name: 'SystemShops',
        meta: {
          icon: 'lucide:store',
          title: $t('system.shop.title'),
          authority: [RoleEnum.ADMIN],
        },
        component: () => import('#/views/system/shop/index.vue'),
      },
    ],
  },
];

export default routes;
