// 管理端登录态存储工具单元测试。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_AUTH_STORAGE_KEY,
  clearStoredAdminAuth,
  createAdminAuthSession,
  isAdminAuthSessionValid,
  readStoredAdminAccessToken,
  readStoredAdminAuth,
  writeStoredAdminAuth,
} from "@/utils/authStorage";

describe("auth storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T09:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates persisted session from login result", () => {
    const session = createAdminAuthSession({
      accessToken: "access-token",
      expiresIn: 1800,
      refreshToken: "refresh-token",
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });

    writeStoredAdminAuth(session);

    expect(readStoredAdminAuth()).toEqual(session);
    expect(session.expiresAt).toBe(Date.now() + 1_800_000);
  });

  it("clears invalid or expired session", () => {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({ accessToken: "expired" }));

    expect(readStoredAdminAuth()).toBeNull();

    writeStoredAdminAuth({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1,
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });

    expect(readStoredAdminAccessToken()).toBe("");
    expect(readStoredAdminAuth()).toBeNull();
  });

  it("checks session validity by token and expiry", () => {
    expect(
      isAdminAuthSessionValid({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() + 1,
        user: {
          avatar: "",
          name: "admin",
          userId: "US00000000",
        },
      }),
    ).toBe(true);

    clearStoredAdminAuth();
    expect(readStoredAdminAuth()).toBeNull();
  });
});
