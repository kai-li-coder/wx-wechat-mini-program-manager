// 管理端登录态本地存储工具。
import type { AdminLoginResult, AdminUserInfo } from "@/api/auth";

/** 管理端登录态本地存储键。 */
export const ADMIN_AUTH_STORAGE_KEY = "wx_manager_admin_auth";

/** 管理端登录态失效事件名。 */
export const ADMIN_AUTH_EXPIRED_EVENT = "admin-auth-expired";

/** 管理端本地登录会话。 */
export interface AdminAuthSession {
  /** 访问令牌。 */
  accessToken: string;
  /** 刷新令牌。 */
  refreshToken: string;
  /** 访问令牌过期时间戳，单位毫秒。 */
  expiresAt: number;
  /** 当前登录用户。 */
  user: AdminUserInfo;
}

/** 判断值是否是普通对象。 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 判断值是否是非空字符串。 */
const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** 获取浏览器本地存储对象。 */
const getBrowserStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

/** 判断用户信息结构是否有效。 */
const isAdminUserInfo = (value: unknown): value is AdminUserInfo => {
  if (!isRecord(value)) {
    return false;
  }

  return hasText(value.name) && hasText(value.userId) && typeof value.avatar === "string";
};

/** 判断本地登录会话结构是否有效。 */
export const isAdminAuthSession = (value: unknown): value is AdminAuthSession => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasText(value.accessToken) &&
    hasText(value.refreshToken) &&
    typeof value.expiresAt === "number" &&
    Number.isFinite(value.expiresAt) &&
    isAdminUserInfo(value.user)
  );
};

/** 从登录结果创建本地会话。 */
export const createAdminAuthSession = (loginResult: AdminLoginResult): AdminAuthSession => ({
  accessToken: loginResult.accessToken || loginResult.token || "",
  refreshToken: loginResult.refreshToken,
  expiresAt: Date.now() + Math.max(loginResult.expiresIn, 0) * 1000,
  user: loginResult.user,
});

/** 读取本地登录会话。 */
export const readStoredAdminAuth = (): AdminAuthSession | null => {
  const browserStorage = getBrowserStorage();
  if (!browserStorage) {
    return null;
  }

  const rawSession = browserStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession: unknown = JSON.parse(rawSession);
    return isAdminAuthSession(parsedSession) ? parsedSession : null;
  } catch {
    return null;
  }
};

/** 写入本地登录会话。 */
export const writeStoredAdminAuth = (session: AdminAuthSession) => {
  const browserStorage = getBrowserStorage();
  if (!browserStorage) {
    return;
  }

  browserStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));
};

/** 清理本地登录会话。 */
export const clearStoredAdminAuth = () => {
  const browserStorage = getBrowserStorage();
  if (!browserStorage) {
    return;
  }

  browserStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
};

/** 判断登录会话是否仍在有效期内。 */
export const isAdminAuthSessionValid = (session: AdminAuthSession | null) =>
  Boolean(session?.accessToken) && Number(session?.expiresAt ?? 0) > Date.now();

/** 读取有效访问令牌，过期时同步清理本地会话。 */
export const readStoredAdminAccessToken = () => {
  const storedSession = readStoredAdminAuth();
  if (isAdminAuthSessionValid(storedSession)) {
    return storedSession?.accessToken ?? "";
  }

  clearStoredAdminAuth();
  return "";
};
