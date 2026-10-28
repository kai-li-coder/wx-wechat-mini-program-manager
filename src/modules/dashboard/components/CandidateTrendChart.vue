<!-- 候选人趋势图组件 -->
<template>
  <!-- 候选人趋势图卡片 -->
  <el-card v-loading="loading" class="candidate-trend-chart" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <PanelHeader subtitle="按当前聚合粒度统计去重候选人数" title="候选人趋势">
        <template #extra>
          <span class="meta-chip">{{ trendGranularityText }}</span>
          <el-radio-group v-model="chartMode" size="small">
            <el-radio-button value="line">折线图</el-radio-button>
            <el-radio-button value="bar">柱状图</el-radio-button>
          </el-radio-group>
        </template>
      </PanelHeader>
    </template>

    <!-- 图表内容区 -->
    <div class="candidate-trend-chart__body">
      <!-- 图表容器 -->
      <div ref="chartRoot" class="candidate-trend-chart__canvas" />

      <!-- 空数据提示 -->
      <EmptyState
        v-if="!hasCandidateTrendData"
        class="candidate-trend-chart__empty"
        description="当前筛选条件下没有候选人记录"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

import type { TraceDashboardCandidateTrend, TraceDashboardGranularity } from "@/api/trace";
import EmptyState from "@/components/EmptyState.vue";
import PanelHeader from "@/components/PanelHeader.vue";
import {
  chartAxisLabel,
  chartAxisLine,
  chartAxisPointer,
  chartColors,
  chartFontFamily,
  chartSplitLine,
  chartTooltip,
  prefersReducedMotion,
} from "@/constants/chartTheme";

echarts.use([GridComponent, TooltipComponent, BarChart, LineChart, CanvasRenderer]);

/** 候选人趋势图类型。 */
type CandidateTrendChartMode = "line" | "bar";

const { candidateTrend, loading = false } = defineProps<{
  /** 后端聚合后的候选人趋势数据。 */
  candidateTrend: TraceDashboardCandidateTrend;
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
/** 当前图表类型。 */
const chartMode = ref<CandidateTrendChartMode>("line");
/** ECharts 图表实例。 */
let chartInstance: echarts.ECharts | null = null;

/** 候选人趋势行。 */
const candidateTrendRows = computed(() => candidateTrend.rows ?? []);
/** 是否存在候选人趋势数据。 */
const hasCandidateTrendData = computed(() =>
  candidateTrendRows.value.some((candidateTrendRow) => candidateTrendRow.candidateCount > 0),
);

/** 趋势图聚合文案。 */
const trendGranularityText = computed(() => trendGranularityTextMap[candidateTrend.granularity]);

/** 折线图渐变填充：强调趋势走向，不喧宾夺主。 */
const lineAreaStyle = {
  color: {
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(79, 141, 247, 0.18)" },
      { offset: 1, color: "rgba(79, 141, 247, 0.01)" },
    ],
  },
};

/** 渲染候选人趋势图。 */
const renderChart = () => {
  if (!chartRootRef.value) {
    return;
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
  }

  /** 坐标轴标签列表。 */
  const axisLabels = candidateTrendRows.value.map(
    (candidateTrendRow) => candidateTrendRow.label || candidateTrendRow.bucket,
  );
  /** 是否为折线图。 */
  const isLineMode = chartMode.value === "line";

  chartInstance.clear();
  chartInstance.setOption({
    animation: !prefersReducedMotion(),
    color: [chartColors.accent],
    textStyle: { fontFamily: chartFontFamily },
    tooltip: { axisPointer: chartAxisPointer, trigger: "axis", ...chartTooltip },
    grid: { top: 18, right: 8, bottom: 4, left: 4, containLabel: true },
    xAxis: {
      type: "category",
      data: axisLabels,
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
        name: "候选人数",
        type: chartMode.value,
        barMaxWidth: 22,
        smooth: isLineMode,
        showSymbol: false,
        symbolSize: 6,
        lineStyle: { width: 2, color: chartColors.accent },
        itemStyle: { color: chartColors.accent, borderRadius: isLineMode ? 0 : [6, 6, 0, 0] },
        areaStyle: isLineMode ? lineAreaStyle : undefined,
        data: candidateTrendRows.value.map((candidateTrendRow) => candidateTrendRow.candidateCount),
      },
    ],
  });
};

watch(() => [candidateTrend, chartMode.value], renderChart, { deep: true });

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
.candidate-trend-chart {
  border-radius: $radius-md;
}

.candidate-trend-chart__body {
  position: relative;
  min-height: 320px;
}

.candidate-trend-chart__canvas {
  width: 100%;
  height: 320px;
}

.candidate-trend-chart__empty {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(2px);
}

@include screen-sm {
  .candidate-trend-chart__body {
    min-height: 260px;
  }

  .candidate-trend-chart__canvas {
    height: 260px;
  }
}
</style>
