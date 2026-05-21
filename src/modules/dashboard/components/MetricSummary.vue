<!-- 埋点总览指标卡片组件 -->
<template>
  <!-- 指标卡片列表 -->
  <div class="metric-summary">
    <!-- 事件总数卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">事件总数</span>
      <strong class="metric-summary__value">{{ summary.eventCount }}</strong>
    </el-card>

    <!-- 涉及链路卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">涉及链路</span>
      <strong class="metric-summary__value">{{ summary.flowCount }}</strong>
    </el-card>

    <!-- 涉及候选人卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">涉及候选人</span>
      <strong class="metric-summary__value">{{ summary.candidateCount }}</strong>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { TraceMetricSummary } from "@/utils/trace";

defineProps<{
  /** 埋点聚合摘要。 */
  summary: TraceMetricSummary;
}>();
</script>

<style scoped lang="scss">
.metric-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.metric-summary__card {
  border-radius: 8px;
}

.metric-summary__label {
  display: block;
  color: $color-text-secondary;
  font-size: 13px;
  line-height: 20px;
}

.metric-summary__value {
  display: block;
  margin-top: 8px;
  color: $color-text-primary;
  font-size: 30px;
  font-weight: 800;
  line-height: 38px;
}

@media (max-width: 768px) {
  .metric-summary {
    grid-template-columns: 1fr;
  }
}
</style>
