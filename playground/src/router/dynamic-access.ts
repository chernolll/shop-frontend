import type { Component, DefineComponent } from 'vue';
import type { Router, RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw, RouteRecordStringComponent } from './utils';

import { defineComponent, h } from 'vue';

import { cloneDeep } from '@vben/utils';

import {
  generateMenus,
  generateRoutesByBackend,
  generateRoutesByFrontend,
  mapTree,
} from './utils';

type ComponentRecordType = Record<string, Component | DefineComponent>;

interface GenerateAccessOptions {
  /** 角色权限匹配函数（可自定义覆盖） */
  authorityCheck?: (route: RouteRecordRaw, roles: string[]) => boolean;
  /** 后端菜单获取函数（backend/mixed 模式需要） */
  fetchMenuListAsync?: () => Promise<RouteRecordStringComponent[]>;
  /** 403 禁止访问组件 */
  forbiddenComponent?: RouteRecordRaw['component'];
  /** 布局组件映射 */
  layoutMap?: ComponentRecordType;
  /** 访问模式：frontend | backend | mixed */
  mode?: 'backend' | 'frontend' | 'mixed';
  /** 页面组件映射 */
  pageMap?: ComponentRecordType;
  /** 权限列表 */
  permissions: string[];
  /** 用户角色标识 */
  roles: string[];
  /** Vue Router 实例 */
  router: Router;
  /** 前端定义的路由列表（用于 frontend/mixed 模式） */
  routes: RouteRecordRaw[];
}

/**
 * 生成可访问的路由和菜单
 *
 * 这是 @vben/access 的 generateAccessible 的本地实现，
 * 你可以在此处添加项目特定的权限判断逻辑。
 */
async function generateAccess(options: GenerateAccessOptions): Promise<{
  accessibleMenus: MenuRecordRaw[];
  accessibleRoutes: RouteRecordRaw[];
}> {
  const {
    router,
    routes: rawRoutes,
    roles,
    permissions,
    mode = 'frontend',
    fetchMenuListAsync,
    pageMap = {},
    layoutMap = {},
    forbiddenComponent,
  } = options;

  const routes = cloneDeep(rawRoutes);

  // 1. 根据模式生成路由
  const accessibleRoutes = await buildRoutes(mode, {
    routes,
    permissions,
    roles,
    fetchMenuListAsync,
    pageMap,
    layoutMap,
    forbiddenComponent,
  });

  // 2. 动态注册到 router
  const root = router.getRoutes().find((item) => item.path === '/');

  for (const route of accessibleRoutes) {
    if (root && !route.meta?.noBasicLayout) {
      // 如果已存在同名路由，则原地替换（支持用户切换时更新）
      const index = root.children?.findIndex(
        (item) => item.name === route.name,
      );
      if (index !== undefined && index !== -1 && root.children) {
        root.children[index] = route;
      } else {
        root.children?.push(route);
      }
    } else {
      router.addRoute(route);
    }
  }

  // 重新注册 root 路由（触发菜单侧边栏更新）
  if (root) {
    if (root.name) {
      router.removeRoute(root.name);
    }
    router.addRoute(root);
  }

  // 3. 生成菜单
  const accessibleMenus = generateMenus(accessibleRoutes, router);

  return { accessibleMenus, accessibleRoutes };
}

/**
 * 根据模式生成路由
 */
async function buildRoutes(
  mode: 'backend' | 'frontend' | 'mixed',
  opts: {
    fetchMenuListAsync?: () => Promise<RouteRecordStringComponent[]>;
    forbiddenComponent?: RouteRecordRaw['component'];
    layoutMap: ComponentRecordType;
    pageMap: ComponentRecordType;
    permissions: string[];
    roles: string[];
    routes: RouteRecordRaw[];
  },
): Promise<RouteRecordRaw[]> {
  const {
    routes,
    roles,
    permissions,
    fetchMenuListAsync,
    pageMap,
    layoutMap,
    forbiddenComponent,
  } = opts;

  let resultRoutes: RouteRecordRaw[] = [];

  switch (mode) {
    case 'backend': {
      if (!fetchMenuListAsync) {
        throw new Error('backend mode requires fetchMenuListAsync');
      }
      resultRoutes = await generateRoutesByBackend(
        fetchMenuListAsync,
        layoutMap,
        pageMap,
        forbiddenComponent,
      );
      break;
    }
    case 'frontend': {
      resultRoutes = await generateRoutesByFrontend(
        routes,
        roles,
        permissions,
        forbiddenComponent,
      );
      break;
    }
    case 'mixed': {
      const [frontendRoutes, backendRoutes] = await Promise.all([
        generateRoutesByFrontend(
          routes,
          roles,
          permissions,
          forbiddenComponent,
        ),
        fetchMenuListAsync
          ? generateRoutesByBackend(
              fetchMenuListAsync,
              layoutMap,
              pageMap,
              forbiddenComponent,
            )
          : Promise.resolve([] as RouteRecordRaw[]),
      ]);
      resultRoutes = mergeRoutesByName(backendRoutes, frontendRoutes);
      break;
    }
  }

  // 处理路由树：自动补充 redirect、keep-alive 支持
  resultRoutes = mapTree(resultRoutes, (route) => {
    // keep-alive 支持
    if (route.meta?.keepAlive && typeof route.component === 'function') {
      const originalLoader = route.component as () => Promise<{
        default: Component | DefineComponent;
      }>;
      route.component = async () => {
        const component = await originalLoader();
        if (!component.default) return component;
        return defineComponent({
          name: route.name as string,
          setup(props, { attrs, slots }) {
            return () =>
              h(component.default as Component, { ...props, ...attrs }, slots);
          },
        });
      };
    }

    // 非叶子节点自动补 redirect
    if (route.redirect || !route.children?.length) {
      return route;
    }
    const firstChild = route.children[0];
    if (!firstChild?.path?.startsWith('/')) {
      return route;
    }
    route.redirect = firstChild.path;
    return route;
  });

  return resultRoutes;
}

/**
 * 按 name 合并前后端路由（后端优先级更高）
 */
function mergeRoutesByName(
  baseRoutes: RouteRecordRaw[],
  extraRoutes: RouteRecordRaw[],
): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = [];
  const routeMap = new Map<string | symbol, RouteRecordRaw>();

  for (const route of baseRoutes) {
    const clone = { ...route };
    result.push(clone);
    if (clone.name) {
      routeMap.set(clone.name, clone);
    }
  }

  for (const route of extraRoutes) {
    if (route.name && routeMap.has(route.name)) {
      const existing = routeMap.get(route.name);
      if (!existing) {
        result.push({ ...route });
        continue;
      }
      const merged = {
        ...route,
        ...existing,
        meta: { ...route.meta, ...existing.meta },
      } as RouteRecordRaw;

      if (
        (existing.children?.length ?? 0) > 0 ||
        (route.children?.length ?? 0) > 0
      ) {
        merged.children = mergeRoutesByName(
          existing.children ?? [],
          route.children ?? [],
        );
      }
      Object.assign(existing, merged);
    } else {
      const clone = { ...route };
      result.push(clone);
      if (clone.name) {
        routeMap.set(clone.name, clone);
      }
    }
  }

  return result;
}

export { generateAccess };
export type { ComponentRecordType, GenerateAccessOptions };
