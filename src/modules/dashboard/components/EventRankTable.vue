<!-- 事件码排行表格组件 -->
<template>
  <!-- 事件码排行卡片 -->
  <el-card class="rank-card" shadow="never">
    <template #header>
      <!-- 表格标题栏 -->
      <div class="rank-card__header">事件码排行</div>
    </template>

    <!-- 排行表格 -->
    <el-table :data="rankItems" empty-text="暂无排行数据">
      <el-table-column label="事件码" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- 事件码中文文案 -->
          {{ formatTraceEventCode(row.eventCode) }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="事件数" prop="eventCount" width="110" />
      <el-table-column align="right" label="链路数" prop="flowCount" width="110" />
      <el-table-column align="right" label="候选人数" prop="candidateCount" width="110" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { formatTraceEventCode, type TraceEventRankItem } from "@/utils/trace";

defineProps<{
  /** 事件码排行列表。 */
  rankItems: TraceEventRankItem[];
}>();
</script>

<style scoped lang="scss">
.rank-card {
  border-radius: 8px;
}

.rank-card__header {
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}
</style>
