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
}

/* 内容区：固定在工作区剩余高度内，禁止表格内容把外层工作区撑出滚动 */
.admin-layout__content {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  width: 100%;
  /* 水平留白恒为 32px：左侧与浮动菜单栏拉开固定间距，右侧贴视口留同宽空白；
     不设 max-width 与居中，避免宽屏下自动居中把两侧间距撑大 */
  padding: $space-7 $layout-gutter $space-4;
}

@include screen-lg {
  .admin-layout__content {
    /* 窄桌面仅收窄顶部留白，水平 32px 间距按需求保持不变 */
    padding-top: $space-6;
  }
}

@include screen-sm {
  .admin-layout__content {
    /* 小屏恢复自然文档流，避免纵向查询表单被固定高度压缩 */
    flex: 0 0 auto;
    min-height: auto;
    /* 纵向留白随小屏压缩，水平 32px 间距仍然恒定 */
    padding: $space-5 $layout-gutter 10px;
  }
}
</style>
