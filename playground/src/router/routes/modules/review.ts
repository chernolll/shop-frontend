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
        name: 'Review-Budget',
        path: '/review/budget',
        component: () => import('#/views/review/budget/index.vue'),
        meta: {
          icon: 'lucide:badge-dollar-sign',
          title: $t('page.review.budget.list-title'),
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
      {
        name: 'Review-TaskKol',
        path: '/review/task-kol',
        component: () => import('#/views/review/task-kol/index.vue'),
        meta: {
          icon: 'lucide:user-check',
          title: 'SOP审核',
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
