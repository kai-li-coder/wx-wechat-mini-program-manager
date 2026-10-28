<!-- 面板标题组件：统一卡片标题层级与右侧操作区 -->
<template>
  <div class="panel-head">
    <!-- 标题主信息 -->
    <div class="panel-head__main">
      <div class="panel-head__text">
        <h2 class="panel-head__title">{{ title }}</h2>
        <p v-if="subtitle" class="panel-head__subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <!-- 右侧操作区 -->
    <div v-if="$slots.extra" class="panel-head__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { title, subtitle = "" } = defineProps<{
  /** 面板标题。 */
  title: string;
  /** 面板补充说明，用于解释数据口径或图形编码。 */
  subtitle?: string;
}>();
</script>

<style scoped lang="scss">
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.panel-head__main {
  display: flex;
  min-width: 0;
  align-items: center;
}

.panel-head__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.panel-head__title {
  color: $color-text-primary;
  font-size: $font-size-lg;
  font-weight: 700;
  line-height: 22px;
  letter-spacing: 0;
}

.panel-head__subtitle {
  color: $color-text-muted;
  font-size: $font-size-xs;
  line-height: 16px;
}

.panel-head__extra {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: $space-2;
}

@include screen-sm {
  .panel-head__subtitle {
    display: none;
  }
}
</style>
