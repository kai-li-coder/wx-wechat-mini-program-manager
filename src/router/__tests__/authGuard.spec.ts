// 管理端路由登录守卫单元测试。
import { createPinia, setActivePinia } from "pinia";
import type { RouteLocationNormalized } from "vue-router";
import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_ROUTE_PATH,
  LOGIN_ROUTE_PATH,
  resolveAdminRouteRedirect,
  resolveLoginRedirectPath,
} from "@/router/authGuard";
import { useAuthStore } from "@/stores/useAuthStore";

/** 创建路由对象测试桩。 */
const createRouteStub = (options: {
  path: string;
  fullPath?: string;
  requiresAuth?: boolean;
  query?: Record<string, string>;
}) =>
  ({
    path: options.path,
    fullPath: options.fullPath ?? options.path,
    query: options.query ?? {},
    matched: [
      {
        meta: {
          requiresAuth: options.requiresAuth ?? false,
        },
      },
    ],
  }) as RouteLocationNormalized;

describe("auth guard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("redirects protected route to login without session", () => {
    expect(
      resolveAdminRouteRedirect(
        createRouteStub({
          path: "/trace-flow",
          fullPath: "/trace-flow?pageNum=1",
          requiresAuth: true,
        }),
      ),
    ).toEqual({
      path: LOGIN_ROUTE_PATH,
      query: {
        redirect: "/trace-flow?pageNum=1",
      },
    });
  });

  it("redirects login page to dashboard with valid session", () => {
    const authStore = useAuthStore();
    authStore.setSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000,
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });

    expect(
      resolveAdminRouteRedirect(
        createRouteStub({
          path: "/login",
        }),
      ),
    ).toBe(DEFAULT_AUTH_ROUTE_PATH);
  });

  it("normalizes unsafe or repeated login redirect", () => {
    expect(resolveLoginRedirectPath("https://example.com")).toBe(DEFAULT_AUTH_ROUTE_PATH);
    expect(resolveLoginRedirectPath("/login?redirect=/dashboard")).toBe(DEFAULT_AUTH_ROUTE_PATH);
    expect(resolveLoginRedirectPath("/trace-flow")).toBe("/trace-flow");
  });
});
