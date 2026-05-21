<!-- 埋点结果标签组件 -->
<template>
  <!-- 结果状态标签 -->
  <el-tag :type="tagType" effect="light" round>{{ tagText }}</el-tag>
</template>

<script setup lang="ts">
import type { TagProps } from "element-plus";

const { result = "" } = defineProps<{
  /** 埋点结果值。 */
  result?: string;
}>();

/** 结果标签类型。 */
const tagType = computed<TagProps["type"]>(() => {
  if (result === "success") {
    return "success";
  }
  if (result === "warning") {
    return "warning";
  }
  if (result === "fail") {
    return "danger";
  }
  return "info";
});

/** 结果标签文案。 */
const tagText = computed(() => {
  const resultTextMap: Record<string, string> = {
    success: "成功",
    warning: "警告",
    fail: "失败",
  };
  return resultTextMap[result] || result || "-";
});
</script>
