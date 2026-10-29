// Vite 构建与本地开发代理配置。
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import type {
  ComponentInfo,
  ComponentResolveResult,
  ComponentResolverObject,
} from "unplugin-vue-components/types";
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

/** 项目根目录，用于校验 Element Plus 组件子路径入口是否存在。 */
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/**
 * Element Plus 桶入口路径。
 * 该入口的默认导出会在模块顶层遍历全部组件生成安装器，因此只要它进入依赖图，
 * 未使用的组件就无法被 tree-shaking 摇掉；按需解析必须改写为组件子路径。
 */
const ELEMENT_PLUS_BARREL_ENTRY = "element-plus/es";

/** Element Plus 组件子路径前缀。 */
const ELEMENT_PLUS_COMPONENT_ENTRY_PREFIX = "element-plus/es/components";

/** 无独立 index 入口的子组件 → 所属父组件目录（父入口已导出该子组件）。 */
const ELEMENT_PLUS_COMPONENT_DIR_ALIAS: Record<string, string> = {
  "table-column": "table",
  "descriptions-item": "descriptions",
  "form-item": "form",
  "menu-item": "menu",
  "menu-item-group": "menu",
  "sub-menu": "menu",
  option: "select",
  "option-group": "select",
  "radio-group": "radio",
  "radio-button": "radio",
  aside: "container",
  main: "container",
  header: "container",
  footer: "container",
};

/** 指令导出符号 → Element Plus 组件目录。 */
const ELEMENT_PLUS_DIRECTIVE_DIR: Record<string, string> = {
  ElLoadingDirective: "loading",
  ElInfiniteScroll: "infinite-scroll",
  ElPopoverDirective: "popover",
};

/** 把组件名转换为 Element Plus 目录名：ElTableColumn → table-column。 */
const toElementPlusComponentDir = (componentName: string) =>
  componentName
    .replace(/^El/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

/** 校验组件子路径入口是否存在，避免把未知名称改写成不存在的模块。 */
const hasElementPlusComponentEntry = (componentDir: string) =>
  existsSync(path.join(projectRoot, "node_modules/element-plus/es/components", componentDir, "index.mjs"));

/** 把解析结果里的桶入口改写为组件子路径，未命中已知子路径时回退原结果。 */
const rewriteElementPlusEntry = async (
  resolved: ComponentResolveResult,
  resolveComponentDir: (componentInfo: ComponentInfo) => string | null,
): Promise<ComponentResolveResult> => {
  /** 等待异步 resolver 结果。 */
  const resolvedInfo = await resolved;
  if (!resolvedInfo || typeof resolvedInfo !== "object" || resolvedInfo.from !== ELEMENT_PLUS_BARREL_ENTRY) {
    return resolvedInfo;
  }

  /** 目标组件目录。 */
  const componentDir = resolveComponentDir(resolvedInfo);
  if (!componentDir || !hasElementPlusComponentEntry(componentDir)) {
    return resolvedInfo;
  }

  return { ...resolvedInfo, from: `${ELEMENT_PLUS_COMPONENT_ENTRY_PREFIX}/${componentDir}/index` };
};

/** 创建 Element Plus 按需解析器：组件与指令均指向组件子路径，避免整包进入产物。 */
const createElementPlusResolvers = (): ComponentResolverObject[] => {
  /** 官方解析器：组件与指令各一个，其 from 默认指向桶入口。 */
  const [componentResolver, directiveResolver] = ElementPlusResolver() as ComponentResolverObject[];

  return [
    {
      type: "component",
      resolve: (componentName) =>
        rewriteElementPlusEntry(componentResolver.resolve(componentName), (componentInfo) => {
          /** 组件目录名，供子组件别名与存在性校验使用。 */
          const componentDir = toElementPlusComponentDir(componentInfo.name ?? componentName);
          return ELEMENT_PLUS_COMPONENT_DIR_ALIAS[componentDir] ?? componentDir;
        }),
    },
    {
      type: "directive",
      resolve: (directiveName) =>
        rewriteElementPlusEntry(
          directiveResolver.resolve(directiveName),
          (componentInfo) => ELEMENT_PLUS_DIRECTIVE_DIR[componentInfo.name ?? ""] ?? null,
        ),
    },
  ];
};

/** 提取模块所属包名，仅对已进入依赖图的模块分组，避免把未使用代码强行拉入 chunk。 */
const resolvePackageName = (moduleId: string) => {
  /** node_modules 路径匹配结果，兼容 pnpm 的 .pnpm 嵌套目录。 */
  const packageMatch = moduleId.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/);
  return packageMatch?.[1] ?? "";
};

/** 归入 vue 生态 chunk 的包名。 */
const VUE_CHUNK_PACKAGES = new Set([
  "vue",
  "vue-router",
  "pinia",
  "@vue/runtime-core",
  "@vue/runtime-dom",
  "@vue/shared",
  "@vue/reactivity",
]);

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
        resolvers: createElementPlusResolvers(),
        dts: false,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      // 懒加载的 echarts 块约 523KB，是当前唯一接近阈值的产物；
      // 若其它块超过 560KB，通常意味着 Element Plus 按需引入出现回归。
      chunkSizeWarningLimit: 560,
      rollupOptions: {
        output: {
          // 函数式分组只作用于已在依赖图中的模块；写成对象会把包入口强制纳入 chunk，
          // 使 Element Plus 全量组件与图标被拽进产物。
          manualChunks: (moduleId: string) => {
            /** 模块所属包名。 */
            const packageName = resolvePackageName(moduleId);
            if (!packageName) {
              return undefined;
            }
            if (packageName === "echarts" || packageName === "zrender") {
              return "echarts";
            }
            if (VUE_CHUNK_PACKAGES.has(packageName)) {
              return "vue";
            }
            return undefined;
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
        "@": path.resolve(projectRoot, "./src"),
      },
    },
  };
});
