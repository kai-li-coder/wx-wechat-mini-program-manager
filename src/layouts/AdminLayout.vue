<!-- 管理后台主布局组件：暗色导航 + 纸质画布工作区 -->
<template>
  <!-- 管理端布局容器 -->
  <el-container class="admin-layout">
    <!-- 左侧导航栏 -->
    <AppSidebar />

    <!-- 右侧工作区 -->
    <el-container class="admin-layout__workspace">
      <!-- 顶部导航栏 -->
      <AppHeader />

      <!-- 页面内容区 -->
      <el-main class="admin-layout__main">
        <div class="admin-layout__content">
          <RouterView />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import AppHeader from "@/layouts/components/AppHeader.vue";
import AppSidebar from "@/layouts/components/AppSidebar.vue";
</script>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
  background: $color-background;
}

.admin-layout__workspace {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

/* 工作区画布：两处极低透明度径向光晕，替代纯色平铺 */
.admin-layout__main {
  min-height: calc(100vh - #{$layout-header-height});
  padding: 0;
  background:
    radial-gradient(900px 480px at 94% -10%, rgba(34, 197, 94, 0.08), transparent 60%),
    radial-gradient(760px 440px at 0% 0%, rgba(79, 141, 247, 0.08), transparent 58%),
    $color-background;
}

.admin-layout__content {
  width: 100%;
  max-width: $layout-content-max;
  margin: 0 auto;
  padding: $space-7 $space-5 $space-9;
}

@include screen-lg {
  .admin-layout__content {
    padding: $space-6 $space-4 $space-8;
  }
}

@include screen-sm {
  .admin-layout__content {
    padding: $space-5 $space-3 $space-7;
  }
}
</style>
