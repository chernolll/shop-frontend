import type { RouteRecordRaw } from 'vue-router';

import { RoleEnum } from '#/consts/role';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:clapperboard',
      order: 1040,
      title: $t('page.video.title'),
      authority: [RoleEnum.ADMIN],
    },
    name: 'Video',
    path: '/video',
    children: [
      {
        name: 'Video-List',
        path: '/video/list',
        component: () => import('#/views/video/index.vue'),
        meta: {
          icon: 'lucide:video',
          title: $t('page.video.list-title'),
          authority: [RoleEnum.ADMIN],
        },
      },
    ],
  },
];

export default routes;
