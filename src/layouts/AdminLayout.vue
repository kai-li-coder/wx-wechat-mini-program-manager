<!-- 管理后台主布局组件 -->
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
        <RouterView />
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
  flex-direction: column;
  min-width: 0;
}

.admin-layout__main {
  min-height: calc(100vh - 64px);
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 32%),
    $color-background;
}

@media (max-width: 768px) {
  .admin-layout__main {
    padding: 16px;
  }
}
</style>
