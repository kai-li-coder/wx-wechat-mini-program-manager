<!-- 五大错误码图表组件 -->
<template>
  <!-- 五大错误码卡片 -->
  <el-card v-loading="loading" class="top-error-chart" shadow="never">
    <template #header>
      <!-- 图表标题栏 -->
      <div class="top-error-chart__header">
        <span>五大错误码</span>
      </div>
    </template>

    <!-- 图表内容区 -->
    <div class="top-error-chart__body">
      <!-- 图表容器 -->
      <div ref="chartRoot" class="top-error-chart__canvas" />

      <!-- 空数据提示 -->
      <el-empty
        v-if="!hasTopFailEventData"
        :image-size="72"
        class="top-error-chart__empty"
        description="暂无失败事件数据"
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

/** 创建事件码展示标签。 */
const toEventCodeLabels = () =>
  topFailEventRankItems.value.map((rankItem) => formatTraceEventCode(rankItem.eventCode));

/** 创建事件码失败次数。 */
const toEventCounts = () => topFailEventRankItems.value.map((rankItem) => rankItem.eventCount);

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
  const eventCodeLabels = toEventCodeLabels();
  /** 失败事件数。 */
  const eventCounts = toEventCounts();

  chartInstance.setOption({
    color: ["#ef4444"],
    tooltip: { trigger: "axis" },
    grid: { top: 16, right: 28, bottom: 28, left: 132 },
    xAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    yAxis: {
      type: "category",
      data: eventCodeLabels,
      inverse: true,
      axisTick: { show: false },
      axisLabel: {
        width: 116,
        overflow: "truncate",
      },
    },
    series: [
      {
        name: "失败事件数",
        type: "bar",
        barMaxWidth: 24,
        label: {
          show: true,
          position: "right",
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
  border-radius: 8px;
}

.top-error-chart__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
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
  background: rgba(255, 255, 255, 0.72);
}
</style>
