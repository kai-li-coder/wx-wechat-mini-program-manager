// 管理端路由登录守卫。
import type { RouteLocationNormalized } from "vue-router";

import { IS_LOGIN_VERIFICATION_DISABLED } from "@/config/auth";
import { useAuthStore } from "@/stores/useAuthStore";

/** 登录页路径。 */
export const LOGIN_ROUTE_PATH = "/login";

/** 登录后的默认后台首页。 */
export const DEFAULT_AUTH_ROUTE_PATH = "/dashboard";

/** 解析安全的登录后跳转路径。 */
export const resolveLoginRedirectPath = (redirectQuery: unknown) => {
  if (typeof redirectQuery !== "string") {
    return DEFAULT_AUTH_ROUTE_PATH;
  }

  if (!redirectQuery.startsWith("/") || redirectQuery.startsWith("//")) {
    return DEFAULT_AUTH_ROUTE_PATH;
  }

  if (redirectQuery === LOGIN_ROUTE_PATH || redirectQuery.startsWith(`${LOGIN_ROUTE_PATH}?`)) {
    return DEFAULT_AUTH_ROUTE_PATH;
  }

  return redirectQuery;
};

/** 计算管理端路由登录拦截结果。 */
export const resolveAdminRouteRedirect = (to: RouteLocationNormalized) => {
  if (IS_LOGIN_VERIFICATION_DISABLED) {
    return to.path === LOGIN_ROUTE_PATH ? resolveLoginRedirectPath(to.query.redirect) : true;
  }

  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((routeRecord) => Boolean(routeRecord.meta.requiresAuth));
  const hasValidSession = authStore.hasValidSession();

  if (requiresAuth && !hasValidSession) {
    return {
      path: LOGIN_ROUTE_PATH,
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.path === LOGIN_ROUTE_PATH && hasValidSession) {
    return resolveLoginRedirectPath(to.query.redirect);
  }

  return true;
};
