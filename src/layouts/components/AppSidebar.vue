<!-- 管理后台侧边导航组件：青蓝胶囊导航栏 + 白色激活胶囊，含折叠态 -->
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
        <span class="app-sidebar__brand-desc">招人more埋点监测</span>
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

    <!-- 底部：服务环境与登录账号区 -->
    <div class="app-sidebar__foot">
      <!-- 服务环境胶囊：折叠态隐藏，避免挤压账号区 -->
      <span v-if="!isSidebarCollapsed" class="status-pill app-sidebar__service">
        <i class="status-pill__dot" aria-hidden="true" />
        {{ serviceLabel }}
      </span>

      <!-- 登录账号区：头像 + 用户名 + 退出登录 -->
      <div class="app-sidebar__user">
        <el-avatar :size="30" :src="authStore.userAvatar">{{ avatarText }}</el-avatar>
        <span v-if="!isSidebarCollapsed" class="app-sidebar__user-name">{{
          authStore.userName
        }}</span>
        <el-button
          aria-label="退出登录"
          class="app-sidebar__logout"
          :icon="SwitchButton"
          :loading="isLoggingOut"
          text
          @click="handleLogout"
        >
          <span v-if="!isSidebarCollapsed" class="app-sidebar__logout-text">退出登录</span>
        </el-button>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { Connection, DataAnalysis, SwitchButton, Warning } from "@element-plus/icons-vue";
import type { Component } from "vue";

import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

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
/** 管理端鉴权状态。 */
const authStore = useAuthStore();
/** 路由实例。 */
const router = useRouter();
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

/** 退出登录状态。 */
const isLoggingOut = ref(false);
/** 当前接口服务展示名称。 */
const serviceLabel = import.meta.env.VITE_SERVICE_LABEL?.trim() || "当前服务";
/** 头像兜底文案。 */
const avatarText = computed(() => authStore.userName.slice(0, 1).toUpperCase());

/** 退出当前登录会话。 */
const handleLogout = async () => {
  isLoggingOut.value = true;
  try {
    await authStore.logout();
    await router.replace("/login");
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<style scoped lang="scss">
.app-sidebar {
  /* 浮动胶囊栏：四周留出画布，呼应参考图的圆角侧栏 */
  position: sticky;
  top: 16px;
  display: flex;
  height: calc(100vh - 32px);
  height: calc(100dvh - 32px);
  flex-direction: column;
  margin: 16px 0 16px 16px;
  overflow: hidden;
  border-radius: $radius-rail;
  background: linear-gradient(180deg, #0fa0b2 0%, #08808f 100%);
  box-shadow: 0 12px 32px rgba(7, 90, 100, 0.18);
  transition:
    width $dur-base $ease-out,
    box-shadow $dur-base $ease-out;
}

.app-sidebar__brand {
  display: flex;
  height: 64px;
  flex: 0 0 64px;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
}

/* 品牌标记：白底圆角方块 + 青色图标，呼应参考图侧栏的白色圆点 */
.app-sidebar__mark {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(4, 48, 55, 0.22);
  color: $color-accent;
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
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 18px;
}

.app-sidebar__brand-desc {
  color: rgba(255, 255, 255, 0.66);
  font-size: 11px;
  line-height: 15px;
}

.app-sidebar__section {
  padding: 18px 20px 8px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.app-sidebar__menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #{$color-text-on-sidebar};
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-menu-active-color: #{$color-text-primary};

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
  color: $color-text-on-sidebar;
  font-size: $font-size-base;
  font-weight: 500;
  transition:
    background-color $dur-fast ease,
    color $dur-fast ease,
    box-shadow $dur-fast ease;
}

.app-sidebar__menu :deep(.el-menu-item .el-icon) {
  margin-right: 10px;
  color: $color-accent-tint;
  font-size: 16px;
  transition: color $dur-fast ease;
}

.app-sidebar__menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.app-sidebar__menu :deep(.el-menu-item:hover .el-icon) {
  color: #ffffff;
}

/* 激活态：白色胶囊 + 柔和深青投影，与参考图导航一致 */
.app-sidebar__menu :deep(.el-menu-item.is-active) {
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(4, 48, 55, 0.22);
  color: $color-text-primary;
  font-weight: 600;
}

.app-sidebar__menu :deep(.el-menu-item.is-active .el-icon) {
  color: $color-accent;
}

.app-sidebar__menu :deep(.el-menu-item.is-active:focus-visible) {
  outline: 2px solid rgba(10, 144, 161, 0.6);
  outline-offset: -2px;
}

.app-sidebar__menu.el-menu--collapse :deep(.el-menu-item) {
  justify-content: center;
  padding: 0 !important;
}

.app-sidebar__menu.el-menu--collapse :deep(.el-menu-item .el-icon) {
  margin-right: 0;
}

/* 底部：服务环境 + 登录账号区，固定在菜单栏底部 */
.app-sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 14px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.app-sidebar__user {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.app-sidebar__user-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #ffffff;
  font-size: $font-size-sm;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 退出按钮：浅白文字按钮，通过 CSS 变量适配文字按钮的悬停配色 */
.app-sidebar__logout {
  --el-button-text-color: rgba(255, 255, 255, 0.85);
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.14);
  --el-button-active-text-color: #ffffff;

  flex: 0 0 auto;
  height: 32px;
  padding: 0 6px;
  font-size: $font-size-xs;
}

/* 窄屏折叠态：账号区纵向排列，仅保留头像与退出图标 */
@media (max-width: 1024px) {
  .app-sidebar__foot {
    align-items: center;
    padding: 12px 10px 14px;
  }

  .app-sidebar__user {
    flex-direction: column;
    gap: 6px;
  }
}

@include screen-sm {
  .app-sidebar {
    top: 10px;
    height: calc(100vh - 20px);
    height: calc(100dvh - 20px);
    margin: 10px 0 10px 10px;
    border-radius: 20px;
  }

  .app-sidebar__brand {
    justify-content: center;
    padding: 0;
  }

  .app-sidebar__menu {
    padding: 6px;
  }
}
</style>
