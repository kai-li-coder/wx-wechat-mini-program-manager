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

/** 渲染五大错误码图表。 */
const renderChart = () => {
  if (!chartRootRef.value) {
    return;
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartRootRef.value);
  }

  chartInstance.clear();
  if (!hasTopFailEventData.value) {
    return;
  }

  /** 事件码展示标签。 */
  const eventCodeLabels = topFailEventRankItems.value.map((rankItem) =>
    formatTraceEventCode(rankItem.eventCode),
  );
  /** 失败事件数。 */
  const eventCounts = topFailEventRankItems.value.map((rankItem) => rankItem.eventCount);

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

watch(() => topErrorEventCodes, renderChart, { deep: true });

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
.top-error-chart {
  border-radius: $radius-md;
}

.top-error-chart__body {
  position: relative;
  min-height: 320px;
}

.top-error-chart__canvas {
  width: 100%;
  height: 320px;
}

.top-error-chart__empty {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(2px);
}

@include screen-sm {
  .top-error-chart__body {
    min-height: 280px;
  }

  .top-error-chart__canvas {
    height: 280px;
  }
}
</style>
