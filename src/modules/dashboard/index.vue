<!-- 埋点总览页面 -->
<template>
  <!-- 埋点总览页面容器 -->
  <section class="dashboard-page">
    <!-- 页面标题区 -->
    <PageHeader description="查看答题异常趋势、涉及链路和事件码分布。" title="埋点总览">
      <template #extra>
        <el-button :loading="isLoading" type="primary" @click="handleSearch">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 查询条件区 -->
    <MetricSearchForm v-model="metricQueryForm" :loading="isLoading" @reset="handleReset" @search="handleSearch" />

    <!-- 指标汇总区 -->
    <MetricSummary :summary="metricSummary" />

    <!-- 图表与排行区 -->
    <div class="dashboard-page__content">
      <MetricTrendChart :loading="isLoading" :metric-items="metricItems" />
      <EventRankTable :rank-items="eventRankItems" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TraceMetricQuery } from "@/api/trace";
import { queryTraceMetrics } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import EventRankTable from "@/modules/dashboard/components/EventRankTable.vue";
import MetricSearchForm from "@/modules/dashboard/components/MetricSearchForm.vue";
import MetricSummary from "@/modules/dashboard/components/MetricSummary.vue";
import MetricTrendChart from "@/modules/dashboard/components/MetricTrendChart.vue";
import { createRecent24HourRange } from "@/utils/date";
import { aggregateMetricSummary, toEventRankItems } from "@/utils/trace";

/** 创建默认聚合查询条件。 */
const createDefaultMetricQuery = (): TraceMetricQuery => ({
  ...createRecent24HourRange(),
  eventCode: "",
  result: "",
});

/** 聚合查询表单。 */
const metricQueryForm = ref<TraceMetricQuery>(createDefaultMetricQuery());
/** 聚合数据列表。 */
const metricItems = ref<Awaited<ReturnType<typeof queryTraceMetrics>>>([]);
/** 页面加载状态。 */
const isLoading = ref(false);

/** 埋点聚合摘要。 */
const metricSummary = computed(() => aggregateMetricSummary(metricItems.value));
/** 事件码排行列表。 */
const eventRankItems = computed(() => toEventRankItems(metricItems.value));

/** 查询聚合数据。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    metricItems.value = await queryTraceMetrics(metricQueryForm.value);
  } finally {
    isLoading.value = false;
  }
};

/** 重置查询条件并刷新。 */
const handleReset = async () => {
  metricQueryForm.value = createDefaultMetricQuery();
  await handleSearch();
};

tryOnMounted(() => {
  void handleSearch();
});
</script>

<style scoped lang="scss">
.dashboard-page__content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(360px, 0.75fr);
  gap: 16px;
}

@media (max-width: 1180px) {
  .dashboard-page__content {
    grid-template-columns: 1fr;
  }
}
</style>
