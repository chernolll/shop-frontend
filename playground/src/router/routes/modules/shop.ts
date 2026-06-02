import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:store',
      order: 1025,
      title: $t('page.shop.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'Shop',
    path: '/shop',
    children: [
      {
        path: '/shop/list',
        name: 'ShopList',
        component: () => import('#/views/system/shop/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.shop.list'),
        },
      },
    ],
  },
];

export default routes;
