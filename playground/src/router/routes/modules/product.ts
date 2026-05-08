import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:package-search',
      order: 1030,
      title: $t('page.product.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'Product',
    path: '/product',
    children: [
      {
        name: 'Product-Sku',
        path: '/product/sku',
        component: () => import('#/views/product/sku/index.vue'),
        meta: {
          icon: 'lucide:package',
          title: $t('page.product.sku.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
      {
        name: 'Product-Listing',
        path: '/product/listing',
        component: () => import('#/views/product/listing/index.vue'),
        meta: {
          icon: 'lucide:link',
          title: $t('page.product.listing.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
