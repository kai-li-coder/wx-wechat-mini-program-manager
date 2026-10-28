<!-- 管理后台主布局组件：青蓝导航 + 浅青画布工作区 -->
<template>
  <!-- 管理端布局容器 -->
  <el-container class="admin-layout">
    <!-- 左侧导航栏 -->
    <AppSidebar />

    <!-- 右侧工作区 -->
    <el-container class="admin-layout__workspace">
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
import AppSidebar from "@/layouts/components/AppSidebar.vue";
</script>

<style scoped lang="scss">
/* 固定视口高度：滚动统一交给右侧工作区，使页面可自行划分「固定区 + 独立滚动区」 */
.admin-layout {
  height: 100vh;
  height: 100dvh;
  background: $color-background;
}

.admin-layout__workspace {
  display: flex;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

/* 工作区画布：高度受限于视口，纵向滚动由自身承担；顶栏已移除，内容区直接占满 */
.admin-layout__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  /* 预留滚动条槽位：列表数据增减导致滚动条出现/消失时内容宽度不抖动 */
  scrollbar-gutter: stable;
  padding: 0;
  background:
    radial-gradient(900px 480px at 94% -10%, rgba(10, 144, 161, 0.07), transparent 60%),
    radial-gradient(760px 440px at 0% 0%, rgba(124, 196, 205, 0.1), transparent 58%),
    $color-background;
}

/* 内容区：固定在工作区剩余高度内，禁止表格内容把外层工作区撑出滚动 */
.admin-layout__content {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  width: 100%;
  max-width: $layout-content-max;
  margin: 0 auto;
  padding: $space-7 $space-5 $space-4;
}

@include screen-lg {
  .admin-layout__content {
    padding: $space-6 $space-4 $space-4;
  }
}

@include screen-sm {
  .admin-layout__content {
    /* 小屏恢复自然文档流，避免纵向查询表单被固定高度压缩 */
    flex: 0 0 auto;
    min-height: auto;
    /* 小屏菜单底部留白为 10px，内容区保持同一边界 */
    padding: $space-5 $space-3 10px;
  }
}
</style>
