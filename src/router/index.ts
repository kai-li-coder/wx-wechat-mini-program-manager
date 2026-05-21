// 管理端路由配置与登录守卫。
import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";
import { resolveAdminRouteRedirect } from "@/router/authGuard";

/** 后台页面路由集合。 */
export const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/modules/login/index.vue"),
    meta: {
      title: "登录",
    },
  },
  {
    path: "/",
    component: AdminLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/modules/dashboard/index.vue"),
        meta: {
          title: "埋点总览",
          icon: "DataAnalysis",
          requiresAuth: true,
        },
      },
      {
        path: "trace-flow",
        name: "traceFlow",
        component: () => import("@/modules/traceFlow/index.vue"),
        meta: {
          title: "链路事件",
          icon: "Connection",
          requiresAuth: true,
        },
      },
      {
        path: "error-logs",
        name: "errorLogs",
        component: () => import("@/modules/errorLogs/index.vue"),
        meta: {
          title: "错误日志",
          icon: "Warning",
          requiresAuth: true,
        },
      },
    ],
  },
];

/** Vue Router 实例。 */
const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => resolveAdminRouteRedirect(to));

export default router;
