<!-- 链路事件详情抽屉组件 -->
<template>
  <!-- 事件详情抽屉 -->
  <el-drawer v-model="drawerVisible" class="event-detail-drawer" size="520px" title="事件详情">
    <template v-if="eventItem">
      <!-- 基础信息描述区 -->
      <el-descriptions :column="1" border>
        <el-descriptions-item label="事件 ID">{{ eventItem.eventId }}</el-descriptions-item>
        <el-descriptions-item label="Flow ID">{{ eventItem.flowId }}</el-descriptions-item>
        <el-descriptions-item label="候选人 ID">{{ eventItem.interviewCandidateId ?? "-" }}</el-descriptions-item>
        <el-descriptions-item label="事件码">{{ eventItem.eventCode }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{ formatTraceStage(eventItem.stage) }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          <ResultTag :result="eventItem.result" />
        </el-descriptions-item>
        <el-descriptions-item label="错误码">{{ eventItem.errorCode || "-" }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{ eventItem.errorMessage || "-" }}</el-descriptions-item>
        <el-descriptions-item label="客户端时间">{{ formatDisplayDateTime(eventItem.clientTime) }}</el-descriptions-item>
        <el-descriptions-item label="服务端时间">{{ eventItem.serverTime }}</el-descriptions-item>
      </el-descriptions>

      <!-- JSON 扩展信息区域 -->
      <section class="event-detail-drawer__section">
        <h3>设备信息</h3>
        <JsonViewer :value="eventItem.deviceInfo" />
      </section>

      <!-- JSON 扩展信息区域 -->
      <section class="event-detail-drawer__section">
        <h3>扩展字段</h3>
        <JsonViewer :value="eventItem.extra" />
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { TraceEventItem } from "@/api/trace";
import JsonViewer from "@/components/JsonViewer.vue";
import ResultTag from "@/components/ResultTag.vue";
import { formatDisplayDateTime } from "@/utils/date";
import { formatTraceStage } from "@/utils/trace";

/** 抽屉显示状态。 */
const drawerVisible = ref(false);
/** 当前查看的事件。 */
const eventItem = ref<TraceEventItem | null>(null);

/** 打开事件详情抽屉。 */
const openDialog = (selectedEventItem: TraceEventItem) => {
  eventItem.value = selectedEventItem;
  drawerVisible.value = true;
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.event-detail-drawer__section {
  margin-top: 18px;
}

.event-detail-drawer__section h3 {
  margin: 0 0 10px;
  color: $color-text-primary;
  font-size: 15px;
  font-weight: 700;
}
</style>
