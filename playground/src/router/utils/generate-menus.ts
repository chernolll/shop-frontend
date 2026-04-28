import type { Router, RouteRecordRaw } from 'vue-router';

import { filterTree, mapTree, sortTree } from './tree-utils';

/** 菜单节点 */
interface MenuRecordRaw {
  activeIcon?: string;
  badge?: string;
  badgeType?: string;
  badgeVariants?: string;
  children?: MenuRecordRaw[];
  icon?: string;
  name: string;
  order?: number;
  parent?: string;
  parents?: string[];
  path: string;
  query?: Record<string, string>;
  show: boolean;
}

type RouteMeta = RouteRecordRaw['meta'] & {
  activeIcon?: string;
  badge?: string;
  badgeType?: string;
  badgeVariants?: string;
  hideChildrenInMenu?: boolean;
  icon?: string;
  link?: string;
  order?: number;
  query?: Record<string, string>;
};

/**
 * 根据 routes 生成菜单列表
 */
function generateMenus(
  routes: RouteRecordRaw[],
  router: Router,
): MenuRecordRaw[] {
  const finalRoutesMap: Record<string, string> = Object.fromEntries(
    router.getRoutes().map(({ name, path }) => [name, path]),
  );

  let menus = mapTree<RouteRecordRaw, MenuRecordRaw>(routes, (route) => {
    const path = finalRoutesMap[route.name as string] ?? route.path ?? '';

    const meta = (route.meta ?? {}) as RouteMeta;
    const { redirect, children = [] } = route;
    const {
      activeIcon,
      badge,
      badgeType,
      badgeVariants,
      hideChildrenInMenu = false,
      icon,
      link,
      order,
      title,
      query,
    } = meta;

    const name = (title || (route.name as string) || '') as string;

    const resultChildren = hideChildrenInMenu
      ? []
      : ((children as unknown as MenuRecordRaw[]) ?? []);

    if (resultChildren.length > 0) {
      const extRoute = route as RouteRecordRaw & { parents?: string[] };
      resultChildren.forEach((child) => {
        child.parents = [...(extRoute.parents ?? []), path];
        child.parent = path;
      });
    }

    const resultPath = hideChildrenInMenu ? redirect || path : link || path;

    return {
      activeIcon,
      badge,
      badgeType,
      badgeVariants,
      icon,
      name,
      query,
      order,
      parent: (route as unknown as Record<string, unknown>).parent as
        | string
        | undefined,
      parents: (route as unknown as Record<string, unknown>).parents as
        | string[]
        | undefined,
      path: resultPath as string,
      show: !meta?.hideInMenu,
      children: resultChildren,
    };
  });

  menus = sortTree(menus, (a, b) => (a?.order ?? 999) - (b?.order ?? 999));

  return filterTree(menus, (menu) => menu.show);
}

export { generateMenus };
export type { MenuRecordRaw };
