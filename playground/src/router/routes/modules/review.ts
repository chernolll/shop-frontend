import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:clipboard-check',
      order: 1010,
      title: $t('page.review.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'Review',
    path: '/review',
    children: [
      {
        name: 'Review-KolPrepare',
        path: '/review/kol-prepare',
        component: () => import('#/views/review/kol-prepare/index.vue'),
        meta: {
          icon: 'lucide:file-search',
          title: $t('page.review.kolPrepare.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
      {
        name: 'Review-KolPrepare-Detail',
        path: '/review/kol-prepare/:task_id',
        component: () => import('#/views/review/kol-prepare/detail.vue'),
        meta: {
          hideInMenu: true,
          hideInTab: true,
          title: $t('page.review.kolPrepare.detail-title'),
          activeMenu: '/review/kol-prepare',
          authority: [RoleEnum.ADMIN],
        },
      },
      {
        name: 'Review-Remittance',
        path: '/review/remittance',
        component: () => import('#/views/review/remittance/index.vue'),
        meta: {
          icon: 'lucide:wallet-cards',
          title: $t('page.review.remittance.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
