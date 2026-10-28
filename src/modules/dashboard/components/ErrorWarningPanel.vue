<!-- 错误预警面板组件：等级状态带、关键指标与阈值口径 -->
<template>
  <!-- 错误预警卡片 -->
  <el-card v-loading="loading" class="error-warning-panel" shadow="never">
    <template #header>
      <!-- 面板标题栏 -->
      <PanelHeader subtitle="按错误占比与影响范围分级" title="错误预警">
        <template #extra>
          <span :class="['level-chip', `level-chip--${summary.level}`]">
            <i class="level-chip__dot" aria-hidden="true" />
            {{ levelText }}
          </span>
        </template>
      </PanelHeader>
    </template>

    <!-- 空数据提示 -->
    <EmptyState v-if="!hasWarningData" description="当前筛选条件下没有可评估的埋点数据" />

    <!-- 预警内容区 -->
    <div v-else class="error-warning-panel__body">
      <!-- 预警状态区 -->
      <div :class="['warning-status', `warning-status--${summary.level}`]">
        <span class="warning-status__marker" aria-hidden="true" />
        <div class="warning-status__text">
          <strong>{{ levelDescription }}</strong>
          <span>{{ warningDateText }} 统计结果</span>
        </div>
      </div>

      <!-- 预警指标区 -->
      <div class="warning-metrics">
        <div class="warning-metric">
          <span class="warning-metric__label">错误占比</span>
          <strong class="warning-metric__value">{{ formatRate(summary.failRate) }}</strong>
          <span class="warning-metric__hint">失败 / 全部事件</span>
        </div>
        <div class="warning-metric">
          <span class="warning-metric__label">失败事件</span>
          <strong class="warning-metric__value"
            >{{ summary.failCount }}/{{ summary.eventCount }}</strong
          >
          <span class="warning-metric__hint">当前统计范围</span>
        </div>
        <div class="warning-metric">
          <span class="warning-metric__label">受影响候选人</span>
          <strong class="warning-metric__value"
            >{{ summary.affectedCandidateCount }}/{{ summary.candidateCount }}</strong
          >
          <span class="warning-metric__hint">受影响 / 全部候选人</span>
        </div>
      </div>

      <!-- 触发原因区 -->
      <section class="warning-section">
        <h3 class="warning-section__title">触发原因</h3>
        <ul class="warning-reasons">
          <li v-for="triggerReason in summary.triggerReasons" :key="triggerReason">
            {{ triggerReason }}
          </li>
        </ul>
      </section>

      <!-- 阈值说明区 -->
      <section class="warning-section warning-section--thresholds">
        <h3 class="warning-section__title">阈值口径</h3>
        <p
          v-for="thresholdText in thresholdTextItems"
          :key="thresholdText"
          class="warning-threshold"
        >
          {{ thresholdText }}
        </p>
      </section>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { TraceDashboardErrorWarning, TraceDashboardErrorWarningLevel } from "@/api/trace";
import EmptyState from "@/components/EmptyState.vue";
import PanelHeader from "@/components/PanelHeader.vue";

const { summary, loading = false } = defineProps<{
  /** 错误预警摘要。 */
  summary: TraceDashboardErrorWarning;
  /** 加载状态。 */
  loading?: boolean;
}>();

/** 预警等级文案字典。 */
const levelTextMap: Record<TraceDashboardErrorWarningLevel, string> = {
  normal: "正常",
  watch: "观察",
  warning: "预警",
  critical: "严重",
};
/** 预警等级描述字典。 */
const levelDescriptionMap: Record<TraceDashboardErrorWarningLevel, string> = {
  normal: "当前错误占比处于正常范围",
  watch: "错误占比进入观察区间",
  warning: "错误占比达到预警阈值",
  critical: "错误风险达到严重等级",
};

/** 格式化百分比。 */
const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;

/** 是否存在可评估数据。 */
const hasWarningData = computed(() => summary.eventCount > 0);
/** 预警统计日期文案。 */
const warningDateText = computed(() => summary.warningDate || "未指定日期");
/** 预警等级文案。 */
const levelText = computed(() => levelTextMap[summary.level]);
/** 预警等级描述。 */
const levelDescription = computed(() => levelDescriptionMap[summary.level]);
/** 预警阈值说明文案。 */
const thresholdTextItems = computed(() => [
  `观察：错误占比 ≥ ${formatRate(summary.thresholds.watchFailRate)} 且失败事件 ≥ ${summary.thresholds.watchFailCount}`,
  `预警：错误占比 ≥ ${formatRate(summary.thresholds.warningFailRate)} 且失败事件 ≥ ${summary.thresholds.warningFailCount}`,
  `严重：错误占比 ≥ ${formatRate(summary.thresholds.criticalFailRate)} 且失败事件 ≥ ${summary.thresholds.criticalFailCount}，或受影响候选人占比 ≥ ${formatRate(summary.thresholds.criticalCandidateRate)} 且受影响候选人 ≥ ${summary.thresholds.criticalCandidateCount}`,
]);
</script>

<style scoped lang="scss">
.error-warning-panel {
  border-radius: $radius-md;
}

.error-warning-panel__body {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

/* 状态带：柔和色块 + 状态点，与参考图的浅色卡片一致 */
.warning-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px $space-4;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  background: $color-surface-subtle;
}

.warning-status__marker {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $color-text-muted;
}

.warning-status__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warning-status__text strong {
  color: $color-text-primary;
  font-size: $font-size-md;
  font-weight: 600;
  line-height: 22px;
}

.warning-status__text span {
  color: $color-text-muted;
  font-size: $font-size-xs;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.warning-status--normal {
  background: $color-success-soft;
}

.warning-status--normal .warning-status__marker {
  background: #22c55e;
}

.warning-status--watch {
  background: $color-info-soft;
}

.warning-status--watch .warning-status__marker {
  background: $color-info;
}

.warning-status--warning {
  background: $color-warning-soft;
}

.warning-status--warning .warning-status__marker {
  background: #f59e0b;
}

.warning-status--critical {
  background: $color-danger-soft;
}

.warning-status--critical .warning-status__marker {
  background: #ef4444;
}

/* 三项关键指标：竖线分隔，避免卡片套卡片 */
.warning-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid $color-border-soft;
  border-bottom: 1px solid $color-border-soft;
}

.warning-metric {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: $space-3 $space-3 $space-3 0;
}

.warning-metric + .warning-metric {
  padding-left: $space-4;
  border-left: 1px solid $color-border-soft;
}

.warning-metric__label {
  color: $color-text-secondary;
  font-size: $font-size-xs;
  line-height: 16px;
}

.warning-metric__value {
  color: $color-text-primary;
  font-size: $font-size-lg;
  font-weight: 700;
  line-height: 22px;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.warning-metric__hint {
  color: $color-text-muted;
  font-size: $font-size-xs;
  line-height: 16px;
}

.warning-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.warning-section__title {
  color: $color-text-primary;
  font-size: $font-size-sm;
  font-weight: 600;
  line-height: 18px;
}

.warning-reasons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.warning-reasons li {
  position: relative;
  padding-left: 14px;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 20px;
}

/* 方形标记：与等宽编号同一套几何语言 */
.warning-reasons li::before {
  position: absolute;
  top: 7px;
  left: 2px;
  width: 5px;
  height: 5px;
  background: $color-warning;
  content: "";
}

.warning-section--thresholds {
  padding-top: $space-3;
  border-top: 1px solid $color-border-soft;
}

.warning-threshold {
  color: $color-text-muted;
  font-size: $font-size-xs;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}

@include screen-sm {
  .warning-metrics {
    grid-template-columns: 1fr;
  }

  .warning-metric {
    padding: $space-3 0;
  }

  .warning-metric + .warning-metric {
    padding-left: 0;
    border-top: 1px solid $color-border-soft;
    border-left: 0;
  }
}
</style>
