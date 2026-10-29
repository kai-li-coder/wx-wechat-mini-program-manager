<!-- 五大错误码图表组件 -->
<template>
  <!-- 五大错误码卡片 -->
  <el-card v-loading="loading" class="top-error-chart" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <PanelHeader subtitle="按失败事件数排序，取前五位" title="五大错误码">
        <template #extra>
          <span class="meta-chip">TOP 5</span>
        </template>
      </PanelHeader>
    </template>

    <!-- 图表内容区 -->
    <div class="top-error-chart__body">
      <!-- 图表容器 -->
      <div ref="chartRoot" class="top-error-chart__canvas" />

      <!-- 空数据提示 -->
      <EmptyState
        v-if="!hasTopFailEventData"
        class="top-error-chart__empty"
        description="当前筛选条件下没有失败事件"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

import type { TraceDashboardTopErrorEventCode } from "@/api/trace";
import EmptyState from "@/components/EmptyState.vue";
import PanelHeader from "@/components/PanelHeader.vue";
import { useChartResize } from "@/composables/useChartResize";
import {
  chartAxisLabel,
  chartAxisPointer,
  chartColors,
  chartFontFamily,
  chartSplitLine,
  chartTooltip,
  prefersReducedMotion,
} from "@/constants/chartTheme";
import { formatTraceEventCode } from "@/utils/trace";

echarts.use([GridComponent, TooltipComponent, BarChart, CanvasRenderer]);

const { topErrorEventCodes, loading = false } = defineProps<{
  /** 后端聚合后的失败事件码排行。 */
  topErrorEventCodes: TraceDashboardTopErrorEventCode[];
  /** 图表加载状态。 */
  loading?: boolean;
}>();

/** 图表根节点。 */
const chartRootRef = useTemplateRef<HTMLDivElement>("chartRoot");
/** ECharts 图表实例。 */
let chartInstance: echarts.ECharts | null = null;

/** Top 失败事件码排行。 */
const topFailEventRankItems = computed(() => topErrorEventCodes ?? []);
/** 是否存在失败事件码数据。 */
const hasTopFailEventData = computed(() => topFailEventRankItems.value.length > 0);
/** 图表尺寸自适应：节流 + 跳过 ResizeObserver 首帧冗余回调。 */
const { markRendered } = useChartResize(chartRootRef, () => chartInstance);

/** 渲染五大错误码图表。 */
const renderChart = () => {
  if (!chartRootRef.value) {
    return;
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
    // 记录初始化时的容器尺寸，供紧随其后的首帧尺寸回调比对。
    markRendered();
  }

  if (!hasTopFailEventData.value) {
    // 仅无数据时清空一次，避免残留上一次的柱子；空态由上层浮层提示。
    chartInstance.clear();
    return;
  }

  /** 事件码展示标签。 */
  const eventCodeLabels: string[] = [];
  /** 失败事件数。 */
  const eventCounts: number[] = [];
  // 单次遍历同时产出类别轴与数值序列。
  for (const rankItem of topFailEventRankItems.value) {
    eventCodeLabels.push(formatTraceEventCode(rankItem.eventCode));
    eventCounts.push(rankItem.eventCount);
  }

  chartInstance.setOption({
    animation: !prefersReducedMotion(),
    textStyle: { fontFamily: chartFontFamily },
    tooltip: { axisPointer: chartAxisPointer, trigger: "axis", ...chartTooltip },
    grid: { top: 8, right: 36, bottom: 4, left: 4, containLabel: true },
    xAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: chartAxisLabel,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: chartSplitLine,
    },
    yAxis: {
      type: "category",
      data: eventCodeLabels,
      inverse: true,
      axisLabel: {
        ...chartAxisLabel,
        width: 104,
        overflow: "truncate",
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "失败事件数",
        type: "bar",
        barMaxWidth: 18,
        itemStyle: { color: chartColors.fail, borderRadius: [0, 6, 6, 0] },
        label: {
          show: true,
          position: "right",
          color: chartColors.axisLabel,
          fontFamily: chartFontFamily,
          fontSize: 11,
        },
        data: eventCounts,
      },
    ],
  });
};

// 父组件以整体替换的方式更新排行数据，浅比较即可；deep 只会带来无谓的深遍历。
watch(() => topErrorEventCodes, renderChart, { flush: "post" });

tryOnMounted(() => {
  renderChart();
});

tryOnUnmounted(() => {
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped lang="scss">
/* 卡片纵向弹性布局：与同行图表卡等高时画布同步增高 */
.top-error-chart {
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
}

.top-error-chart :deep(.el-card__header) {
  flex: 0 0 auto;
}

.top-error-chart :deep(.el-card__body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px 22px;
}

/* 画布容器：空态浮层以此为定位基准，同时承担等高拉伸 */
.top-error-chart__body {
  position: relative;
  display: flex;
  flex: 1 1 $chart-canvas-height;
  min-height: $chart-canvas-height;
}

.top-error-chart__canvas {
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
}

.top-error-chart__empty {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(2px);
}

@include screen-sm {
  .top-error-chart :deep(.el-card__body) {
    padding: 14px 16px;
  }

  .top-error-chart__body {
    min-height: $chart-canvas-height-sm;
    flex-basis: $chart-canvas-height-sm;
  }
}
</style>
