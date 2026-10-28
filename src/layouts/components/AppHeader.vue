<!-- 管理后台顶部导航组件：折叠控制、系统标识、服务状态与会话操作 -->
<template>
  <!-- 顶部导航栏 -->
  <el-header class="app-header">
    <!-- 左侧菜单控制区 -->
    <div class="app-header__left">
      <el-button
        v-if="windowWidth > 1024"
        :aria-label="sidebarToggleLabel"
        :icon="isSidebarCollapsed ? Expand : Fold"
        circle
        class="app-header__toggle"
        text
        @click="appStore.toggleSidebarCollapsed"
      />
      <span v-if="windowWidth > 1024" class="app-header__divider" aria-hidden="true" />
      <div class="app-header__title">
        <span class="app-header__name">招人More微信小程序埋点检测系统</span>
        <span class="app-header__subtitle">本地埋点与异常观测</span>
      </div>
    </div>

    <!-- 右侧用户操作区 -->
    <div class="app-header__right">
      <span class="status-pill">
        <i class="status-pill__dot" aria-hidden="true" />
        {{ serviceLabel }}
      </span>
      <div class="app-header__user">
        <el-avatar :size="28" :src="authStore.userAvatar">{{ avatarText }}</el-avatar>
        <span class="app-header__user-name">{{ authStore.userName }}</span>
      </div>
      <el-button
        aria-label="退出登录"
        class="app-header__logout"
        :icon="SwitchButton"
        :loading="isLoggingOut"
        text
        type="danger"
        @click="handleLogout"
      >
        <span class="app-header__logout-text">退出登录</span>
      </el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { Expand, Fold, SwitchButton } from "@element-plus/icons-vue";

import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

/** 应用级 UI 状态。 */
const appStore = useAppStore();
/** 管理端鉴权状态。 */
const authStore = useAuthStore();
/** 路由实例。 */
const router = useRouter();
/** 退出登录状态。 */
const isLoggingOut = ref(false);
/** 当前接口服务展示名称。 */
const serviceLabel = import.meta.env.VITE_SERVICE_LABEL?.trim() || "当前服务";
/** 当前窗口宽度。 */
const { width: windowWidth } = useWindowSize();

/** 侧边栏实际折叠状态：与导航组件保持同一判断口径。 */
const isSidebarCollapsed = computed(() => appStore.isSidebarCollapsed || windowWidth.value <= 1024);
/** 折叠按钮的无障碍名称。 */
const sidebarToggleLabel = computed(() => (isSidebarCollapsed.value ? "展开导航" : "收起导航"));
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
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  height: $layout-header-height;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: 0 $space-5;
  border-bottom: 1px solid rgba(232, 236, 245, 0.7);
  background: rgba(237, 241, 248, 0.9);
  backdrop-filter: blur(12px);
}

.app-header__left,
.app-header__right {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: $space-3;
}

.app-header .app-header__toggle {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  color: $color-text-secondary;
}

.app-header .app-header__toggle:hover {
  background: $color-surface-subtle;
  color: $color-accent;
}

.app-header__divider {
  width: 1px;
  height: 22px;
  background: $color-border;
}

.app-header__title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.app-header__name {
  overflow: hidden;
  color: $color-text-primary;
  font-size: $font-size-md;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__subtitle {
  color: $color-text-secondary;
  font-size: $font-size-xs;
  letter-spacing: 0.02em;
  line-height: 14px;
}

.app-header__user {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: $space-2;
  padding-left: $space-3;
  border-left: 1px solid $color-border;
}

.app-header__user-name {
  max-width: 120px;
  overflow: hidden;
  color: $color-text-primary;
  font-size: $font-size-base;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header .app-header__logout {
  min-width: 36px;
  height: 36px;
  padding: 0 6px;
}

/* 顶栏左右内边距与主体内容保持同一断点，确保标题与卡片左缘对齐 */
@include screen-lg {
  .app-header {
    padding: 0 $space-4;
  }
}

@include screen-sm {
  .app-header {
    gap: $space-2;
    padding: 0 $space-3;
  }

  .app-header__right {
    gap: $space-2;
  }

  .status-pill,
  .app-header__subtitle,
  .app-header__divider,
  .app-header__user-name,
  .app-header__logout-text {
    display: none;
  }

  .app-header__user {
    padding-left: 0;
    border-left: 0;
  }

  .app-header__name {
    font-size: $font-size-base;
  }
}
</style>
