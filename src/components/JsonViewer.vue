<!-- JSON 数据查看组件：深色代码面板，附带行数等宽元信息 -->
<template>
  <div class="json-viewer">
    <!-- 面板信息条 -->
    <div class="json-viewer__bar">
      <span class="json-viewer__label">JSON</span>
      <span class="json-viewer__meta">{{ lineCount }} 行</span>
    </div>

    <!-- JSON 内容区域 -->
    <pre class="json-viewer__code">{{ formattedJsonText }}</pre>
  </div>
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

/** 内容行数，用于快速判断数据体量。 */
const lineCount = computed(() =>
  formattedJsonText.value === "-" ? 0 : formattedJsonText.value.split("\n").length,
);
</script>

<style scoped lang="scss">
.json-viewer {
  overflow: hidden;
  border: 1px solid #232a40;
  border-radius: 12px;
  background: #171c2e;
}

.json-viewer__bar {
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: space-between;
  padding: 0 $space-3;
  border-bottom: 1px solid #232a40;
  background: #1e2438;
}

.json-viewer__label {
  @include text-micro;

  color: #4ade80;
}

.json-viewer__meta {
  color: #8b93a7;
  font-family: $font-mono;
  font-size: $font-size-2xs;
  letter-spacing: 0.04em;
}

.json-viewer__code {
  max-height: 340px;
  margin: 0;
  overflow: auto;
  padding: $space-3 $space-4;
  color: #d7e0f0;
  font-family: $font-mono;
  font-size: 11.5px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
  tab-size: 2;
}
</style>
