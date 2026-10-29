<!-- 复制按钮组件：一键复制文本，并在按钮上给出短暂的状态反馈 -->
<template>
  <button
    class="copy-button"
    type="button"
    :class="{ 'copy-button--done': copied }"
    :disabled="disabled"
    :title="buttonTitle"
    @click="handleCopy"
  >
    <el-icon class="copy-button__icon">
      <Check v-if="copied" />
      <CopyDocument v-else />
    </el-icon>
    <span class="copy-button__label" aria-live="polite">{{ copied ? "已复制" : label }}</span>
  </button>
</template>

<script setup lang="ts">
import { Check, CopyDocument } from "@element-plus/icons-vue";
// 走组件子路径导入，避免 Element Plus 桶入口把全量组件带进产物。
import { ElMessage } from "element-plus/es/components/message/index";

import { copyText } from "@/utils/clipboard";

const {
  text,
  label = "复制",
  disabled = false,
} = defineProps<{
  /** 待复制的文本内容。 */
  text: string;
  /** 按钮文案，默认「复制」。 */
  label?: string;
  /** 是否禁用复制，例如数据为空时。 */
  disabled?: boolean;
}>();

/** 复制成功后的短暂反馈状态。 */
const copied = ref(false);
/** 反馈状态复位定时器句柄。 */
let resetTimer: ReturnType<typeof setTimeout> | null = null;

/** 悬浮提示：禁用时说明原因，避免用户误以为按钮失效。 */
const buttonTitle = computed(() => (disabled ? "暂无可复制内容" : `${label}到剪贴板`));

/** 清理反馈复位定时器。 */
const clearResetTimer = () => {
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
  }
};

/** 复位反馈状态。 */
const resetCopiedState = () => {
  clearResetTimer();
  copied.value = false;
};

/** 执行复制，成功后就地给出反馈，失败时提示手动复制。 */
const handleCopy = async () => {
  if (disabled) {
    return;
  }

  const success = await copyText(text);

  if (!success) {
    ElMessage.error("复制失败，请手动选择内容复制");
    return;
  }

  clearResetTimer();
  copied.value = true;
  resetTimer = setTimeout(resetCopiedState, 1600);
};

// 复制内容随抽屉切换而变化时复位反馈，避免沿用上一条事件的「已复制」状态
watch(
  () => text,
  () => resetCopiedState(),
);

// 抽屉频繁开合时清理定时器，避免向已卸载实例写入状态
onBeforeUnmount(clearResetTimer);
</script>

<style scoped lang="scss">
.copy-button {
  display: inline-flex;
  height: 24px;
  flex: none;
  align-items: center;
  justify-content: center;
  /* 固定最小宽度：容纳「已复制」三字，避免反馈时按钮跳动 */
  min-width: 66px;
  gap: 4px;
  padding: 0 8px;
  border: 1px solid $color-border-soft;
  border-radius: $radius-xs;
  background: $color-surface;
  color: $color-text-muted;
  font-family: $font-sans;
  font-size: $font-size-xs;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    color $dur-fast $ease-out,
    border-color $dur-fast $ease-out,
    background-color $dur-fast $ease-out;
}

.copy-button:hover:not(:disabled) {
  border-color: $color-accent-tint;
  background: $color-accent-soft;
  color: $color-accent-strong;
}

.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 已复制态：与悬停态同色，强化操作成功的确认感 */
.copy-button--done {
  border-color: $color-accent-tint;
  background: $color-accent-soft;
  color: $color-accent-strong;
}

.copy-button__icon {
  font-size: 12px;
}

.copy-button__label {
  white-space: nowrap;
}

@include reduced-motion {
  .copy-button {
    transition: none;
  }
}
</style>
