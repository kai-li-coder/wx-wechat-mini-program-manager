<!-- 链路事件查询页面 -->
<template>
  <!-- 链路事件页面容器 -->
  <section class="trace-flow-page page-stagger">
    <!-- 页面标题区 -->
    <PageHeader
      description="按 Flow ID 或候选人面试 ID 查看事件序列，筛选为空时查询全部。"
      title="链路事件"
    />

    <!-- 查询条件区：位于滚动区之外，滚动列表时始终保持可见 -->
    <div class="trace-flow-page__filter">
      <FlowSearchForm
        v-model="flowQueryForm"
        :loading="isLoading"
        @reset="handleReset"
        @search="handleSearch"
      />
    </div>

    <!-- 链路事件表格区：独立滚动，滚动边界以查询条件栏底边为上限 -->
    <div class="trace-flow-page__scroll">
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
    </div>

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
import { createTodayTraceRange } from "@/utils/date";
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
  ...createTodayTraceRange(),
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
const eventDetailDrawerRef =
  useTemplateRef<InstanceType<typeof EventDetailDrawer>>("eventDetailDrawerRef");
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

<style scoped lang="scss">
/* 页面为视口内的纵向栅格：标题与查询条件栏固定，仅表格区滚动 */
.trace-flow-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

/* 查询条件栏不参与滚动，始终占据页面顶部 */
.trace-flow-page__filter {
  flex: 0 0 auto;
}

/* 表格容器：固定占用剩余高度，数据滚动由卡片内部承担 */
.trace-flow-page__scroll {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: contain;
}

/* 低高度桌面视口：筛选区内部滚动，为卡片标题与分页保留最小空间 */
@media (max-height: 720px) and (min-width: 769px) {
  .trace-flow-page__filter {
    flex: 0 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .trace-flow-page__scroll {
    flex: 1 0 240px;
    min-height: 240px;
  }
}

/* 小屏查询表单纵向堆叠可能高于视口，固定区会遮住底部查询按钮，退化为整页滚动 */
@include screen-sm {
  .trace-flow-page {
    flex: 0 0 auto;
  }

  .trace-flow-page__scroll {
    flex: 0 0 auto;
    overflow: visible;
  }
}
</style>
