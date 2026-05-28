<!-- 埋点异常趋势图组件 -->
<template>
  <!-- 趋势图卡片 -->
  <el-card v-loading="loading" class="chart-card" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <div class="chart-card__header">
        <span>异常趋势</span>
        <el-tag effect="plain">{{ trendGranularityText }}</el-tag>
      </div>
    </template>

    <!-- 图表容器 -->
    <div ref="chartRoot" class="chart-card__body" />
  </el-card>
</template>

<script setup lang="ts">
import * as echarts from "echarts/core";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { BarChart, LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

import type { TraceDashboardGranularity, TraceDashboardTrend } from "@/api/trace";

echarts.use([GridComponent, LegendComponent, TooltipComponent, BarChart, LineChart, CanvasRenderer]);

const { trend, loading = false } = defineProps<{
  /** 后端聚合后的异常趋势数据。 */
  trend: TraceDashboardTrend;
  /** 图表加载状态。 */
  loading?: boolean;
}>();

/** 趋势粒度文案字典。 */
const trendGranularityTextMap: Record<TraceDashboardGranularity, string> = {
  hour: "按小时聚合",
  day: "按日聚合",
  month: "按月聚合",
};
/** 图表根节点。 */
const chartRootRef = useTemplateRef<HTMLDivElement>("chartRoot");
/** ECharts 图表实例。 */
let chartInstance: echarts.ECharts | null = null;

/** 趋势图聚合文案。 */
const trendGranularityText = computed(() => trendGranularityTextMap[trend.granularity]);
/** 异常趋势行数据。 */
const trendRows = computed(() => trend.rows ?? []);

/** 渲染趋势图。 */
const renderChart = () => {
  if (!chartRootRef.value) {
    return;
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
  }

  chartInstance.setOption({
    color: ["#ef4444", "#f59e0b", "#10b981"],
    tooltip: { trigger: "axis" },
    legend: { top: 0, right: 8 },
    grid: { top: 44, right: 16, bottom: 32, left: 40 },
    xAxis: {
      type: "category",
      data: trendRows.value.map((trendRow) => trendRow.label || trendRow.bucket),
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      { name: "失败", type: "bar", stack: "total", data: trendRows.value.map((trendRow) => trendRow.failCount) },
      {
        name: "警告",
        type: "bar",
        stack: "total",
        data: trendRows.value.map((trendRow) => trendRow.warningCount),
      },
      {
        name: "成功",
        type: "line",
        smooth: true,
        data: trendRows.value.map((trendRow) => trendRow.successCount),
      },
    ],
  });
};

watch(() => trend, renderChart, { deep: true });

tryOnMounted(() => {
  renderChart();
});

useResizeObserver(chartRootRef, () => {
  chartInstance?.resize();
});

tryOnUnmounted(() => {
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped lang="scss">
.chart-card {
  border-radius: 8px;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}

.chart-card__body {
  width: 100%;
  height: 320px;
}
</style>
