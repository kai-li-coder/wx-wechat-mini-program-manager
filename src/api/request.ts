// 统一 HTTP 请求封装，负责后端响应解包、鉴权请求头和错误提示。
import axios, { AxiosHeaders, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";

import { IS_LOGIN_VERIFICATION_DISABLED } from "@/config/auth";
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  clearStoredAdminAuth,
  readStoredAdminAccessToken,
} from "@/utils/authStorage";

/** 后端通用响应结构。 */
export interface TraceApiResponse<T> {
  /** 业务状态码。 */
  code: number;
  /** 响应消息。 */
  msg?: string;
  /** 兼容通用接口响应消息。 */
  message?: string;
  /** 埋点接口响应数据。 */
  data?: T;
  /** 兼容普通接口响应数据。 */
  result?: T;
}

/** 请求基础地址解析选项。 */
interface ApiBaseResolveOptions {
  /** 当前启动模式。 */
  mode?: string;
  /** 接口请求基础地址。 */
  apiBase?: string;
  /** 请求服务基础地址。 */
  apiServiceBase?: string;
}

/** 默认接口请求基础地址。 */
export const DEFAULT_API_BASE = "/api";

/** 小程序开发环境模式名。 */
export const MINIAPP_DEVELOPMENT_MODE = "miniapp-development";

/** 清理 URL 尾部斜杠，避免 Axios 拼接路径时出现双斜杠。 */
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/** 规范化接口基础地址。 */
const normalizeApiBase = (value?: string) => trimTrailingSlash(value?.trim() ?? "");

/** 解析 Axios 请求基础地址。 */
export const resolveApiBase = (options: ApiBaseResolveOptions = {}) => {
  const currentMode = options.mode ?? import.meta.env.MODE;
  const apiBase = normalizeApiBase(options.apiBase ?? import.meta.env.VITE_API_BASE);
  const apiServiceBase = normalizeApiBase(options.apiServiceBase ?? import.meta.env.VITE_API_SERVICE_BASE);

  if (currentMode === MINIAPP_DEVELOPMENT_MODE) {
    return apiServiceBase || apiBase || DEFAULT_API_BASE;
  }

  return apiBase || DEFAULT_API_BASE;
};

/** Axios 请求基础地址。 */
const apiBase = resolveApiBase();

/** Axios 实例。 */
const httpClient = axios.create({
  baseURL: apiBase,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** 创建 Bearer 鉴权请求头。 */
export const createAuthorizationHeader = (accessToken: string) => {
  const normalizedToken = accessToken.trim();
  return normalizedToken ? `Bearer ${normalizedToken}` : "";
};

/** 为请求配置附加鉴权头。 */
export const attachAuthorizationHeader = (config: InternalAxiosRequestConfig) => {
  if (IS_LOGIN_VERIFICATION_DISABLED) {
    return config;
  }

  const authorizationHeader = createAuthorizationHeader(readStoredAdminAccessToken());
  if (!authorizationHeader) {
    return config;
  }

  const requestHeaders = AxiosHeaders.from(config.headers);
  requestHeaders.set("Authorization", authorizationHeader);
  config.headers = requestHeaders;
  return config;
};

/** 从后端响应结构中解出业务数据。 */
export const unwrapTraceResponse = <T>(payload: TraceApiResponse<T>): T => {
  if (payload.code !== 200) {
    throw new Error(payload.message || payload.msg || "请求失败");
  }

  if ("data" in payload) {
    return payload.data as T;
  }

  return payload.result as T;
};

/** 解析请求错误提示。 */
export const resolveRequestErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<TraceApiResponse<unknown>>(error)) {
    return error.response?.data?.message || error.response?.data?.msg || error.message || "网络请求失败";
  }

  return error instanceof Error ? error.message : "网络请求失败";
};

/** 登录失效跳转选项。 */
interface UnauthorizedRedirectOptions {
  /** 当前页面路径。 */
  currentPath?: string;
  /** 自定义跳转函数，便于单元测试。 */
  redirect?: (url: string) => void;
  /** 自定义事件派发函数，便于单元测试。 */
  dispatchAuthExpired?: () => void;
}

/** 处理未登录或登录过期响应。 */
export const handleUnauthorizedResponse = (options: UnauthorizedRedirectOptions = {}) => {
  if (IS_LOGIN_VERIFICATION_DISABLED) {
    return;
  }

  clearStoredAdminAuth();
  const currentPath = options.currentPath ?? `${window.location.pathname}${window.location.search}`;
  const dispatchAuthExpired =
    options.dispatchAuthExpired ??
    (() => {
      window.dispatchEvent(new Event(ADMIN_AUTH_EXPIRED_EVENT));
    });
  dispatchAuthExpired();

  if (currentPath.startsWith("/login")) {
    return;
  }

  const redirect = options.redirect ?? window.location.assign.bind(window.location);
  redirect(`/login?redirect=${encodeURIComponent(currentPath || "/dashboard")}`);
};

httpClient.interceptors.request.use(attachAuthorizationHeader);

httpClient.interceptors.response.use(
  (response) => unwrapTraceResponse(response.data),
  (error: unknown) => {
    const errorMessage = resolveRequestErrorMessage(error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorizedResponse();
    }
    ElMessage.error(errorMessage);
    return Promise.reject(error);
  },
);

/** GET 请求简写。 */
export const httpGet = <T>(url: string, config?: AxiosRequestConfig) =>
  httpClient.get<TraceApiResponse<T>, T>(url, config);

/** POST 请求简写。 */
export const httpPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  httpClient.post<TraceApiResponse<T>, T>(url, data, config);
