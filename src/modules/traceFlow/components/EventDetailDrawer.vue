<!-- 链路事件详情抽屉组件 -->
<template>
  <!-- 事件详情抽屉 -->
  <el-drawer
    v-model="drawerVisible"
    class="event-detail-drawer"
    :size="drawerSize"
    title="事件详情"
  >
    <template #header>
      <!-- 抽屉标题栏：标题与结果状态并列，便于快速判读 -->
      <div class="event-detail-drawer__head">
        <div class="event-detail-drawer__titles">
          <span class="event-detail-drawer__eyebrow">EVENT DETAIL</span>
          <h2 class="event-detail-drawer__title">事件详情</h2>
        </div>
        <ResultTag v-if="eventItem" :result="resolveTraceEventResult(eventItem)" />
      </div>
    </template>

    <template v-if="eventItem">
      <!-- 基础信息描述区 -->
      <el-descriptions :column="1" border>
        <el-descriptions-item label="事件 ID">{{ eventItem.eventId }}</el-descriptions-item>
        <el-descriptions-item label="Flow ID">{{ eventItem.flowId }}</el-descriptions-item>
        <el-descriptions-item label="候选人 ID">{{
          eventItem.interviewCandidateId ?? "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="事件码">{{
          formatTraceEventCode(eventItem.eventCode)
        }}</el-descriptions-item>
        <el-descriptions-item label="阶段">{{
          formatTraceStage(eventItem.stage)
        }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          <ResultTag :result="resolveTraceEventResult(eventItem)" />
        </el-descriptions-item>
        <el-descriptions-item label="错误码">{{ eventItem.errorCode || "-" }}</el-descriptions-item>
        <el-descriptions-item label="错误信息">{{
          eventItem.errorMessage || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="客户端时间">{{
          formatDisplayDateTime(eventItem.clientTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="服务端时间">
          {{ formatDisplayDateTime(resolveTraceEventServerTime(eventItem)) }}
        </el-descriptions-item>
        <el-descriptions-item label="请求 ID">{{
          eventItem.requestId || "-"
        }}</el-descriptions-item>
      </el-descriptions>

      <!-- 设备信息区域 -->
      <section class="event-detail-drawer__section">
        <div class="event-detail-drawer__section-head">
          <h3>设备信息</h3>
          <span class="event-detail-drawer__section-rule" aria-hidden="true"></span>
          <CopyButton :text="deviceInfoJson.copyText" :disabled="!deviceInfoJson.copyText" />
        </div>
        <JsonViewer :value="eventItem.deviceInfo" :text="deviceInfoJson.displayText" />
      </section>

      <!-- 扩展字段区域 -->
      <section class="event-detail-drawer__section">
        <div class="event-detail-drawer__section-head">
          <h3>扩展字段</h3>
          <span class="event-detail-drawer__section-rule" aria-hidden="true"></span>
          <CopyButton :text="extraJson.copyText" :disabled="!extraJson.copyText" />
        </div>
        <JsonViewer :value="eventItem.extra" :text="extraJson.displayText" />
      </section>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { TraceEventItem } from "@/api/trace";
import CopyButton from "@/components/CopyButton.vue";
import JsonViewer from "@/components/JsonViewer.vue";
import ResultTag from "@/components/ResultTag.vue";
import { formatDisplayDateTime } from "@/utils/date";
import { createJsonTextPair } from "@/utils/json";
import {
  formatTraceEventCode,
  formatTraceStage,
  resolveTraceEventResult,
  resolveTraceEventServerTime,
} from "@/utils/trace";

/** 抽屉显示状态。 */
const drawerVisible = ref(false);
/** 当前查看的事件。 */
const eventItem = ref<TraceEventItem | null>(null);
/** 是否为窄屏视口：只在跨越断点时变化，避免窗口 resize 期间每帧重渲染抽屉。 */
const isNarrowViewport = useMediaQuery("(max-width: 768px)");

/** 设备信息文本：展示与复制共用一次序列化结果，空数据时复制文本为空串以禁用按钮。 */
const deviceInfoJson = computed(() => createJsonTextPair(eventItem.value?.deviceInfo));
/** 扩展字段文本：同上。 */
const extraJson = computed(() => createJsonTextPair(eventItem.value?.extra));

/** 抽屉尺寸：移动端占满可视宽度，桌面端保持固定阅读宽度。 */
const drawerSize = computed(() => (isNarrowViewport.value ? "92%" : "560px"));

/** 打开事件详情抽屉。 */
const openDialog = (selectedEventItem: TraceEventItem) => {
  eventItem.value = selectedEventItem;
  drawerVisible.value = true;
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.event-detail-drawer__head {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
}

.event-detail-drawer__titles {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.event-detail-drawer__eyebrow {
  @include text-micro;

  color: $color-accent;
}

.event-detail-drawer__title {
  color: $color-text-primary;
  font-size: $font-size-lg;
  font-weight: 600;
  line-height: 24px;
}

.event-detail-drawer__section {
  margin-top: $space-6;
}

.event-detail-drawer__section-head {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.event-detail-drawer__section-head h3 {
  color: $color-text-primary;
  font-size: $font-size-sm;
  font-weight: 600;
  line-height: 18px;
}

/* 标题与复制按钮之间的自适应分隔线 */
.event-detail-drawer__section-rule {
  height: 1px;
  flex: 1;
  background: $color-border-soft;
}

@include screen-sm {
  .event-detail-drawer__section {
    margin-top: $space-5;
  }
}
</style>
