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
  const proxyTarget = value?.trim() || "http://localhost:8080";
  return trimTrailingSlash(proxyTarget);
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /** 当前模式下的环境变量。 */
  const envConfig = loadEnv(mode, process.cwd(), "");
  /** 接口代理前缀，默认与后端 /api 路由保持一致。 */
  const apiBase = envConfig.VITE_API_BASE?.trim() || "/api";
  /** 本地 ai-training-backend 代理目标。 */
  const apiProxyTarget = resolveProxyTarget(envConfig.VITE_API_PROXY_TARGET);

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
      proxy: {
        [apiBase]: {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
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
