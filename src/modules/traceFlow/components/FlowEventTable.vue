<!-- 链路事件表格组件 -->
<template>
  <!-- 链路事件表格卡片 -->
  <el-card class="table-card" shadow="never">
    <!-- 事件明细表格 -->
    <el-table v-loading="loading" :data="eventItems" empty-text="暂无链路事件" :row-key="resolveTraceEventRowKey">
      <el-table-column label="客户端时间" min-width="168" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 客户端时间 -->
          {{ formatDisplayDateTime(row.clientTime) }}
        </template>
      </el-table-column>
      <el-table-column label="事件码" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 事件码中文文案 -->
          {{ formatTraceEventCode(row.eventCode) }}
        </template>
      </el-table-column>
      <el-table-column label="阶段" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 阶段中文与编码文案 -->
          {{ formatTraceStage(row.stage) }}
        </template>
      </el-table-column>
      <el-table-column label="结果" width="96">
        <template #default="{ row }">
          <!-- 结果标签 -->
          <ResultTag :result="row.result" />
        </template>
      </el-table-column>
      <el-table-column align="right" label="耗时(ms)" prop="durationMs" width="110" />
      <el-table-column label="终端型号" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 终端型号 -->
          {{ formatTraceTerminalModel(row.deviceInfo) }}
        </template>
      </el-table-column>
      <el-table-column label="错误码" min-width="150" prop="errorCode" show-overflow-tooltip />
      <el-table-column label="服务端时间" min-width="168" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 服务端记录时间 -->
          {{ formatDisplayDateTime(resolveTraceEventServerTime(row)) }}
        </template>
      </el-table-column>
      <el-table-column label="页面路径" min-width="180" prop="pageRoute" show-overflow-tooltip />
      <el-table-column fixed="right" label="操作" width="92">
        <template #default="{ row }">
          <!-- 详情按钮 -->
          <el-button link type="primary" @click="emit('viewDetail', row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表格分页 -->
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
import ResultTag from "@/components/ResultTag.vue";
import { formatDisplayDateTime } from "@/utils/date";
import {
  formatTraceEventCode,
  formatTraceStage,
  formatTraceTerminalModel,
  resolveTraceEventRowKey,
  resolveTraceEventServerTime,
} from "@/utils/trace";

const { eventItems, loading = false, pageNum, pageSize, total } = defineProps<{
  /** 链路事件列表。 */
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
  margin-top: 16px;
  border-radius: 8px;
}

.table-card__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .table-card__pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
