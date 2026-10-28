<!-- 空数据占位组件：统一的虚线框记号与说明文案 -->
<template>
  <div class="empty-state" role="status">
    <span class="empty-state__glyph" aria-hidden="true" />
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
const { title = "暂无数据", description = "" } = defineProps<{
  /** 空态主文案。 */
  title?: string;
  /** 空态补充说明。 */
  description?: string;
}>();
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  padding: $space-7 $space-4;
  text-align: center;
}

/* 浅青圆框 + 横线：不依赖插画资源的空态记号，呼应参考图的浅青图标 */
.empty-state__glyph {
  position: relative;
  display: block;
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
  border: 1px solid $color-accent-tint;
  border-radius: 50%;
  background: $color-accent-soft;
}

.empty-state__glyph::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: #9ccfd6;
  content: "";
  transform: translate(-50%, -50%);
}

.empty-state__title {
  color: $color-text-secondary;
  font-size: $font-size-base;
  font-weight: 500;
}

.empty-state__description {
  color: $color-text-muted;
  font-size: $font-size-xs;
}
</style>
