<!-- 链路事件筛选表单组件 -->
<template>
  <!-- 链路筛选表单区域 -->
  <el-card class="query-card" shadow="never">
    <el-form :model="queryForm" class="query-form query-form--fixed-columns" label-width="108px">
      <!-- FlowId 筛选 -->
      <el-form-item label="Flow ID">
        <el-input v-model.trim="queryForm.flowId" clearable placeholder="留空查询全部链路" />
      </el-form-item>

      <!-- 候选人 ID 筛选 -->
      <el-form-item label="候选人 ID">
        <el-input v-model.trim="queryForm.interviewCandidateId" clearable placeholder="留空查询全部候选人" />
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

      <!-- 阶段筛选 -->
      <el-form-item label="阶段">
        <el-select v-model="queryForm.stage" clearable filterable placeholder="全部阶段">
          <el-option
            v-for="stageOption in stageOptions"
            :key="stageOption.value"
            :label="stageOption.label"
            :value="stageOption.value"
          />
        </el-select>
      </el-form-item>

      <!-- 结果筛选 -->
      <el-form-item label="结果">
        <el-select v-model="queryForm.result" clearable placeholder="全部结果">
          <el-option
            v-for="resultOption in resultOptions"
            :key="resultOption.value"
            :label="resultOption.label"
            :value="resultOption.value"
          />
        </el-select>
      </el-form-item>

      <!-- 耗时筛选 -->
      <el-form-item label="耗时(ms)">
        <el-input-number
          v-model="queryForm.durationMs"
          controls-position="right"
          :min="0"
          placeholder="请输入耗时"
          :step="1"
        />
      </el-form-item>

      <!-- 品牌筛选 -->
      <el-form-item label="品牌">
        <el-input v-model.trim="queryForm.brand" clearable placeholder="请输入品牌" />
      </el-form-item>

      <!-- 机型筛选 -->
      <el-form-item label="机型">
        <el-input v-model.trim="queryForm.model" clearable placeholder="请输入机型" />
      </el-form-item>

      <!-- 服务端时间范围筛选 -->
      <el-form-item class="query-form__range" label="服务端时间">
        <el-date-picker
          v-model="serverTimeRange"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <!-- 页面路径筛选 -->
      <el-form-item label="页面路径">
        <el-input v-model.trim="queryForm.pageRoute" clearable placeholder="请输入页面路径" />
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
import type { TraceFlowQuery } from "@/api/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";

const queryForm = defineModel<TraceFlowQuery>({ required: true });

const { loading = false } = defineProps<{
  /** 查询按钮加载状态。 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** 触发链路查询。 */
  search: [];
  /** 重置查询条件。 */
  reset: [];
}>();

/** 链路事件筛选选项。 */
const { eventCodeOptions, resultOptions, stageOptions } = useTraceOptions();

/** 服务端时间范围选择值。 */
const serverTimeRange = computed<string[] | null>({
  get: () => {
    /** 服务端开始时间。 */
    const startTime = queryForm.value.startTime;
    /** 服务端结束时间。 */
    const endTime = queryForm.value.endTime;
    if (!startTime || !endTime) {
      return null;
    }

    return [startTime, endTime];
  },
  set: (selectedServerTimeRange) => {
    /** 选择后的服务端时间范围。 */
    const [startTime = "", endTime = ""] = selectedServerTimeRange ?? [];
    queryForm.value.startTime = startTime;
    queryForm.value.endTime = endTime;
  },
});
</script>
