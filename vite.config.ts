// Vite 构建与本地开发代理配置。
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { defineConfig, loadEnv } from "vite";

/** 清理 URL 尾部斜杠，避免代理目标拼接异常。 */
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/** 规范化本地代理目标地址。 */
const resolveProxyTarget = (value?: string) => {
  const proxyTarget = value?.trim();
  return proxyTarget ? trimTrailingSlash(proxyTarget) : "";
};

/** 判断接口基础地址是否可以作为 Vite 代理前缀。 */
const isProxyPath = (value: string) => value.startsWith("/");

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** 当前模式下的环境变量。 */
  const envConfig = loadEnv(mode, process.cwd(), "");
  /** 接口请求基础地址，可以是路径前缀或绝对 URL。 */
  const apiBase = envConfig.VITE_API_BASE?.trim() || "/api";
  /** 本地开发代理目标。 */
  const apiProxyTarget = resolveProxyTarget(envConfig.VITE_API_PROXY_TARGET);
  /** Vite 代理配置仅在接口基础地址为路径前缀时启用。 */
  const proxyConfig = isProxyPath(apiBase) && apiProxyTarget
    ? {
        [apiBase]: {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      }
    : undefined;

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        dts: false,
        eslintrc: {
          enabled: false,
        },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: false,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            element: ["element-plus", "@element-plus/icons-vue"],
            echarts: ["echarts/core", "echarts/components", "echarts/charts", "echarts/renderers"],
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5174,
      proxy: proxyConfig,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/tokens.scss" as *;`,
        },
      },
    },
    test: {
      environment: "happy-dom",
      globals: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
