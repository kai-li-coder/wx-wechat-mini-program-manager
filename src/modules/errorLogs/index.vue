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
        v-model:brand-keyword="brandFilterKeyword"
        v-model:brand-mode="brandFilterMode"
        v-model:query="flowQueryForm"
        v-model:terminal-models="selectedTerminalModels"
        :loading="isLoading"
        :terminal-model-options="terminalModelOptions"
        @reset="handleReset"
        @search="handleSearch"
      />
    </div>

    <!-- 错误日志表格区：独立滚动，滚动边界以查询条件栏底边为上限 -->
    <div class="error-log-page__scroll">
      <ErrorLogTable
        :event-items="errorEventItems"
        :filter-active="isClientFilterActive"
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
import type { TraceErrorBrandFilter, TraceErrorBrandFilterMode } from "@/utils/trace";
import { queryTraceFlow } from "@/api/trace";
import PageHeader from "@/components/PageHeader.vue";
import ErrorLogSearchForm from "@/modules/errorLogs/components/ErrorLogSearchForm.vue";
import ErrorLogTable from "@/modules/errorLogs/components/ErrorLogTable.vue";
import EventDetailDrawer from "@/modules/traceFlow/components/EventDetailDrawer.vue";
import { createTodayTraceRange } from "@/utils/date";
import { filterErrorEventsByBrand, toClientTimeDescEventItems } from "@/utils/trace";
import { collectTraceTerminalModels, filterEventItemsByTerminalModels } from "@/utils/traceDeviceModel";

/**
 * 创建默认错误日志查询条件。
 * 品牌与机型条件都由前端按设备信息匹配，因此不作为后端查询参数。
 */
const createDefaultFlowQuery = (): TraceFlowQuery => ({
  flowId: "",
  interviewCandidateId: "",
  eventCode: "",
  result: "fail",
  ...createTodayTraceRange(),
  pageNum: 1,
  pageSize: 50,
});

/** 创建空的品牌筛选条件。 */
const createEmptyBrandFilter = (): TraceErrorBrandFilter => ({ mode: "", keyword: "" });

/** 链路查询表单。 */
const flowQueryForm = ref<TraceFlowQuery>(createDefaultFlowQuery());
/** 品牌筛选模式：与下拉框双向绑定。 */
const brandFilterMode = ref<TraceErrorBrandFilterMode>("");
/** 「其他」品牌名称：与下拉框下方的输入框双向绑定。 */
const brandFilterKeyword = ref("");
/** 已生效的品牌筛选条件：仅在提交查询时同步，输入过程中不影响当前结果。 */
const appliedBrandFilter = ref<TraceErrorBrandFilter>(createEmptyBrandFilter());
/** 机型多选筛选值：与下拉框双向绑定，空数组表示全部机型。 */
const selectedTerminalModels = ref<string[]>([]);
/** 原始链路事件列表。 */
const eventItems = ref<TraceEventItem[]>([]);
/** 错误日志后端分页总数。 */
const errorTotal = ref(0);
/** 页面加载状态。 */
const isLoading = ref(false);
/** 请求序号：只接受最后一次请求的结果，避免快速翻页时旧响应覆盖新数据。 */
let latestRequestSeq = 0;
/** 事件详情抽屉引用。 */
const eventDetailDrawerRef =
  useTemplateRef<InstanceType<typeof EventDetailDrawer>>("eventDetailDrawerRef");

/**
 * 机型可选项：取当前页「终端型号」列的去重取值。
 * 只依赖未过滤的原始数据，避免选中后选项随结果收缩而无法继续调整；
 * 已选中但本页未出现的型号一并保留，保证标签可回溯、可取消。
 */
const terminalModelOptions = computed(() => {
  /** 当前页出现的终端型号。 */
  const pageTerminalModels = collectTraceTerminalModels(eventItems.value);
  /** 已选中但当前页未出现的型号。 */
  const absentSelectedModels = selectedTerminalModels.value.filter(
    (selectedModel) => !pageTerminalModels.includes(selectedModel),
  );
  if (absentSelectedModels.length === 0) {
    return pageTerminalModels;
  }

  return [...pageTerminalModels, ...absentSelectedModels].sort((leftModel, rightModel) =>
    leftModel.localeCompare(rightModel, "zh-Hans-CN"),
  );
});

/** 错误日志列表：后端分页结果再叠加前端品牌与机型条件。 */
const errorEventItems = computed(() =>
  toClientTimeDescEventItems(
    filterEventItemsByTerminalModels(
      filterErrorEventsByBrand(eventItems.value, appliedBrandFilter.value),
      selectedTerminalModels.value,
    ),
  ),
);

/** 是否启用了前端筛选：用于说明表格条数口径。 */
const isClientFilterActive = computed(
  () => Boolean(appliedBrandFilter.value.mode) || selectedTerminalModels.value.length > 0,
);

/** 查询错误日志。 */
const handleSearch = async () => {
  /** 本次请求序号。 */
  const requestSeq = (latestRequestSeq += 1);
  /** 请求发出时的条件快照。 */
  const querySnapshot = { ...flowQueryForm.value };
  /** 请求发出时的品牌条件快照：品牌由前端匹配，不写入后端查询参数。 */
  const brandFilterSnapshot: TraceErrorBrandFilter = {
    mode: brandFilterMode.value,
    keyword: brandFilterKeyword.value,
  };

  isLoading.value = true;
  try {
    /** 后端分页结果。 */
    const flowPageResult = await queryTraceFlow(querySnapshot);
    if (requestSeq !== latestRequestSeq) {
      return;
    }
    eventItems.value = flowPageResult.records;
    errorTotal.value = flowPageResult.total;
    // 与本次结果一起生效，保证表格展示的条件与请求中的条件完全一致。
    appliedBrandFilter.value = brandFilterSnapshot;
  } finally {
    // 仅最后一次请求可以结束 loading。
    if (requestSeq === latestRequestSeq) {
      isLoading.value = false;
    }
  }
};

/** 重置查询条件。 */
const handleReset = () => {
  flowQueryForm.value = createDefaultFlowQuery();
  brandFilterMode.value = "";
  brandFilterKeyword.value = "";
  appliedBrandFilter.value = createEmptyBrandFilter();
  selectedTerminalModels.value = [];
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
