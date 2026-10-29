<!-- 埋点总览页面 -->
<template>
  <!-- 埋点总览页面容器 -->
  <section class="dashboard-page page-stagger">
    <!-- 页面标题区 -->
    <PageHeader description="查看答题异常趋势、涉及链路和事件码分布。" title="埋点总览">
      <template #extra>
        <el-button :loading="isLoading" type="primary" @click="handleSearch">刷新</el-button>
      </template>
    </PageHeader>

    <!-- 查询条件区 -->
    <MetricSearchForm
      v-model="dashboardQueryForm"
      :loading="isLoading"
      @reset="handleReset"
      @search="handleSearch"
    />

    <!-- 指标汇总区 -->
    <MetricSummary :summary="dashboardSummary" />

    <!-- 图表与分析区：两行两列，同行卡片等高、两列底部齐平 -->
    <div class="dashboard-page__content">
      <!-- 第一行：异常趋势（左）+ 五大错误码（右） -->
      <MetricTrendChart
        class="dashboard-page__trend"
        :loading="isLoading"
        :trend="dashboardData.trend"
      />
      <TopErrorEventCodeChart
        class="dashboard-page__top-error"
        :loading="isLoading"
        :top-error-event-codes="dashboardData.topErrorEventCodes"
      />

      <!-- 第二行：候选人趋势（左）+ 错误预警（右） -->
      <CandidateTrendChart
        class="dashboard-page__candidate"
        :candidate-trend="dashboardData.candidateTrend"
        :loading="isLoading"
      />
      <ErrorWarningPanel
        class="dashboard-page__warning"
        :loading="isLoading"
        :summary="dashboardData.errorWarning"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  TraceDashboardQuery,
  TraceDashboardResponse,
  TraceDashboardWarningThresholds,
} from "@/api/trace";
import { queryTraceDashboard } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import { normalizeDashboardHourBuckets } from "@/modules/dashboard/composables/useDashboardHourBuckets";
import CandidateTrendChart from "@/modules/dashboard/components/CandidateTrendChart.vue";
import ErrorWarningPanel from "@/modules/dashboard/components/ErrorWarningPanel.vue";
import MetricSearchForm from "@/modules/dashboard/components/MetricSearchForm.vue";
import MetricSummary from "@/modules/dashboard/components/MetricSummary.vue";
import MetricTrendChart from "@/modules/dashboard/components/MetricTrendChart.vue";
import TopErrorEventCodeChart from "@/modules/dashboard/components/TopErrorEventCodeChart.vue";
import { createTodayTraceRange } from "@/utils/date";

/** 错误预警默认阈值。 */
const defaultWarningThresholds: TraceDashboardWarningThresholds = {
  watchFailRate: 0.03,
  watchFailCount: 5,
  warningFailRate: 0.05,
  warningFailCount: 10,
  criticalFailRate: 0.1,
  criticalFailCount: 10,
  criticalCandidateRate: 0.05,
  criticalCandidateCount: 3,
};

/** 创建默认聚合查询条件。 */
const createDefaultDashboardQuery = (): TraceDashboardQuery => ({
  ...createTodayTraceRange(),
  eventCode: "",
  result: "",
});

/** 创建空总览响应，避免接口加载前组件读取空对象。 */
const createEmptyDashboardData = (): TraceDashboardResponse => ({
  summary: {
    eventCount: 0,
    successCount: 0,
    failCount: 0,
    warningCount: 0,
    flowCount: 0,
    candidateCount: 0,
  },
  trend: {
    granularity: "day",
    rows: [],
  },
  candidateTrend: {
    granularity: "day",
    rows: [],
  },
  topErrorEventCodes: [],
  errorWarning: {
    level: "normal",
    warningDate: null,
    eventCount: 0,
    failCount: 0,
    failRate: 0,
    candidateCount: 0,
    affectedCandidateCount: 0,
    affectedCandidateRate: 0,
    triggerReasons: [],
    thresholds: defaultWarningThresholds,
  },
});

/** 总览查询表单。 */
const dashboardQueryForm = ref<TraceDashboardQuery>(createDefaultDashboardQuery());
/** 总览聚合数据。 */
const dashboardData = ref<TraceDashboardResponse>(createEmptyDashboardData());
/** 页面加载状态。 */
const isLoading = ref(false);

/** 总览结果摘要，兼容后端未直接返回分类数量的情况。 */
const dashboardSummary = computed(() => {
  /** 从趋势行汇总的分类数量。 */
  const trendSummary = dashboardData.value.trend.rows.reduce(
    (currentSummary, trendRow) => ({
      successCount: currentSummary.successCount + trendRow.successCount,
      failCount: currentSummary.failCount + trendRow.failCount,
      warningCount: currentSummary.warningCount + trendRow.warningCount,
    }),
    {
      successCount: 0,
      failCount: 0,
      warningCount: 0,
    },
  );

  return {
    ...dashboardData.value.summary,
    successCount: dashboardData.value.summary.successCount ?? trendSummary.successCount,
    failCount: dashboardData.value.summary.failCount ?? trendSummary.failCount,
    warningCount: dashboardData.value.summary.warningCount ?? trendSummary.warningCount,
  };
});

/** 查询聚合数据。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    /** 后端聚合后的总览数据。 */
    const dashboardResponse = await queryTraceDashboard(dashboardQueryForm.value);
    dashboardData.value = normalizeDashboardHourBuckets(
      dashboardResponse,
      dashboardQueryForm.value,
    );
  } finally {
    isLoading.value = false;
  }
};

/** 重置查询条件并刷新。 */
const handleReset = async () => {
  dashboardQueryForm.value = createDefaultDashboardQuery();
  await handleSearch();
};

tryOnMounted(() => {
  void handleSearch();
});
</script>

<style scoped lang="scss">
/* 图表与分析区：显式网格区域，同一行两张卡片自动等高（align-self: stretch），
   两行高度相加后左右两列底边自然齐平，不会出现一列高一列矮的错位 */
.dashboard-page__content {
  display: grid;
  grid-template-areas:
    "trend top-error"
    "candidate warning";
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.75fr);
  gap: $space-5;
}

.dashboard-page__trend {
  grid-area: trend;
}

.dashboard-page__top-error {
  grid-area: top-error;
}

.dashboard-page__candidate {
  grid-area: candidate;
}

.dashboard-page__warning {
  grid-area: warning;
}

/* 中等屏：单列堆叠，顺序按「趋势 → 明细」分组，卡片恢复自然高度 */
@media (max-width: 1240px) {
  .dashboard-page__content {
    grid-template-areas:
      "trend"
      "candidate"
      "top-error"
      "warning";
    grid-template-columns: minmax(0, 1fr);
  }
}

@include screen-sm {
  .dashboard-page__content {
    gap: $space-3;
  }
}
</style>
