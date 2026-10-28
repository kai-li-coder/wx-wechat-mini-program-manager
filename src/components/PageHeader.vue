<!-- 页面标题区组件：标题、说明与右侧操作 -->
<template>
  <header class="page-header">
    <!-- 标题主信息 -->
    <div class="page-header__main">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>

    <!-- 页面右侧操作区 -->
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </header>
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
  gap: $space-6;
  margin-bottom: $space-6;
}

.page-header__main {
  min-width: 0;
}

.page-header__title {
  color: $color-text-primary;
  font-size: $font-size-display;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.page-header__description {
  max-width: 62ch;
  margin-top: 6px;
  color: $color-text-secondary;
  font-size: $font-size-base;
  line-height: 1.7;
}

.page-header__extra {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: $space-2;
  padding-bottom: 2px;
}

@include screen-sm {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-5;
  }

  .page-header__title {
    font-size: $font-size-2xl;
  }

  .page-header__description {
    margin-top: 4px;
    font-size: $font-size-sm;
  }

  .page-header__extra {
    width: 100%;
    padding-bottom: 0;
  }
}
</style>
