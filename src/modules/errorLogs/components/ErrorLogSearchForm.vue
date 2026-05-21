<!-- 错误日志筛选表单组件 -->
<template>
  <!-- 错误日志筛选表单区域 -->
  <el-card class="query-card" shadow="never">
    <el-form :model="queryForm" class="query-form" label-width="108px">
      <!-- FlowId 筛选 -->
      <el-form-item label="Flow ID">
        <el-input v-model.trim="queryForm.flowId" clearable placeholder="留空查询全部链路" />
      </el-form-item>

      <!-- 候选人 ID 筛选 -->
      <el-form-item label="候选人 ID">
        <el-input v-model.trim="queryForm.interviewCandidateId" clearable placeholder="留空查询全部候选人" />
      </el-form-item>

      <!-- 异常结果筛选 -->
      <el-form-item label="异常结果">
        <el-select v-model="resultFilter" placeholder="全部异常">
          <el-option
            v-for="resultOption in errorResultOptions"
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
import type { TraceFlowQuery } from "@/api/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";

const queryForm = defineModel<TraceFlowQuery>("query", { required: true });
const resultFilter = defineModel<string>("resultFilter", { required: true });

const { loading = false } = defineProps<{
  /** 查询按钮加载状态。 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** 触发错误日志查询。 */
  search: [];
  /** 重置查询条件。 */
  reset: [];
}>();

/** 错误日志筛选选项。 */
const { errorResultOptions } = useTraceOptions();
</script>
