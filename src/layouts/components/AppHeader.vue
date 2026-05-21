<!-- 管理后台顶部导航组件 -->
<template>
  <!-- 顶部导航栏 -->
  <el-header class="app-header">
    <!-- 左侧菜单控制区 -->
    <div class="app-header__left">
      <el-button
        :icon="appStore.isSidebarCollapsed ? Expand : Fold"
        circle
        text
        type="primary"
        @click="appStore.toggleSidebarCollapsed"
      />
      <div class="app-header__title">
        <span class="app-header__name">微信小程序后台管理系统</span>
        <span class="app-header__subtitle">本地埋点与异常观测</span>
      </div>
    </div>

    <!-- 右侧用户操作区 -->
    <div class="app-header__right">
      <el-tag effect="plain" type="success">本地后端 8080</el-tag>
      <div class="app-header__user">
        <el-avatar :size="28" :src="authStore.userAvatar">{{ avatarText }}</el-avatar>
        <span class="app-header__user-name">{{ authStore.userName }}</span>
      </div>
      <el-button :icon="SwitchButton" :loading="isLoggingOut" text type="danger" @click="handleLogout">
        退出登录
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
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid $color-border;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
}

.app-header__left,
.app-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-header__name {
  color: $color-text-primary;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.app-header__subtitle {
  color: $color-text-secondary;
  font-size: 12px;
  line-height: 18px;
}

.app-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.app-header__user-name {
  max-width: 120px;
  overflow: hidden;
  color: $color-text-primary;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }

  .app-header__right {
    display: none;
  }
}
</style>
