// 管理端登录鉴权状态单元测试。
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loginAdmin, logoutAdmin } from "@/api/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { readStoredAdminAuth } from "@/utils/authStorage";

vi.mock("@/api/auth", () => ({
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  queryCurrentUser: vi.fn(),
  refreshAdminToken: vi.fn(),
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T09:00:00+08:00"));
    vi.mocked(loginAdmin).mockReset();
    vi.mocked(logoutAdmin).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists session after login", async () => {
    vi.mocked(loginAdmin).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 1800,
      refreshToken: "refresh-token",
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });

    const authStore = useAuthStore();
    await authStore.login({ account: "admin", password: "admin123" });

    expect(authStore.hasValidSession()).toBe(true);
    expect(authStore.userName).toBe("admin");
    expect(readStoredAdminAuth()?.accessToken).toBe("access-token");
  });

  it("clears session after logout", async () => {
    vi.mocked(loginAdmin).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 1800,
      refreshToken: "refresh-token",
      user: {
        avatar: "",
        name: "admin",
        userId: "US00000000",
      },
    });
    vi.mocked(logoutAdmin).mockResolvedValue({ loggedOut: true });

    const authStore = useAuthStore();
    await authStore.login({ account: "admin", password: "admin123" });
    await authStore.logout();

    expect(authStore.hasValidSession()).toBe(false);
    expect(readStoredAdminAuth()).toBeNull();
    expect(logoutAdmin).toHaveBeenCalledWith({ refreshToken: "refresh-token" });
  });
});
