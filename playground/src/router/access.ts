import type {
  ComponentRecordType,
  GenerateAccessOptions,
} from './dynamic-access';
import type { RouteRecordStringComponent } from './utils';

import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

import { generateAccess as generateAccessCore } from './dynamic-access';

async function generateAccess(
  options: Omit<
    GenerateAccessOptions,
    | 'fetchMenuListAsync'
    | 'forbiddenComponent'
    | 'layoutMap'
    | 'mode'
    | 'pageMap'
  >,
) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return generateAccessCore({
    ...options,
    forbiddenComponent: () => import('#/views/_core/fallback/forbidden.vue'),
    layoutMap,
    mode: preferences.app.accessMode,
    pageMap,
    fetchMenuListAsync: async (): Promise<RouteRecordStringComponent[]> => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      return (await getAllMenusApi()) as RouteRecordStringComponent[];
    },
  });
}

export { generateAccess };
