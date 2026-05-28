<!-- 错误预警面板组件 -->
<template>
  <!-- 错误预警卡片 -->
  <el-card v-loading="loading" :class="['error-warning-panel', `error-warning-panel--${summary.level}`]" shadow="never">
    <template #header>
      <!-- 面板标题栏 -->
      <div class="error-warning-panel__header">
        <span>错误预警</span>
        <el-tag :type="levelTagType" effect="dark">{{ levelText }}</el-tag>
      </div>
    </template>

    <!-- 空数据提示 -->
    <el-empty
      v-if="!hasWarningData"
      :image-size="72"
      class="error-warning-panel__empty"
      description="暂无可评估数据"
    />

    <!-- 预警内容区 -->
    <div v-else class="error-warning-panel__body">
      <!-- 预警状态区 -->
      <div class="error-warning-panel__status">
        <strong>{{ levelDescription }}</strong>
        <span>{{ summary.warningDate }} 统计结果</span>
      </div>

      <!-- 预警指标区 -->
      <div class="error-warning-panel__metrics">
        <div class="error-warning-panel__metric">
          <span>错误占比</span>
          <strong>{{ formatRate(summary.failRate) }}</strong>
        </div>
        <div class="error-warning-panel__metric">
          <span>失败事件</span>
          <strong>{{ summary.failCount }}/{{ summary.eventCount }}</strong>
        </div>
        <div class="error-warning-panel__metric">
          <span>受影响候选人</span>
          <strong>{{ summary.affectedCandidateCount }}/{{ summary.candidateCount }}</strong>
        </div>
      </div>

      <!-- 触发原因区 -->
      <div class="error-warning-panel__section">
        <span class="error-warning-panel__section-title">触发原因</span>
        <ul class="error-warning-panel__reason-list">
          <li v-for="triggerReason in summary.triggerReasons" :key="triggerReason">{{ triggerReason }}</li>
        </ul>
      </div>

      <!-- 阈值说明区 -->
      <div class="error-warning-panel__thresholds">
        <span v-for="thresholdText in thresholdTextItems" :key="thresholdText">{{ thresholdText }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { TraceDashboardErrorWarning, TraceDashboardErrorWarningLevel } from "@/api/trace";

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
/** 预警等级标签类型字典。 */
const levelTagTypeMap = {
  normal: "success",
  watch: "info",
  warning: "warning",
  critical: "danger",
} as const satisfies Record<TraceDashboardErrorWarningLevel, "success" | "info" | "warning" | "danger">;

/** 格式化百分比。 */
const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;

/** 是否存在可评估数据。 */
const hasWarningData = computed(() => summary.eventCount > 0);
/** 预警等级文案。 */
const levelText = computed(() => levelTextMap[summary.level]);
/** 预警等级描述。 */
const levelDescription = computed(() => levelDescriptionMap[summary.level]);
/** 预警等级标签类型。 */
const levelTagType = computed(() => levelTagTypeMap[summary.level]);
/** 预警阈值说明文案。 */
const thresholdTextItems = computed(() => [
  `观察：错误占比 ≥ ${formatRate(summary.thresholds.watch.failRate)} 且失败事件 ≥ ${summary.thresholds.watch.failCount}`,
  `预警：错误占比 ≥ ${formatRate(summary.thresholds.warning.failRate)} 且失败事件 ≥ ${summary.thresholds.warning.failCount}`,
  `严重：错误占比 ≥ ${formatRate(summary.thresholds.critical.failRate)} 且失败事件 ≥ ${summary.thresholds.critical.failCount}，或受影响候选人占比 ≥ ${formatRate(summary.thresholds.critical.affectedCandidateRate)} 且受影响候选人 ≥ ${summary.thresholds.critical.affectedCandidateCount}`,
]);
</script>

<style scoped lang="scss">
.error-warning-panel {
  border-radius: 8px;
}

.error-warning-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}

.error-warning-panel__empty {
  min-height: 248px;
}

.error-warning-panel__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-warning-panel__status {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid $color-border;
  border-radius: 8px;
  background: #f9fafb;
}

.error-warning-panel__status strong {
  color: $color-text-primary;
  font-size: 18px;
  line-height: 24px;
}

.error-warning-panel__status span {
  color: $color-text-secondary;
  font-size: 13px;
  line-height: 20px;
}

.error-warning-panel__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.error-warning-panel__metric {
  min-width: 0;
  padding: 12px;
  border: 1px solid $color-border;
  border-radius: 8px;
}

.error-warning-panel__metric span {
  display: block;
  color: $color-text-secondary;
  font-size: 12px;
  line-height: 18px;
}

.error-warning-panel__metric strong {
  display: block;
  margin-top: 6px;
  color: $color-text-primary;
  font-size: 18px;
  line-height: 24px;
}

.error-warning-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-warning-panel__section-title {
  color: $color-text-primary;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.error-warning-panel__reason-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: $color-text-secondary;
  font-size: 13px;
  line-height: 20px;
}

.error-warning-panel__thresholds {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid $color-border;
  color: $color-text-muted;
  font-size: 12px;
  line-height: 18px;
}

.error-warning-panel--warning .error-warning-panel__status {
  border-color: #f59e0b;
  background: #fffbeb;
}

.error-warning-panel--critical .error-warning-panel__status {
  border-color: #ef4444;
  background: #fef2f2;
}

@media (max-width: 768px) {
  .error-warning-panel__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
