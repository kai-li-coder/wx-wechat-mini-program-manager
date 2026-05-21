// 管理端登录鉴权接口。
import { httpGet, httpPost } from "@/api/request";

/** 管理端用户信息。 */
export interface AdminUserInfo {
  /** 用户显示名称。 */
  name: string;
  /** 用户头像地址。 */
  avatar: string;
  /** 用户 ID。 */
  userId: string;
}

/** 管理端登录请求。 */
export interface AdminLoginRequest {
  /** 登录账号。 */
  account: string;
  /** 登录密码。 */
  password: string;
}

/** 管理端登录结果。 */
export interface AdminLoginResult {
  /** 访问令牌。 */
  accessToken: string;
  /** 刷新令牌。 */
  refreshToken: string;
  /** 访问令牌有效期，单位秒。 */
  expiresIn: number;
  /** 当前登录用户。 */
  user: AdminUserInfo;
  /** 兼容旧字段的访问令牌别名。 */
  token?: string;
}

/** 管理端刷新令牌请求。 */
export interface AdminRefreshRequest {
  /** 刷新令牌。 */
  refreshToken: string;
}

/** 管理端登出请求。 */
export interface AdminLogoutRequest {
  /** 需要撤销的刷新令牌。 */
  refreshToken: string;
}

/** 管理端登出结果。 */
export interface AdminLogoutResult {
  /** 是否成功撤销刷新令牌。 */
  loggedOut: boolean;
}

/** 管理端账号密码登录。 */
export const loginAdmin = (params: AdminLoginRequest) => httpPost<AdminLoginResult>("/user/login", params);

/** 使用刷新令牌换取新访问令牌。 */
export const refreshAdminToken = (params: AdminRefreshRequest) =>
  httpPost<AdminLoginResult>("/user/refresh", params);

/** 管理端退出登录。 */
export const logoutAdmin = (params: AdminLogoutRequest) => httpPost<AdminLogoutResult>("/user/logout", params);

/** 查询当前登录用户。 */
export const queryCurrentUser = () => httpGet<AdminUserInfo>("/user/info");
