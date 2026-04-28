import type { RouteRecordRaw } from 'vue-router';

interface RouteModuleType {
  default: RouteRecordRaw[];
}

/**
 * 合并动态路由模块的默认导出
 */
function mergeRouteModules(
  routeModules: Record<string, unknown>,
): RouteRecordRaw[] {
  const mergedRoutes: RouteRecordRaw[] = [];

  for (const routeModule of Object.values(routeModules)) {
    const moduleRoutes = (routeModule as RouteModuleType)?.default ?? [];
    mergedRoutes.push(...moduleRoutes);
  }

  return mergedRoutes;
}

export { mergeRouteModules };
export type { RouteModuleType };
