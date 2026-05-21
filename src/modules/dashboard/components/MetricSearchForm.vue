<!-- 埋点总览筛选表单组件 -->
<template>
  <!-- 筛选表单区域 -->
  <el-card class="query-card" shadow="never">
    <el-form :model="queryForm" class="query-form" label-width="84px">
      <!-- 时间范围筛选 -->
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="queryForm.startTime"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择开始时间"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <!-- 结束时间筛选 -->
      <el-form-item label="结束时间">
        <el-date-picker
          v-model="queryForm.endTime"
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择结束时间"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
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
import type { TraceMetricQuery } from "@/api/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";

const queryForm = defineModel<TraceMetricQuery>({ required: true });

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
const { resultOptions, eventCodeOptions } = useTraceOptions();
</script>
