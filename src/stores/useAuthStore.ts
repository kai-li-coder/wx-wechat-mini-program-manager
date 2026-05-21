// 管理端登录鉴权状态管理。
import { defineStore } from "pinia";

import type { AdminLoginRequest, AdminLoginResult, AdminUserInfo } from "@/api/auth";
import { loginAdmin, logoutAdmin, queryCurrentUser, refreshAdminToken } from "@/api/auth";
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  clearStoredAdminAuth,
  createAdminAuthSession,
  isAdminAuthSessionValid,
  readStoredAdminAuth,
  writeStoredAdminAuth,
  type AdminAuthSession,
} from "@/utils/authStorage";

/** 管理端登录鉴权状态。 */
export const useAuthStore = defineStore("auth", () => {
  /** 初始化时读取本地会话。 */
  const initialSession = readStoredAdminAuth();
  /** 当前访问令牌。 */
  const accessToken = ref(initialSession?.accessToken ?? "");
  /** 当前刷新令牌。 */
  const refreshTokenValue = ref(initialSession?.refreshToken ?? "");
  /** 当前访问令牌过期时间。 */
  const expiresAt = ref(initialSession?.expiresAt ?? 0);
  /** 当前登录用户。 */
  const currentUser = ref<AdminUserInfo | null>(initialSession?.user ?? null);

  /** 当前是否有有效登录态。 */
  const isLoggedIn = computed(() => Boolean(accessToken.value) && expiresAt.value > Date.now());
  /** 顶部栏展示用户名。 */
  const userName = computed(() => currentUser.value?.name || "管理员");
  /** 顶部栏展示头像。 */
  const userAvatar = computed(() => currentUser.value?.avatar || "");

  /** 写入内存和本地登录会话。 */
  const setSession = (session: AdminAuthSession) => {
    accessToken.value = session.accessToken;
    refreshTokenValue.value = session.refreshToken;
    expiresAt.value = session.expiresAt;
    currentUser.value = session.user;
    writeStoredAdminAuth(session);
  };

  /** 清理内存和本地登录会话。 */
  const clearSession = () => {
    accessToken.value = "";
    refreshTokenValue.value = "";
    expiresAt.value = 0;
    currentUser.value = null;
    clearStoredAdminAuth();
  };

  /** 校验当前登录态，过期时主动清理。 */
  const hasValidSession = () => {
    const session: AdminAuthSession | null = accessToken.value
      ? {
          accessToken: accessToken.value,
          refreshToken: refreshTokenValue.value,
          expiresAt: expiresAt.value,
          user: currentUser.value ?? { avatar: "", name: "", userId: "" },
        }
      : null;

    if (isAdminAuthSessionValid(session)) {
      return true;
    }

    clearSession();
    return false;
  };

  /** 执行账号密码登录。 */
  const login = async (params: AdminLoginRequest): Promise<AdminLoginResult> => {
    const loginResult = await loginAdmin(params);
    const nextSession = createAdminAuthSession(loginResult);
    setSession(nextSession);
    return loginResult;
  };

  /** 刷新当前登录会话。 */
  const refreshAdminSession = async () => {
    if (!refreshTokenValue.value) {
      clearSession();
      return null;
    }

    const loginResult = await refreshAdminToken({ refreshToken: refreshTokenValue.value });
    const nextSession = createAdminAuthSession(loginResult);
    setSession(nextSession);
    return loginResult;
  };

  /** 拉取当前登录用户。 */
  const fetchCurrentUser = async () => {
    const user = await queryCurrentUser();
    currentUser.value = user;
    if (accessToken.value && refreshTokenValue.value) {
      writeStoredAdminAuth({
        accessToken: accessToken.value,
        refreshToken: refreshTokenValue.value,
        expiresAt: expiresAt.value,
        user,
      });
    }
    return user;
  };

  /** 执行退出登录。 */
  const logout = async () => {
    const refreshToken = refreshTokenValue.value;
    if (refreshToken) {
      await logoutAdmin({ refreshToken }).catch(() => undefined);
    }
    clearSession();
  };

  /** 监听请求层派发的登录失效事件。 */
  const bindAuthExpiredListener = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, clearSession);
  };

  return {
    accessToken,
    refreshTokenValue,
    expiresAt,
    currentUser,
    isLoggedIn,
    userName,
    userAvatar,
    setSession,
    clearSession,
    hasValidSession,
    login,
    refreshAdminSession,
    fetchCurrentUser,
    logout,
    bindAuthExpiredListener,
  };
});
