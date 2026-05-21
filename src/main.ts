// 应用入口：挂载 Vue、Pinia、路由与 Element Plus。
import "element-plus/dist/index.css";
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
