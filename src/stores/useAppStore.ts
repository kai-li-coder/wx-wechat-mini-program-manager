// 应用级 UI 状态管理。
import { defineStore } from "pinia";

/** 管理端应用级状态。 */
export const useAppStore = defineStore("app", () => {
  /** 侧边栏是否折叠。 */
  const isSidebarCollapsed = ref(false);

  /** 切换侧边栏折叠状态。 */
  const toggleSidebarCollapsed = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  return {
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  };
});
