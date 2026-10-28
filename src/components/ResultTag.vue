<!-- 埋点结果标签组件：色点 + 文案的双重编码，避免仅靠颜色传达状态 -->
<template>
  <span :class="['result-tag', `result-tag--${tone}`]">
    <i class="result-tag__dot" aria-hidden="true" />
    {{ tagText }}
  </span>
</template>

<script setup lang="ts">
/** 结果标签色调。 */
type ResultTone = "success" | "warning" | "danger" | "neutral";

const { result = "" } = defineProps<{
  /** 埋点结果值。 */
  result?: string;
}>();

/** 结果色调映射。 */
const resultToneMap: Record<string, ResultTone> = {
  success: "success",
  warning: "warning",
  fail: "danger",
};

/** 结果文案映射。 */
const resultTextMap: Record<string, string> = {
  success: "成功",
  warning: "警告",
  fail: "失败",
};

/** 结果标签色调。 */
const tone = computed<ResultTone>(() => resultToneMap[result] ?? "neutral");

/** 结果标签文案。 */
const tagText = computed(() => resultTextMap[result] || result || "-");
</script>

<style scoped lang="scss">
.result-tag {
  display: inline-flex;
  height: 22px;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid transparent;
  border-radius: $radius-pill;
  background: $color-surface-subtle;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.result-tag__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentcolor;
}

.result-tag--success {
  background: $color-success-soft;
  color: $color-success;
}

.result-tag--warning {
  background: $color-warning-soft;
  color: $color-warning;
}

.result-tag--danger {
  background: $color-danger-soft;
  color: $color-danger;
}
</style>
