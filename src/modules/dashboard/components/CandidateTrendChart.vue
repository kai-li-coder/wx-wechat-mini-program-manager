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
import { useChartResize } from "@/composables/useChartResize";
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
/** 图表尺寸自适应：节流 + 跳过 ResizeObserver 首帧冗余回调。 */
const { markRendered } = useChartResize(chartRootRef, () => chartInstance);
/** 上一次渲染使用的图表类型，用于判断是否需要替换整个系列。 */
let lastRenderedChartMode: CandidateTrendChartMode | null = null;

/** 折线图渐变填充：强调趋势走向，不喧宾夺主。 */
const lineAreaStyle = {
  color: {
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(10, 144, 161, 0.16)" },
      { offset: 1, color: "rgba(10, 144, 161, 0.01)" },
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
    // 记录初始化时的容器尺寸，供紧随其后的首帧尺寸回调比对。
    markRendered();
  }

  /** 坐标轴标签列表。 */
  const axisLabels: string[] = [];
  /** 去重候选人数序列。 */
  const candidateCounts: number[] = [];
  // 单次遍历同时产出坐标轴与数据序列。
  for (const candidateTrendRow of candidateTrendRows.value) {
    axisLabels.push(candidateTrendRow.label || candidateTrendRow.bucket);
    candidateCounts.push(candidateTrendRow.candidateCount);
  }

  /** 是否为折线图。 */
  const isLineMode = chartMode.value === "line";
  // 仅在折线/柱状切换时替换系列：merge 模式下 areaStyle: undefined 无法清除上一次的渐变填充；
  // 纯数据刷新保留 merge，让 ECharts 复用已有系列实例，避免每次刷新都全量重建。
  const shouldReplaceSeries = lastRenderedChartMode !== null && lastRenderedChartMode !== chartMode.value;

  chartInstance.setOption(
    {
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
          data: candidateCounts,
        },
      ],
    },
    shouldReplaceSeries ? { replaceMerge: ["series"] } : undefined,
  );

  lastRenderedChartMode = chartMode.value;
};

// 用数组形式分别声明两个依赖，避免 `() => [a, b]` 每次求值都返回新数组导致比较恒不相等；
// 同时去掉 deep：父组件整体替换数据，浅比较即可。
watch([() => candidateTrend, chartMode], renderChart, { flush: "post" });

tryOnMounted(() => {
  renderChart();
});

tryOnUnmounted(() => {
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped lang="scss">
/* 卡片纵向弹性布局：与左侧图表卡等高时画布同步增高 */
.candidate-trend-chart {
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
}

.candidate-trend-chart :deep(.el-card__header) {
  flex: 0 0 auto;
}

.candidate-trend-chart :deep(.el-card__body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px 22px;
}

/* 画布容器：空态浮层以此为定位基准，同时承担等高拉伸 */
.candidate-trend-chart__body {
  position: relative;
  display: flex;
  flex: 1 1 $chart-canvas-height;
  min-height: $chart-canvas-height;
}

.candidate-trend-chart__canvas {
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.candidate-trend-chart__empty {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(2px);
}

@include screen-sm {
  .candidate-trend-chart :deep(.el-card__body) {
    padding: 14px 16px;
  }

  .candidate-trend-chart__body {
    min-height: $chart-canvas-height-sm;
    flex-basis: $chart-canvas-height-sm;
  }
}
</style>
