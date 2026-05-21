<!-- JSON 数据查看组件 -->
<template>
  <!-- JSON 内容区域 -->
  <pre class="json-viewer">{{ formattedJsonText }}</pre>
</template>

<script setup lang="ts">
const { value } = defineProps<{
  /** 待格式化展示的数据。 */
  value: unknown;
}>();

/** 格式化后的 JSON 文本。 */
const formattedJsonText = computed(() => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
});
</script>

<style scoped lang="scss">
.json-viewer {
  max-height: 360px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: #0f172a;
  color: #dbeafe;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
