<!-- 页面标题区组件 -->
<template>
  <!-- 页面标题栏 -->
  <section class="page-header">
    <div>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <!-- 页面右侧操作区 -->
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </section>
</template>

<script setup lang="ts">
const { title, description = "" } = defineProps<{
  /** 页面主标题。 */
  title: string;
  /** 页面辅助说明。 */
  description?: string;
}>();
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-header__title {
  margin: 0;
  color: $color-text-primary;
  font-size: 24px;
  font-weight: 800;
  line-height: 32px;
}

.page-header__description {
  margin: 6px 0 0;
  color: $color-text-secondary;
  font-size: 14px;
  line-height: 22px;
}

.page-header__extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
