import type { Component, DefineComponent } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

import { mapTree } from './tree-utils';

/** 后端返回的菜单路由结构 */
interface RouteRecordStringComponent extends Record<string, unknown> {
  children?: RouteRecordStringComponent[];
  component?: string;
  meta?: Record<string, unknown>;
  name?: string;
  path?: string;
  redirect?: string;
}

type ComponentRecordType = Record<string, Component | DefineComponent>;

async function generateRoutesByBackend(
  fetchMenuListAsync: () => Promise<RouteRecordStringComponent[]>,
  layoutMap: ComponentRecordType = {},
  pageMap: ComponentRecordType = {},
  forbiddenComponent?: RouteRecordRaw['component'],
): Promise<RouteRecordRaw[]> {
  const menuRoutes = await fetchMenuListAsync();
  if (!menuRoutes) {
    return [];
  }

  const normalizePageMap: ComponentRecordType = {};
  for (const [key, value] of Object.entries(pageMap)) {
    normalizePageMap[normalizeViewPath(key)] = value;
  }

  let routes = convertRoutes(menuRoutes, layoutMap, normalizePageMap);

  if (forbiddenComponent) {
    routes = mapTree(routes, (route) => {
      if (menuHasVisibleWithForbidden(route)) {
        route.component = forbiddenComponent;
      }
      return route;
    });
  }

  return routes;
}

function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component, name } = node;

    if (!name) {
      console.error('route name is required', route);
    }

    if (component && layoutMap[component]) {
      route.component = layoutMap[component];
    } else if (component) {
      const normalizePath = normalizeViewPath(component);
      const pageKey = normalizePath.endsWith('.vue')
        ? normalizePath
        : `${normalizePath}.vue`;
      if (pageMap[pageKey]) {
        route.component = pageMap[pageKey];
      } else {
        console.error(`route component is invalid: ${pageKey}`, route);
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
    }

    return route;
  });
}

function normalizeViewPath(path: string): string {
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;
  return viewPath.replace(/^\/views/, '');
}

function menuHasVisibleWithForbidden(route: RouteRecordRaw): boolean {
  return !!route.meta?.menuVisibleWithForbidden;
}

export { generateRoutesByBackend };
export type { RouteRecordStringComponent };
