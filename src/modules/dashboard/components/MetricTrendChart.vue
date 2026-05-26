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

import type { TraceMetricItem } from "@/api/trace";
import { toMetricTrendRows } from "@/utils/trace";

echarts.use([GridComponent, LegendComponent, TooltipComponent, BarChart, LineChart, CanvasRenderer]);

const { metricItems, loading = false, startTime, endTime } = defineProps<{
  /** 埋点聚合列表。 */
  metricItems: TraceMetricItem[];
  /** 图表加载状态。 */
  loading?: boolean;
  /** 查询开始时间。 */
  startTime?: string;
  /** 查询结束时间。 */
  endTime?: string;
}>();

/** 图表根节点。 */
const chartRootRef = useTemplateRef<HTMLDivElement>("chartRoot");
/** ECharts 图表实例。 */
let chartInstance: echarts.ECharts | null = null;

/** 趋势图聚合文案。 */
const trendGranularityText = computed(() => {
  if (!startTime || !endTime) {
    return "按小时聚合";
  }

  /** 开始日期。 */
  const startDate = startTime.slice(0, 10);
  /** 结束日期。 */
  const endDate = endTime.slice(0, 10);
  if (startDate === endDate) {
    return "按小时聚合";
  }

  /** 日期间隔毫秒数。 */
  const dateRangeDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
  /** 日期间隔天数。 */
  const dateRangeDays = dateRangeDuration / 86_400_000;

  return dateRangeDays > 31 ? "按月聚合" : "按日聚合";
});

/** 渲染趋势图。 */
const renderChart = () => {
  if (!chartRootRef.value) {
    return;
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
  }

  /** 趋势图行数据。 */
  const trendRows = toMetricTrendRows(metricItems, { startTime, endTime });
  chartInstance.setOption({
    color: ["#ef4444", "#f59e0b", "#10b981"],
    tooltip: { trigger: "axis" },
    legend: { top: 0, right: 8 },
    grid: { top: 44, right: 16, bottom: 32, left: 40 },
    xAxis: {
      type: "category",
      data: trendRows.map((trendRow) => trendRow.metricLabel ?? trendRow.metricHour.slice(5, 16)),
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      { name: "失败", type: "bar", stack: "total", data: trendRows.map((trendRow) => trendRow.failCount) },
      {
        name: "警告",
        type: "bar",
        stack: "total",
        data: trendRows.map((trendRow) => trendRow.warningCount),
      },
      {
        name: "成功",
        type: "line",
        smooth: true,
        data: trendRows.map((trendRow) => trendRow.successCount),
      },
    ],
  });
};

watch(() => [metricItems, startTime, endTime], renderChart, { deep: true });

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
