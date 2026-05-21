// 请求响应解包工具单元测试。
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";

import {
  attachAuthorizationHeader,
  createAuthorizationHeader,
  handleUnauthorizedResponse,
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

  it("attaches authorization header from stored session", () => {
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

    expect(AxiosHeaders.from(nextConfig.headers).get("Authorization")).toBe("Bearer access-token");
  });

  it("clears auth and redirects when unauthorized", () => {
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

    expect(readStoredAdminAuth()).toBeNull();
    expect(hasDispatchedAuthExpired).toBe(true);
    expect(redirects).toEqual(["/login?redirect=%2Ftrace-flow%3FpageNum%3D1"]);
  });
});
