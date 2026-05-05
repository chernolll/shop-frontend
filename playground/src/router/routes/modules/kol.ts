import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users-round',
      order: 1020,
      title: $t('page.kol.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'KOL',
    path: '/kol',
    children: [
      {
        name: 'KOL-List',
        path: '/kol/list',
        component: () => import('#/views/kol/index.vue'),
        meta: {
          icon: 'lucide:user-round-search',
          title: $t('page.kol.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
      {
        name: 'KOL-Detail',
        path: '/kol/:kol_id',
        component: () => import('#/views/kol/detail.vue'),
        meta: {
          hideInMenu: true,
          hideInTab: true,
          title: $t('page.kol.detail-title'),
          activeMenu: '/kol/list',
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
