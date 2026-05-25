// 请求响应解包工具单元测试。
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";

import {
  attachAuthorizationHeader,
  createAuthorizationHeader,
  DEFAULT_API_BASE,
  handleUnauthorizedResponse,
  resolveApiBase,
  unwrapTraceResponse,
} from "@/api/request";
import { readStoredAdminAuth, writeStoredAdminAuth } from "@/utils/authStorage";

describe("request utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("unwraps data payload", () => {
    expect(unwrapTraceResponse({ code: 200, msg: "success", data: { ok: true } })).toEqual({ ok: true });
  });

  it("unwraps result payload", () => {
    expect(unwrapTraceResponse({ code: 200, message: "OK", result: ["item"] })).toEqual(["item"]);
  });

  it("throws business error message", () => {
    expect(() => unwrapTraceResponse({ code: 500, msg: "失败" })).toThrow("失败");
  });

  it("creates authorization header from access token", () => {
    expect(createAuthorizationHeader(" access-token ")).toBe("Bearer access-token");
    expect(createAuthorizationHeader("")).toBe("");
  });

  it("resolves default api base outside miniapp development mode", () => {
    expect(resolveApiBase({ apiBase: " /custom-api ", mode: "development" })).toBe("/custom-api");
    expect(resolveApiBase({ apiBase: "", mode: "development" })).toBe(DEFAULT_API_BASE);
  });

  it("trims trailing slash from configured api base", () => {
    expect(resolveApiBase({ apiBase: " https://example.com/prod-api/ ", mode: "production" })).toBe(
      "https://example.com/prod-api",
    );
  });

  it("resolves service base when miniapp api base is empty", () => {
    expect(
      resolveApiBase({
        apiBase: "",
        apiServiceBase: " http://172.16.3.145:8080/ ",
        mode: "miniapp-development",
      }),
    ).toBe("http://172.16.3.145:8080");
  });

  it("uses api base when miniapp service base is missing", () => {
    expect(resolveApiBase({ apiBase: " /api ", apiServiceBase: "", mode: "miniapp-development" })).toBe(
      DEFAULT_API_BASE,
    );
  });

  it("uses default api base when miniapp service env is missing", () => {
    expect(resolveApiBase({ apiBase: "", apiServiceBase: "", mode: "miniapp-development" })).toBe(
      DEFAULT_API_BASE,
    );
  });

  it("skips authorization header when login verification is disabled", () => {
    writeStoredAdminAuth({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000,
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });

    const requestConfig = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;

    const nextConfig = attachAuthorizationHeader(requestConfig);

    expect(AxiosHeaders.from(nextConfig.headers).get("Authorization")).toBeUndefined();
  });

  it("skips auth clearing and redirect when login verification is disabled", () => {
    writeStoredAdminAuth({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000,
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });
    const redirects: string[] = [];
    let hasDispatchedAuthExpired = false;

    handleUnauthorizedResponse({
      currentPath: "/trace-flow?pageNum=1",
      dispatchAuthExpired: () => {
        hasDispatchedAuthExpired = true;
      },
      redirect: (url) => {
        redirects.push(url);
      },
    });

    expect(readStoredAdminAuth()?.accessToken).toBe("access-token");
    expect(hasDispatchedAuthExpired).toBe(false);
    expect(redirects).toEqual([]);
  });
});
