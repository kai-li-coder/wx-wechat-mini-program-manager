<!-- 候选人趋势图组件 -->
<template>
  <!-- 候选人趋势图卡片 -->
  <el-card v-loading="loading" class="candidate-trend-chart" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <div class="candidate-trend-chart__header">
        <span>候选人趋势</span>
        <div class="candidate-trend-chart__actions">
          <el-tag effect="plain">{{ trendGranularityText }}</el-tag>
          <el-radio-group v-model="chartMode" size="small">
            <el-radio-button value="line">折线图</el-radio-button>
            <el-radio-button value="bar">柱状图</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </template>

    <!-- 图表内容区 -->
    <div class="candidate-trend-chart__body">
      <!-- 图表容器 -->
      <div ref="chartRoot" class="candidate-trend-chart__canvas" />

      <!-- 空数据提示 -->
      <el-empty
        v-if="!hasCandidateTrendData"
        :image-size="72"
        class="candidate-trend-chart__empty"
        description="暂无候选人数据"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

import type { TraceEventItem } from "@/api/trace";
import { toCandidateTrendRows } from "@/utils/trace";

echarts.use([GridComponent, TooltipComponent, BarChart, LineChart, CanvasRenderer]);

/** 候选人趋势图类型。 */
type CandidateTrendChartMode = "line" | "bar";

const { eventItems, loading = false, startTime, endTime } = defineProps<{
  /** 链路事件明细列表。 */
  eventItems: TraceEventItem[];
  /** 图表加载状态。 */
  loading?: boolean;
  /** 查询开始时间。 */
  startTime?: string;
  /** 查询结束时间。 */
  endTime?: string;
}>();

/** 图表根节点。 */
const chartRootRef = useTemplateRef<HTMLDivElement>("chartRoot");
/** 当前图表类型。 */
const chartMode = ref<CandidateTrendChartMode>("line");
/** ECharts 图表实例。 */
let chartInstance: echarts.ECharts | null = null;

/** 候选人趋势行。 */
const candidateTrendRows = computed(() => toCandidateTrendRows(eventItems, { startTime, endTime }));
/** 是否存在候选人趋势数据。 */
const hasCandidateTrendData = computed(() =>
  candidateTrendRows.value.some((candidateTrendRow) => candidateTrendRow.candidateCount > 0),
);

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
    (candidateTrendRow) => candidateTrendRow.metricLabel ?? candidateTrendRow.metricHour.slice(5, 16),
  );

  chartInstance.clear();
  chartInstance.setOption({
    color: ["#2563eb"],
    tooltip: { trigger: "axis" },
    grid: { top: 24, right: 16, bottom: 32, left: 40 },
    xAxis: {
      type: "category",
      data: axisLabels,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      {
        name: "候选人数",
        type: chartMode.value,
        barMaxWidth: 28,
        smooth: chartMode.value === "line",
        symbolSize: chartMode.value === "line" ? 6 : 0,
        data: candidateTrendRows.value.map((candidateTrendRow) => candidateTrendRow.candidateCount),
      },
    ],
  });
};

watch(() => [eventItems, startTime, endTime, chartMode.value], renderChart, { deep: true });

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
  border-radius: 8px;
}

.candidate-trend-chart__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}

.candidate-trend-chart__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
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
  background: rgba(255, 255, 255, 0.72);
}
</style>
