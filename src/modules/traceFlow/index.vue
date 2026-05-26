<!-- 链路事件查询页面 -->
<template>
  <!-- 链路事件页面容器 -->
  <section class="trace-flow-page">
    <!-- 页面标题区 -->
    <PageHeader description="按 Flow ID 或候选人面试 ID 查看事件序列，筛选为空时查询全部。" title="链路事件" />

    <!-- 查询条件区 -->
    <FlowSearchForm v-model="flowQueryForm" :loading="isLoading" @reset="handleReset" @search="handleSearch" />

    <!-- 链路事件表格区 -->
    <FlowEventTable
      :event-items="clientTimeDescEventItems"
      :loading="isLoading"
      :page-num="flowQueryForm.pageNum || 1"
      :page-size="flowQueryForm.pageSize || 50"
      :total="total"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @view-detail="handleViewDetail"
    />

    <!-- 链路事件详情区 -->
    <EventDetailDrawer ref="eventDetailDrawerRef" />
  </section>
</template>

<script setup lang="ts">
import type { TraceEventItem, TraceFlowQuery } from "@/api/trace";
import { queryTraceFlow } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import EventDetailDrawer from "@/modules/traceFlow/components/EventDetailDrawer.vue";
import FlowEventTable from "@/modules/traceFlow/components/FlowEventTable.vue";
import FlowSearchForm from "@/modules/traceFlow/components/FlowSearchForm.vue";
import { toClientTimeDescEventItems } from "@/utils/trace";

/** 创建默认链路查询条件。 */
const createDefaultFlowQuery = (): TraceFlowQuery => ({
  flowId: "",
  interviewCandidateId: "",
  eventCode: "",
  stage: "",
  result: "",
  durationMs: undefined,
  brand: "",
  model: "",
  startTime: "",
  endTime: "",
  pageRoute: "",
  pageNum: 1,
  pageSize: 50,
});

/** 链路查询表单。 */
const flowQueryForm = ref<TraceFlowQuery>(createDefaultFlowQuery());
/** 链路事件列表。 */
const eventItems = ref<TraceEventItem[]>([]);
/** 链路事件总数。 */
const total = ref(0);
/** 页面加载状态。 */
const isLoading = ref(false);
/** 事件详情抽屉引用。 */
const eventDetailDrawerRef = useTemplateRef<InstanceType<typeof EventDetailDrawer>>("eventDetailDrawerRef");
/** 按客户端时间倒序展示的链路事件列表。 */
const clientTimeDescEventItems = computed(() => toClientTimeDescEventItems(eventItems.value));

/** 查询链路事件。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    const flowPageResult = await queryTraceFlow(flowQueryForm.value);
    eventItems.value = flowPageResult.records;
    total.value = flowPageResult.total;
  } finally {
    isLoading.value = false;
  }
};

/** 重置查询条件。 */
const handleReset = () => {
  flowQueryForm.value = createDefaultFlowQuery();
  eventItems.value = [];
  total.value = 0;
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

/** 查看事件详情。 */
const handleViewDetail = (selectedEventItem: TraceEventItem) => {
  eventDetailDrawerRef.value?.openDialog(selectedEventItem);
};

tryOnMounted(() => {
  void handleSearch();
});
</script>
