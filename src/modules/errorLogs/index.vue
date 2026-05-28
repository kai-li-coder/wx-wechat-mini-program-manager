<!-- 错误日志页面 -->
<template>
  <!-- 错误日志页面容器 -->
  <section class="error-log-page">
    <!-- 页面标题区 -->
    <PageHeader description="基于 fail 与 warning 埋点查看错误信息，筛选为空时查询全部。" title="错误日志" />

    <!-- 查询条件区 -->
    <ErrorLogSearchForm
      v-model:query="flowQueryForm"
      v-model:result-filter="resultFilter"
      v-model:device-quick-filter="deviceQuickFilter"
      v-model:brand-quick-filter="brandQuickFilter"
      v-model:exclude-test-records="isExcludeTestRecords"
      :loading="isLoading"
      @reset="handleReset"
      @search="handleSearch"
    />

    <!-- 错误日志表格区 -->
    <ErrorLogTable
      :event-items="errorEventItems"
      :loading="isLoading"
      :page-num="flowQueryForm.pageNum || 1"
      :page-size="flowQueryForm.pageSize || 50"
      :total="errorTotal"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @view-detail="handleViewDetail"
    />

    <!-- 错误事件详情区 -->
    <EventDetailDrawer ref="eventDetailDrawerRef" />
  </section>
</template>

<script setup lang="ts">
import type { TraceEventItem, TraceFlowQuery } from "@/api/trace";
import { queryTraceFlow } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import ErrorLogSearchForm from "@/modules/errorLogs/components/ErrorLogSearchForm.vue";
import ErrorLogTable from "@/modules/errorLogs/components/ErrorLogTable.vue";
import EventDetailDrawer from "@/modules/traceFlow/components/EventDetailDrawer.vue";
import type { TraceBrandQuickFilter, TraceDeviceQuickFilter } from "@/utils/trace";
import { filterErrorEvents, toClientTimeDescEventItems } from "@/utils/trace";

/** 创建默认错误日志查询条件。 */
const createDefaultFlowQuery = (): TraceFlowQuery => ({
  flowId: "",
  interviewCandidateId: "",
  eventCode: "",
  brand: "",
  model: "",
  startTime: "",
  endTime: "",
  pageNum: 1,
  pageSize: 50,
});

/** 链路查询表单。 */
const flowQueryForm = ref<TraceFlowQuery>(createDefaultFlowQuery());
/** 异常结果筛选。 */
const resultFilter = ref("");
/** 设备类型快捷筛选。 */
const deviceQuickFilter = ref<TraceDeviceQuickFilter>("");
/** 品牌快捷筛选。 */
const brandQuickFilter = ref<TraceBrandQuickFilter>("");
/** 是否过滤测试记录。 */
const isExcludeTestRecords = ref(true);
/** 原始链路事件列表。 */
const eventItems = ref<TraceEventItem[]>([]);
/** 页面加载状态。 */
const isLoading = ref(false);
/** 事件详情抽屉引用。 */
const eventDetailDrawerRef = useTemplateRef<InstanceType<typeof EventDetailDrawer>>("eventDetailDrawerRef");

/** 错误日志列表。 */
const errorEventItems = computed(() =>
  toClientTimeDescEventItems(
    filterErrorEvents(eventItems.value, {
      resultFilter: resultFilter.value,
      deviceQuickFilter: deviceQuickFilter.value,
      brandQuickFilter: brandQuickFilter.value,
      isExcludeTestRecords: isExcludeTestRecords.value,
    }),
  ),
);
/** 错误日志总数。 */
const errorTotal = computed(() => errorEventItems.value.length);

/** 查询错误日志。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    const flowPageResult = await queryTraceFlow(flowQueryForm.value);
    eventItems.value = flowPageResult.records;
  } finally {
    isLoading.value = false;
  }
};

/** 重置查询条件。 */
const handleReset = () => {
  flowQueryForm.value = createDefaultFlowQuery();
  resultFilter.value = "";
  deviceQuickFilter.value = "";
  brandQuickFilter.value = "";
  isExcludeTestRecords.value = false;
  eventItems.value = [];
};

/** 切换页码。 */
const handlePageChange = async (pageNum: number) => {
  flowQueryForm.value.pageNum = pageNum;
  await handleSearch();
};

/** 切换每页条数。 */
const handleSizeChange = async (pageSize: number) => {
  flowQueryForm.value.pageSize = pageSize;
  flowQueryForm.value.pageNum = 1;
  await handleSearch();
};

/** 查看错误事件详情。 */
const handleViewDetail = (selectedEventItem: TraceEventItem) => {
  eventDetailDrawerRef.value?.openDialog(selectedEventItem);
};

tryOnMounted(() => {
  void handleSearch();
});
</script>
