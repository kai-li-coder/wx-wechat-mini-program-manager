<!-- 埋点异常趋势图组件 -->
<template>
  <!-- 趋势图卡片 -->
  <el-card v-loading="loading" class="chart-card" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <PanelHeader subtitle="失败与警告堆叠显示，成功为独立折线" title="异常趋势">
        <template #extra>
          <span class="meta-chip">{{ trendGranularityText }}</span>
        </template>
      </PanelHeader>
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
import PanelHeader from "@/components/PanelHeader.vue";
import {
  chartAxisLabel,
  chartAxisLine,
  chartAxisPointer,
  chartColors,
  chartFontFamily,
  chartLegend,
  chartSplitLine,
  chartTooltip,
  prefersReducedMotion,
} from "@/constants/chartTheme";

echarts.use([
  GridComponent,
  LegendComponent,
  TooltipComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
]);

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
    animation: !prefersReducedMotion(),
    color: [chartColors.fail, chartColors.warning, chartColors.success],
    textStyle: { fontFamily: chartFontFamily },
    tooltip: { axisPointer: chartAxisPointer, trigger: "axis", ...chartTooltip },
    legend: { ...chartLegend, top: 0, right: 0 },
    grid: { top: 46, right: 8, bottom: 4, left: 4, containLabel: true },
    xAxis: {
      type: "category",
      data: trendRows.value.map((trendRow) => trendRow.label || trendRow.bucket),
      axisLabel: chartAxisLabel,
      axisLine: chartAxisLine,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: chartAxisLabel,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: chartSplitLine,
    },
    series: [
      {
        name: "失败",
        type: "bar",
        stack: "total",
        barMaxWidth: 18,
        itemStyle: { color: chartColors.fail },
        emphasis: { focus: "series" },
        data: trendRows.value.map((trendRow) => trendRow.failCount),
      },
      {
        name: "警告",
        type: "bar",
        stack: "total",
        barMaxWidth: 18,
        itemStyle: { color: chartColors.warning },
        emphasis: { focus: "series" },
        data: trendRows.value.map((trendRow) => trendRow.warningCount),
      },
      {
        name: "成功",
        type: "line",
        smooth: true,
        showSymbol: false,
        symbolSize: 6,
        lineStyle: { width: 2, color: chartColors.success },
        itemStyle: { color: chartColors.success },
        emphasis: { focus: "series" },
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
/* 卡片纵向弹性布局：同行卡片被拉伸到等高时，画布同步增高而不留白 */
.chart-card {
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
}

.chart-card :deep(.el-card__header) {
  flex: 0 0 auto;
}

/* 内容区收紧纵向留白（22px → 16px），横向沿用 22px 与其它卡片对齐；
   纵向弹性使画布的 flex-basis 作用于高度，而不是宽度 */
.chart-card :deep(.el-card__body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px 22px;
}

/* 画布以统一基准高度为下限，行高更高时可继续增长 */
.chart-card__body {
  width: 100%;
  min-height: $chart-canvas-height;
  flex: 1 1 $chart-canvas-height;
}

@include screen-sm {
  .chart-card :deep(.el-card__body) {
    padding: 14px 16px;
  }

  .chart-card__body {
    min-height: $chart-canvas-height-sm;
    flex-basis: $chart-canvas-height-sm;
  }
}
</style>
