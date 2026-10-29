// 应用入口：挂载 Vue、Pinia、路由与 Element Plus。
// Element Plus 组件样式由按需解析器注入；ElMessage 属于脚本调用（不经模板解析），
// 需在此显式引入其样式，同时带入 base 基础样式。
import "element-plus/es/components/message/style/css";
import "@/styles/base.scss";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "@/App.vue";
import router from "@/router";
import { useAuthStore } from "@/stores/useAuthStore";

/** Vue 应用实例。 */
const appInstance = createApp(App);
/** Pinia 状态管理实例。 */
const piniaInstance = createPinia();

appInstance.use(piniaInstance);
appInstance.use(router);

/** 绑定登录失效事件，保证请求层 401 后同步清理页面状态。 */
useAuthStore(piniaInstance).bindAuthExpiredListener();

appInstance.mount("#app");
