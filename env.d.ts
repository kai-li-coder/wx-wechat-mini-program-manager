// 应用环境变量与 Vue 单文件组件类型声明。
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 请求服务基础地址。 */
  readonly VITE_API_SERVICE_BASE?: string;
  /** 接口请求基础地址，可以是路径前缀或绝对 URL。 */
  readonly VITE_API_BASE?: string;
  /** 本地开发代理目标地址。 */
  readonly VITE_API_PROXY_TARGET?: string;
  /** 当前接口服务展示名称。 */
  readonly VITE_SERVICE_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
