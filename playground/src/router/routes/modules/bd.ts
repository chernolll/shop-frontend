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
          authority: [RoleEnum.BD],
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
      // 任务中心（BD用）- 整合任务广场 + 我的任务
      {
        name: 'BD-TaskCenter',
        path: '/bd/task-center',
        component: () => import('#/views/bd/task-center/index.vue'),
        meta: {
          icon: 'lucide:layout-grid',
          title: '任务中心',
          authority: [RoleEnum.BD],
        },
      },
      // 我的任务（BD用）- 旧版，保留兼容
      // {
      //   name: 'BD-MyTasks',
      //   path: '/bd/my-tasks',
      //   component: () => import('#/views/bd/my-tasks/index.vue'),
      //   meta: {
      //     icon: 'lucide:inbox',
      //     title: $t('page.bd.my-task.title'),
      //     authority: [RoleEnum.BD],
      //   },
      // },
      // {
      //   name: 'BD-Kols',
      //   path: '/bd/kols',
      //   component: () => import('#/views/bd/kols/index.vue'),
      //   meta: {
      //     icon: 'lucide:users-round',
      //     title: $t('page.bd.kols.title'),
      //     authority: [RoleEnum.BD],
      //   },
      // },
      // {
      //   name: 'BD-KolLibrary',
      //   path: '/bd/kol-library',
      //   component: () => import('#/views/bd/kol-library/index.vue'),
      //   meta: {
      //     icon: 'lucide:library',
      //     title: $t('page.bd.kolLibrary.title'),
      //     authority: [RoleEnum.BD],
      //   },
      // },
      // {
      //   name: 'BD-Videos',
      //   path: '/bd/videos',
      //   component: () => import('#/views/bd/videos/index.vue'),
      //   meta: {
      //     icon: 'lucide:clapperboard',
      //     title: $t('page.bd.videos.title'),
      //     authority: [RoleEnum.BD],
      //   },
      // },
      // 达人筹备（独立页面）
      {
        name: 'BD-KolPrepare',
        path: '/bd/kol-prepare',
        component: () => import('#/views/bd/kol-prepare/index.vue'),
        meta: {
          icon: 'lucide:user-round-pen',
          title: '达人筹备',
          authority: [RoleEnum.BD],
        },
      },
      // 兼容旧路由 /bd/kols → 达人池
      {
        name: 'BD-Kols-Legacy',
        path: '/bd/kols',
        redirect: '/bd/kol-pool',
        meta: {
          hideInMenu: true,
          hideInTab: true,
          authority: [RoleEnum.BD],
        },
      },
      // 达人池（BD 查看并认领）
      {
        name: 'BD-KolPool',
        path: '/bd/kol-pool',
        component: () => import('#/views/bd/kol-pool/index.vue'),
        meta: {
          icon: 'lucide:layout-grid',
          title: '达人池',
          authority: [RoleEnum.BD],
        },
      },
      {
        name: 'BD-SOP',
        path: '/bd/sop',
        meta: {
          icon: 'lucide:workflow',
          title: $t('page.bd.sop.title'),
          authority: [RoleEnum.BD],
        },
        children: [
          {
            name: 'BD-SOP-LIST',
            path: '/bd/sop/list',
            component: () => import('#/views/bd/sop/index.vue'),
            meta: {
              authority: [RoleEnum.BD],
              icon: 'lucide:list-check',
              title: $t('page.bd.sop.list-title'),
            },
          },
          {
            name: 'BD-SOP-DETAIL',
            path: '/bd/sop/:sop_id',
            component: () => import('#/views/bd/sop/detail/index.vue'),
            meta: {
              hideInMenu: true,
              hideInTab: true,
              title: $t('page.bd.sop.detail-title'),
              activeMenu: '/bd/sop/list',
              authority: [RoleEnum.BD],
            },
          },
        ],
      },
    ],
  },
];

export default routes;
