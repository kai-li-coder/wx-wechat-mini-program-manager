<!-- 埋点总览指标卡片组件 -->
<template>
  <!-- 指标卡片列表 -->
  <div class="metric-summary">
    <!-- 事件总数卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">事件总数</span>
      <strong class="metric-summary__value">{{ summary.eventCount }}</strong>
    </el-card>

    <!-- 成功数卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">成功数</span>
      <strong class="metric-summary__value metric-summary__value--success">{{ summary.successCount }}</strong>
    </el-card>

    <!-- 警告数卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">警告数</span>
      <strong class="metric-summary__value metric-summary__value--warning">{{ summary.warningCount }}</strong>
    </el-card>

    <!-- 错误数卡片 -->
    <el-card class="metric-summary__card" shadow="never">
      <span class="metric-summary__label">错误数</span>
      <strong class="metric-summary__value metric-summary__value--danger">{{ summary.failCount }}</strong>
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
import type { TraceDashboardSummary } from "@/api/trace";

/** 埋点总览摘要展示数据。 */
interface MetricSummaryDisplayData extends TraceDashboardSummary {
  /** 成功事件数。 */
  successCount: number;
  /** 警告事件数。 */
  warningCount: number;
  /** 失败事件数。 */
  failCount: number;
}

defineProps<{
  /** 埋点聚合摘要。 */
  summary: MetricSummaryDisplayData;
}>();
</script>

<style scoped lang="scss">
.metric-summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
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

.metric-summary__value--success {
  color: #16a34a;
}

.metric-summary__value--warning {
  color: #d97706;
}

.metric-summary__value--danger {
  color: #dc2626;
}

@media (max-width: 1180px) {
  .metric-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .metric-summary {
    grid-template-columns: 1fr;
  }
}
</style>
