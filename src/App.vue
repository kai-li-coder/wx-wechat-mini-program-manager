<!-- 管理端应用根组件 -->
<template>
  <!-- 全局 Element Plus 配置：注入中文语言包，统一组件文案与日期面板年月展示 -->
  <el-config-provider :locale="zhCn">
    <!-- 路由出口 -->
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
// Element Plus 中文语言包
import zhCn from "element-plus/es/locale/lang/zh-cn";
</script>
