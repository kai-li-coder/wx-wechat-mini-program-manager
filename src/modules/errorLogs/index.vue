<!-- 错误日志页面 -->
<template>
  <!-- 错误日志页面容器 -->
  <section class="error-log-page page-stagger">
    <!-- 页面标题区 -->
    <PageHeader
      description="基于后端条件筛选查看 fail 与 warning 埋点错误信息。"
      title="错误日志"
    />

    <!-- 查询条件区：位于滚动区之外，滚动列表时始终保持可见 -->
    <div class="error-log-page__filter">
      <ErrorLogSearchForm
        v-model:query="flowQueryForm"
        :loading="isLoading"
        @reset="handleReset"
        @search="handleSearch"
      />
    </div>

    <!-- 错误日志表格区：独立滚动，滚动边界以查询条件栏底边为上限 -->
    <div class="error-log-page__scroll">
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
    </div>

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
import { createTodayTraceRange } from "@/utils/date";
import { toClientTimeDescEventItems } from "@/utils/trace";

/** 创建默认错误日志查询条件。 */
const createDefaultFlowQuery = (): TraceFlowQuery => ({
  flowId: "",
  interviewCandidateId: "",
  eventCode: "",
  result: "fail",
  brand: "",
  model: "",
  ...createTodayTraceRange(),
  pageNum: 1,
  pageSize: 50,
});

/** 链路查询表单。 */
const flowQueryForm = ref<TraceFlowQuery>(createDefaultFlowQuery());
/** 原始链路事件列表。 */
const eventItems = ref<TraceEventItem[]>([]);
/** 错误日志后端分页总数。 */
const errorTotal = ref(0);
/** 页面加载状态。 */
const isLoading = ref(false);
/** 事件详情抽屉引用。 */
const eventDetailDrawerRef =
  useTemplateRef<InstanceType<typeof EventDetailDrawer>>("eventDetailDrawerRef");

/** 错误日志列表。 */
const errorEventItems = computed(() => toClientTimeDescEventItems(eventItems.value));

/** 查询错误日志。 */
const handleSearch = async () => {
  isLoading.value = true;
  try {
    const flowPageResult = await queryTraceFlow(flowQueryForm.value);
    eventItems.value = flowPageResult.records;
    errorTotal.value = flowPageResult.total;
  } finally {
    isLoading.value = false;
  }
};

/** 重置查询条件。 */
const handleReset = () => {
  flowQueryForm.value = createDefaultFlowQuery();
  eventItems.value = [];
  errorTotal.value = 0;
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

<style scoped lang="scss">
/* 页面为视口内的纵向栅格：标题与查询条件栏固定，仅表格区滚动 */
.error-log-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

/* 查询条件栏不参与滚动，始终占据页面顶部 */
.error-log-page__filter {
  flex: 0 0 auto;
}

/* 表格容器：固定占用剩余高度，数据滚动由卡片内部承担 */
.error-log-page__scroll {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: contain;
}

/* 低高度桌面视口：筛选区内部滚动，为卡片标题与分页保留最小空间 */
@media (max-height: 720px) and (min-width: 769px) {
  .error-log-page__filter {
    flex: 0 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .error-log-page__scroll {
    flex: 1 0 240px;
    min-height: 240px;
  }
}

/* 小屏查询表单纵向堆叠可能高于视口，固定区会遮住底部查询按钮，退化为整页滚动 */
@include screen-sm {
  .error-log-page {
    flex: 0 0 auto;
  }

  .error-log-page__scroll {
    flex: 0 0 auto;
    overflow: visible;
  }
}
</style>
