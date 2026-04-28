import type { RouteRecordRaw } from 'vue-router';

import { filterTree, mapTree } from './tree-utils';

async function generateRoutesByFrontend(
  routes: RouteRecordRaw[],
  roles: string[],
  permissions: string[],
  forbiddenComponent?: RouteRecordRaw['component'],
): Promise<RouteRecordRaw[]> {
  const finalRoutes = filterTree(routes, (route) => {
    return hasAuthority({
      route,
      access: roles,
      accessPermissions: permissions,
    });
  });

  if (!forbiddenComponent) {
    return finalRoutes;
  }

  return mapTree(finalRoutes, (route) => {
    if (menuHasVisibleWithForbidden(route)) {
      route.component = forbiddenComponent;
    }
    return route;
  });
}

/** 检查用户的 roles 是否命中路由 meta.authority */
function hasAuthority(config: {
  access: string[];
  accessPermissions?: string[];
  route: RouteRecordRaw;
}): boolean {
  const { route, access, accessPermissions = [] } = config;
  const authority = (route.meta?.authority as string[]) || [];
  const permissions = (route.meta?.permissions as string[]) || [];
  if (authority.length === 0 && permissions.length === 0) {
    return true;
  }
  if (permissions.length > 0) {
    return permissions.some((p) => accessPermissions.includes(p));
  }
  return access.some((value) => authority.includes(value));
}

function menuHasVisibleWithForbidden(route: RouteRecordRaw): boolean {
  return (
    !!route.meta?.authority &&
    Reflect.has(route.meta || {}, 'menuVisibleWithForbidden') &&
    !!route.meta?.menuVisibleWithForbidden
  );
}

export { generateRoutesByFrontend, hasAuthority };
