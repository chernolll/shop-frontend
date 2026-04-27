import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:handshake',
      order: 1000,
      title: $t('page.bd.title'),
      authority: [RoleEnum.ADMIN, RoleEnum.BD],
    },
    name: 'BD',
    path: '/bd',
    children: [
      {
        name: 'BD-Analytics',
        path: '/bd/analytics',
        component: () => import('#/views/bd/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.bd.dashboard'),
          authority: [RoleEnum.ADMIN, RoleEnum.BD],
        },
      },
      {
        name: 'BD-Tasks',
        path: '/bd/tasks',
        component: () => import('#/views/bd/tasks/index.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: $t('page.bd.tasks'),
        },
      },
      {
        name: 'BD-Task-Progress',
        path: '/bd/task-progress',
        component: () => import('#/views/bd/task-progress/index.vue'),
        meta: {
          icon: 'lucide:chart-column-big',
          title: $t('page.bd.taskProgress'),
        },
      },
    ],
  },
];

export default routes;
