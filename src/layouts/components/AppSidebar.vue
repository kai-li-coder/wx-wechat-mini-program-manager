<!-- 管理后台侧边导航组件：白色导航面板 + 绿色激活胶囊，含折叠态 -->
<template>
  <!-- 左侧导航栏 -->
  <el-aside :width="sidebarWidth" class="app-sidebar">
    <!-- 系统标识区域 -->
    <div class="app-sidebar__brand">
      <span class="app-sidebar__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12h4l3-7 4 14 3-7h6"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
          />
        </svg>
      </span>
      <div v-if="!isSidebarCollapsed" class="app-sidebar__brand-text">
        <span class="app-sidebar__brand-title">TRACE ADMIN</span>
        <span class="app-sidebar__brand-desc">链路观测台</span>
      </div>
    </div>

    <!-- 导航分组标题 -->
    <div v-if="!isSidebarCollapsed" class="app-sidebar__section">导航</div>

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

    <!-- 底部说明：仅展开态展示 -->
    <div v-if="!isSidebarCollapsed" class="app-sidebar__foot">
      <span class="app-sidebar__foot-label">TRACE PIPELINE</span>
      <span class="app-sidebar__foot-value">埋点 · 链路 · 异常</span>
    </div>
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
const sidebarWidth = computed(() => (isSidebarCollapsed.value ? "76px" : "236px"));
/** 小屏与窄桌面强制折叠侧边栏，避免挤压数据区。 */
const isSidebarCollapsed = computed(() => appStore.isSidebarCollapsed || windowWidth.value <= 1024);
/** 当前激活菜单路径。 */
const activeMenu = computed(() => currentRoute.path);
</script>

<style scoped lang="scss">
.app-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid $color-border;
  background: $color-surface;
  transition: width $dur-base $ease-out;
}

.app-sidebar__brand {
  display: flex;
  height: 64px;
  flex: 0 0 64px;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid $color-border-soft;
}

/* 品牌标记：绿色渐变圆角方块，呼应参考图的绿色主色 */
.app-sidebar__mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 6px 14px rgba(34, 197, 94, 0.28);
  color: #ffffff;
}

.app-sidebar__mark svg {
  width: 18px;
  height: 18px;
}

.app-sidebar__brand-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.app-sidebar__brand-title {
  color: $color-text-primary;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 18px;
}

.app-sidebar__brand-desc {
  color: $color-text-muted;
  font-size: 11px;
  line-height: 15px;
}

.app-sidebar__section {
  padding: 18px 20px 8px;
  color: $color-text-muted;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.app-sidebar__menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #{$color-text-secondary};
  --el-menu-hover-bg-color: #f5f7fc;
  --el-menu-active-color: #ffffff;

  width: 100%;
  flex: 1;
  padding: 8px;
  border-right: 0;
}

.app-sidebar__menu.el-menu--collapse {
  width: 100%;
}

.app-sidebar__menu :deep(.el-menu-item) {
  height: 40px;
  margin-bottom: $space-1;
  padding: 0 12px;
  border-radius: $radius-sm;
  color: $color-text-secondary;
  font-size: $font-size-base;
  font-weight: 500;
  transition:
    background-color $dur-fast ease,
    color $dur-fast ease,
    box-shadow $dur-fast ease;
}

.app-sidebar__menu :deep(.el-menu-item .el-icon) {
  margin-right: 10px;
  color: $color-text-muted;
  font-size: 16px;
  transition: color $dur-fast ease;
}

.app-sidebar__menu :deep(.el-menu-item:hover) {
  background: $color-surface-subtle;
  color: $color-text-primary;
}

.app-sidebar__menu :deep(.el-menu-item:hover .el-icon) {
  color: $color-text-secondary;
}

/* 激活态：绿色胶囊 + 柔和绿色投影，与参考图导航一致 */
.app-sidebar__menu :deep(.el-menu-item.is-active) {
  background: $color-accent;
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.24);
  color: #ffffff;
  font-weight: 600;
}

.app-sidebar__menu :deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff;
}

.app-sidebar__menu :deep(.el-menu-item.is-active:focus-visible) {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: -2px;
}

.app-sidebar__menu.el-menu--collapse :deep(.el-menu-item) {
  justify-content: center;
  padding: 0 !important;
}

.app-sidebar__menu.el-menu--collapse :deep(.el-menu-item .el-icon) {
  margin-right: 0;
}

.app-sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: auto;
  padding: 16px 20px 20px;
  border-top: 1px solid $color-border-soft;
}

.app-sidebar__foot-label {
  @include text-micro;

  color: $color-text-muted;
  font-size: 9.5px;
}

.app-sidebar__foot-value {
  color: $color-text-muted;
  font-size: 11px;
}

@include screen-sm {
  .app-sidebar__brand {
    justify-content: center;
    padding: 0;
  }

  .app-sidebar__menu {
    padding: 6px;
  }
}
</style>
