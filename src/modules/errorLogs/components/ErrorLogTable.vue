<!-- 错误日志表格组件 -->
<template>
  <!-- 错误日志表格卡片 -->
  <el-card class="table-card" shadow="never">
    <template #header>
      <!-- 表格标题栏 -->
      <PanelHeader title="错误记录">
        <template #extra>
          <span class="table-card__count">共 {{ formatCount(total) }} 条</span>
          <span class="table-card__scope meta-chip">失败 / 警告</span>
        </template>
      </PanelHeader>
    </template>

    <!-- 错误日志表格滚动区：仅表格内容滚动，标题与分页固定 -->
    <div class="table-card__table-scroll">
      <el-table v-loading="loading" :data="tableRows" :row-key="resolveTraceEventRowKey">
        <template #empty>
          <EmptyState description="当前筛选条件下没有错误日志" />
        </template>

        <!-- 序号列 -->
        <el-table-column
          :index="resolveTableRowIndex"
          align="center"
          label="序号"
          type="index"
          width="72"
        />
        <el-table-column label="客户端时间" min-width="168" prop="clientTimeText" show-overflow-tooltip />
        <el-table-column label="结果" width="96">
          <template #default="{ row }">
            <!-- 结果标签 -->
            <ResultTag :result="row.resolvedResult" />
          </template>
        </el-table-column>
        <el-table-column label="错误码" min-width="160" prop="errorCode" show-overflow-tooltip />
        <el-table-column
          label="错误信息"
          min-width="240"
          prop="errorMessage"
          show-overflow-tooltip
        />
        <el-table-column label="事件码" min-width="240" prop="eventCodeText" show-overflow-tooltip />
        <el-table-column label="终端型号" min-width="220" prop="terminalModelText" show-overflow-tooltip />
        <el-table-column label="服务端时间" min-width="168" prop="serverTimeText" show-overflow-tooltip />
        <el-table-column label="Flow ID" min-width="180" prop="flowId" show-overflow-tooltip />
        <el-table-column
          label="候选人 ID"
          min-width="120"
          prop="interviewCandidateId"
          show-overflow-tooltip
        />
        <el-table-column fixed="right" label="操作" width="92">
          <template #default="{ row }">
            <!-- 详情按钮 -->
            <el-button link type="primary" @click="emit('viewDetail', row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 错误日志分页 -->
    <div class="table-card__pagination">
      <el-pagination
        :current-page="pageNum"
        :page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="emit('pageChange', $event)"
        @size-change="emit('sizeChange', $event)"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { TraceEventItem } from "@/api/trace";
import EmptyState from "@/components/EmptyState.vue";
import PanelHeader from "@/components/PanelHeader.vue";
import ResultTag from "@/components/ResultTag.vue";
import { formatDisplayDateTime } from "@/utils/date";
import {
  formatTraceEventCode,
  resolveTraceEventRowKey,
  resolveTraceEventResult,
  resolveTraceEventServerTime,
} from "@/utils/trace";
import { formatTraceTerminalModel } from "@/utils/traceDeviceModel";

/** 表格行视图模型：在原事件字段上附加预格式化文本，保留原始字段供 prop 列读取。 */
type TraceEventTableRow = TraceEventItem & {
  /** 客户端时间展示文本。 */
  clientTimeText: string;
  /** 服务端时间展示文本。 */
  serverTimeText: string;
  /** 事件码展示文本。 */
  eventCodeText: string;
  /** 终端型号展示文本。 */
  terminalModelText: string;
  /** 归类后的结果。 */
  resolvedResult: string;
};

const {
  eventItems,
  loading = false,
  pageNum,
  pageSize,
  total,
} = defineProps<{
  /** 错误日志事件列表。 */
  eventItems: TraceEventItem[];
  /** 表格加载状态。 */
  loading?: boolean;
  /** 当前页码。 */
  pageNum: number;
  /** 每页条数。 */
  pageSize: number;
  /** 总记录数。 */
  total: number;
}>();

/**
 * 表格行数据：格式化只在数据变化时做一次。
 * 原实现把格式化函数写在单元格插槽里，表格每次重渲染都会对每行重复执行
 * 日期解析、事件码查表与设备信息 JSON 解析。
 */
const tableRows = computed<TraceEventTableRow[]>(() =>
  eventItems.map((eventItem) => ({
    ...eventItem,
    clientTimeText: formatDisplayDateTime(eventItem.clientTime),
    serverTimeText: formatDisplayDateTime(resolveTraceEventServerTime(eventItem)),
    eventCodeText: formatTraceEventCode(eventItem.eventCode),
    terminalModelText: formatTraceTerminalModel(eventItem.deviceInfo),
    resolvedResult: resolveTraceEventResult(eventItem),
  })),
);

/** 计算分页后的表格序号。 */
const resolveTableRowIndex = (rowIndex: number) => (pageNum - 1) * pageSize + rowIndex + 1;

/** 千分位数字格式化器。 */
const countFormatter = new Intl.NumberFormat("zh-CN");

/** 格式化记录总数。 */
const formatCount = (countValue: number) => countFormatter.format(countValue);

const emit = defineEmits<{
  /** 查看事件详情。 */
  viewDetail: [eventItem: TraceEventItem];
  /** 页码变化。 */
  pageChange: [pageNum: number];
  /** 每页条数变化。 */
  sizeChange: [pageSize: number];
}>();
</script>

<style scoped lang="scss">
.table-card {
  /* 卡片固定填充剩余高度，不再由表格内容决定自身高度 */
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  margin-top: $space-5;
  border-radius: $radius-md;
}

.table-card :deep(.el-card__header) {
  flex: 0 0 auto;
}

.table-card :deep(.el-card__body) {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

/* 唯一数据滚动层：长表格不会推动卡片底边或分页离开视口 */
.table-card__table-scroll {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.table-card__count {
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.table-card__pagination {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $color-border-soft;
  overflow-x: auto;
}

@include screen-sm {
  .table-card {
    flex: 0 0 auto;
    min-height: auto;
    margin-top: $space-3;
  }

  .table-card :deep(.el-card__body) {
    flex: 0 0 auto;
    min-height: auto;
    overflow: visible;
  }

  .table-card__table-scroll {
    flex: 0 0 auto;
    overflow: visible;
  }

  .table-card__scope {
    display: none;
  }

  .table-card__pagination {
    justify-content: flex-start;
  }
}
</style>
