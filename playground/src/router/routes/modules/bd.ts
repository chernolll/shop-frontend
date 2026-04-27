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
      // 任务管理 admin 使用
      {
        name: 'BD-Tasks',
        path: '/bd/tasks',
        component: () => import('#/views/bd/tasks/index.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: $t('page.bd.tasks'),
          authority: [RoleEnum.ADMIN],
        },
      },
      // ⭐ 关键：我接收的任务（BD用）
      {
        name: 'BD-MyTasks',
        path: '/bd/my-tasks',
        component: () => import('#/views/bd/my-tasks/index.vue'),
        meta: {
          title: '我的任务',
          icon: 'lucide:inbox',
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

      {
        name: 'BD-SOP',
        path: '/bd/sop',
        meta: {
          icon: 'lucide:workflow',
          title: $t('page.bd.sop.title'),
        },
        children: [
          {
            name: 'BD-SOP-LIST',
            path: '/bd/sop/list',
            component: () => import('#/views/bd/sop/index.vue'),
            meta: {
              icon: 'lucide:list-check',
              title: $t('page.bd.sop.list-title'),
            },
          },
          {
            name: 'BD-SOP-DETAIL',
            path: '/bd/sop/detail/:id',
            component: () => import('#/views/bd/sop/detail/index.vue'),
            meta: {
              hideInMenu: true,
              title: $t('page.bd.sop.list-title'),
              activeMenu: '/bd/sop/list',
            },
          },
        ],
      },
    ],
  },
];

export default routes;
