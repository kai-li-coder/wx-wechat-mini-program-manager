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
      <MetricTrendChart
        :end-time="appliedEndTime"
        :loading="isLoading"
        :metric-items="metricItems"
        :start-time="appliedStartTime"
      />
      <EventRankTable :rank-items="eventRankItems" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TraceEventItem, TraceFlowQuery, TraceMetricQuery } from "@/api/trace";
import { queryTraceFlow } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import EventRankTable from "@/modules/dashboard/components/EventRankTable.vue";
import MetricSearchForm from "@/modules/dashboard/components/MetricSearchForm.vue";
import MetricSummary from "@/modules/dashboard/components/MetricSummary.vue";
import MetricTrendChart from "@/modules/dashboard/components/MetricTrendChart.vue";
import { createTodayTraceRange } from "@/utils/date";
import {
  aggregateMetricSummary,
  resolveTraceEventResult,
  toEventRankItems,
  toMetricItemsFromEvents,
} from "@/utils/trace";

/** 总览页事件明细分页大小。 */
const DASHBOARD_EVENT_PAGE_SIZE = 200;

/** 创建默认聚合查询条件。 */
const createDefaultMetricQuery = (): TraceMetricQuery => ({
  ...createTodayTraceRange(),
  eventCode: "",
  result: "",
});

/** 聚合查询表单。 */
const metricQueryForm = ref<TraceMetricQuery>(createDefaultMetricQuery());
/** 总览页链路事件明细。 */
const eventItems = ref<TraceEventItem[]>([]);
/** 已应用的结果筛选值。 */
const appliedResultFilter = ref("");
/** 已应用的开始时间。 */
const appliedStartTime = ref(metricQueryForm.value.startTime);
/** 已应用的结束时间。 */
const appliedEndTime = ref(metricQueryForm.value.endTime);
/** 页面加载状态。 */
const isLoading = ref(false);

/** 按归类结果筛选后的链路事件明细。 */
const filteredEventItems = computed(() => {
  /** 结果筛选值。 */
  if (!appliedResultFilter.value) {
    return eventItems.value;
  }

  return eventItems.value.filter((eventItem) => resolveTraceEventResult(eventItem) === appliedResultFilter.value);
});
/** 聚合数据列表。 */
const metricItems = computed(() => toMetricItemsFromEvents(filteredEventItems.value));
/** 埋点聚合摘要。 */
const metricSummary = computed(() => aggregateMetricSummary(metricItems.value));
/** 事件码排行列表。 */
const eventRankItems = computed(() => toEventRankItems(metricItems.value));

/** 创建总览页链路事件查询条件。 */
const createDashboardFlowQuery = (pageNum: number): TraceFlowQuery => ({
  eventCode: metricQueryForm.value.eventCode,
  startTime: metricQueryForm.value.startTime,
  endTime: metricQueryForm.value.endTime,
  pageNum,
  pageSize: DASHBOARD_EVENT_PAGE_SIZE,
});

/** 查询总览页全部链路事件明细。 */
const queryDashboardEventItems = async () => {
  /** 第一页事件查询结果。 */
  const firstPageResult = await queryTraceFlow(createDashboardFlowQuery(1));
  /** 已查询事件列表。 */
  const queriedEventItems = [...firstPageResult.records];
  /** 总页数。 */
  const pageCount = Math.ceil(firstPageResult.total / DASHBOARD_EVENT_PAGE_SIZE);
  if (pageCount <= 1) {
    return queriedEventItems;
  }

  /** 剩余页码列表。 */
  const remainingPageNums = Array.from({ length: pageCount - 1 }, (_, pageIndex) => pageIndex + 2);
  /** 剩余页查询结果。 */
  const remainingPageResults = await Promise.all(
    remainingPageNums.map((pageNum) => queryTraceFlow(createDashboardFlowQuery(pageNum))),
  );

  remainingPageResults.forEach((pageResult) => {
    queriedEventItems.push(...pageResult.records);
  });

  return queriedEventItems;
};

/** 查询聚合数据。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    eventItems.value = await queryDashboardEventItems();
    appliedResultFilter.value = String(metricQueryForm.value.result ?? "").trim();
    appliedStartTime.value = metricQueryForm.value.startTime;
    appliedEndTime.value = metricQueryForm.value.endTime;
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
