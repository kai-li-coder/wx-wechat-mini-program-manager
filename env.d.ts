// 应用环境变量与 Vue 单文件组件类型声明。
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口请求基础前缀。 */
  readonly VITE_API_BASE?: string;
  /** 本地开发代理目标地址。 */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
