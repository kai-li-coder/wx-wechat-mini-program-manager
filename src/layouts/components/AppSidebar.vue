<!-- 管理后台侧边导航组件 -->
<template>
  <!-- 左侧导航栏 -->
  <el-aside :width="sidebarWidth" class="app-sidebar">
    <!-- 系统标识区域 -->
    <div class="app-sidebar__brand">
      <div class="app-sidebar__logo">埋</div>
      <div v-if="!isSidebarCollapsed" class="app-sidebar__brand-text">
        <span class="app-sidebar__brand-title">Trace Admin</span>
        <span class="app-sidebar__brand-desc">链路观测台</span>
      </div>
    </div>

    <!-- 主导航菜单 -->
    <el-menu
      :collapse="isSidebarCollapsed"
      :default-active="activeMenu"
      :router="true"
      class="app-sidebar__menu"
    >
      <el-menu-item v-for="routeItem in menuRoutes" :key="routeItem.path" :index="routeItem.path">
        <el-icon>
          <component :is="routeItem.icon" />
        </el-icon>
        <template #title>{{ routeItem.title }}</template>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { Connection, DataAnalysis, Warning } from "@element-plus/icons-vue";
import type { Component } from "vue";

import { useAppStore } from "@/stores/useAppStore";

/** 可渲染菜单配置。 */
interface MenuRouteItem {
  /** 路由路径。 */
  path: string;
  /** 菜单标题。 */
  title: string;
  /** 菜单图标组件。 */
  icon: Component;
}

/** 应用级 UI 状态。 */
const appStore = useAppStore();
/** 当前路由对象。 */
const currentRoute = useRoute();
/** 当前窗口宽度。 */
const { width: windowWidth } = useWindowSize();

/** 菜单路由列表。 */
const menuRoutes: MenuRouteItem[] = [
  { path: "/dashboard", title: "埋点总览", icon: DataAnalysis },
  { path: "/trace-flow", title: "链路事件", icon: Connection },
  { path: "/error-logs", title: "错误日志", icon: Warning },
];

/** 侧边栏宽度。 */
const sidebarWidth = computed(() => (isSidebarCollapsed.value ? "72px" : "228px"));
/** 小屏强制折叠侧边栏。 */
const isSidebarCollapsed = computed(() => appStore.isSidebarCollapsed || windowWidth.value <= 768);
/** 当前激活菜单路径。 */
const activeMenu = computed(() => currentRoute.path);
</script>

<style scoped lang="scss">
.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  border-right: 1px solid $color-border;
  background: $color-surface;
  transition: width 0.2s ease;
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid $color-border;
}

.app-sidebar__logo {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.app-sidebar__brand-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.app-sidebar__brand-title {
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
}

.app-sidebar__brand-desc {
  color: $color-text-secondary;
  font-size: 12px;
  line-height: 18px;
}

.app-sidebar__menu {
  border-right: 0;
}
</style>
