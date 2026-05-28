<!-- 埋点总览筛选表单组件 -->
<template>
  <!-- 筛选表单区域 -->
  <el-card class="query-card" shadow="never">
    <el-form :model="queryForm" class="query-form" label-width="84px">
      <!-- 时间范围筛选 -->
      <el-form-item class="query-form__range" label="时间范围">
        <el-date-picker
          v-model="serverDateRange"
          :shortcuts="dashboardDateRangeShortcuts"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <!-- 事件码筛选 -->
      <el-form-item label="事件码">
        <el-select
          v-model="queryForm.eventCode"
          allow-create
          clearable
          filterable
          placeholder="全部事件码"
        >
          <el-option
            v-for="eventCodeOption in eventCodeOptions"
            :key="eventCodeOption.value"
            :label="eventCodeOption.label"
            :value="eventCodeOption.value"
          />
        </el-select>
      </el-form-item>

      <!-- 结果筛选 -->
      <el-form-item label="结果">
        <el-select v-model="queryForm.result" placeholder="全部结果">
          <el-option
            v-for="resultOption in resultOptions"
            :key="resultOption.value"
            :label="resultOption.label"
            :value="resultOption.value"
          />
        </el-select>
      </el-form-item>

      <!-- 表单操作按钮 -->
      <el-form-item class="query-form__actions">
        <el-button :loading="loading" type="primary" @click="emit('search')">查询</el-button>
        <el-button @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

import type { TraceDashboardQuery } from "@/api/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";
import { formatTraceDate, formatTraceDateTime } from "@/utils/date";

const queryForm = defineModel<TraceDashboardQuery>({ required: true });

const { loading = false } = defineProps<{
  /** 查询按钮加载状态。 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** 触发查询。 */
  search: [];
  /** 重置查询条件。 */
  reset: [];
}>();

/** 埋点查询选项。 */
const { resultOptions, eventCodeOptions, dashboardDateRangeShortcuts } = useTraceOptions();

/** 转换日期范围选择器开始时间。 */
const toDateRangeStartTime = (startDate: string, endDate: string) => {
  /** 开始日期对象。 */
  const startDateTime = dayjs(startDate).startOf("day");
  /** 结束日期对象。 */
  const endDateTime = dayjs(endDate).startOf("day");
  if (startDateTime.isSame(endDateTime, "day")) {
    return formatTraceDateTime(startDateTime.hour(8));
  }

  return formatTraceDateTime(startDateTime);
};

/** 转换日期范围选择器结束时间。 */
const toDateRangeEndTime = (startDate: string, endDate: string) => {
  /** 开始日期对象。 */
  const startDateTime = dayjs(startDate).startOf("day");
  /** 结束日期对象。 */
  const endDateTime = dayjs(endDate).startOf("day");
  if (startDateTime.isSame(endDateTime, "day")) {
    return formatTraceDateTime(endDateTime.hour(22).minute(59).second(59));
  }

  return formatTraceDateTime(endDateTime.hour(23).minute(59).second(59));
};

/** 服务端时间日期范围。 */
const serverDateRange = computed<string[] | null>({
  get: () => {
    /** 服务端开始时间。 */
    const startTime = queryForm.value.startTime;
    /** 服务端结束时间。 */
    const endTime = queryForm.value.endTime;
    if (!startTime || !endTime) {
      return null;
    }

    return [formatTraceDate(startTime), formatTraceDate(endTime)];
  },
  set: (selectedDateRange) => {
    /** 选择后的开始日期。 */
    const [startDate = "", endDate = ""] = selectedDateRange ?? [];
    if (!startDate || !endDate) {
      queryForm.value.startTime = "";
      queryForm.value.endTime = "";
      return;
    }

    queryForm.value.startTime = toDateRangeStartTime(startDate, endDate);
    queryForm.value.endTime = toDateRangeEndTime(startDate, endDate);
  },
});
</script>
