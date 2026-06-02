import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:package-search',
      order: 1015,
      title: $t('page.sample.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'Sample',
    path: '/sample',
    children: [
      {
        path: '/sample/dashboard',
        name: 'SampleDashboard',
        component: () => import('#/views/sample/dashboard/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: $t('page.sample.dashboard-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
      {
        path: '/sample/list',
        name: 'SampleList',
        component: () => import('#/views/sample/list/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.sample.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
