<!-- 错误日志筛选表单组件 -->
<template>
  <!-- 错误日志筛选表单区域 -->
  <el-card class="query-card" shadow="never">
    <el-form :model="queryForm" class="query-form query-form--fixed-columns" label-width="92px">
      <!-- FlowId 筛选 -->
      <el-form-item label="Flow ID">
        <el-input v-model.trim="queryForm.flowId" clearable placeholder="留空查询全部链路" />
      </el-form-item>

      <!-- 候选人 ID 筛选 -->
      <el-form-item label="候选人 ID">
        <el-input
          v-model.trim="queryForm.interviewCandidateId"
          clearable
          placeholder="留空查询全部候选人"
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

      <!-- 品牌筛选：固定 iPhone / Android / 其他 三档，选择「其他」时展开品牌名输入框 -->
      <el-form-item label="品牌">
        <div class="query-form__brand-field">
          <!-- 品牌筛选下拉框 -->
          <el-select
            v-model="brandMode"
            clearable
            placeholder="全部品牌"
            @change="handleBrandModeChange"
          >
            <el-option
              v-for="brandFilterOption in errorBrandFilterOptions"
              :key="brandFilterOption.value"
              :label="brandFilterOption.label"
              :value="brandFilterOption.value"
            />
          </el-select>

          <!-- 其他品牌名称输入框：仅「其他」档位展示 -->
          <el-input
            v-if="brandMode === 'other'"
            v-model.trim="brandKeyword"
            clearable
            placeholder="请输入品牌名称"
          />
        </div>
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

      <!-- 异常结果筛选 -->
      <el-form-item label="异常结果">
        <el-select v-model="queryForm.result" placeholder="请选择异常结果">
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
import type { TraceErrorBrandFilterMode } from "@/utils/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";

const queryForm = defineModel<TraceFlowQuery>("query", { required: true });
/** 品牌筛选模式：iPhone / Android / 其他。 */
const brandMode = defineModel<TraceErrorBrandFilterMode>("brandMode", { required: true });
/** 「其他」模式下手工填写的品牌名称。 */
const brandKeyword = defineModel<string>("brandKeyword", { required: true });

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
const { errorBrandFilterOptions, errorResultOptions, eventCodeOptions } = useTraceOptions();

/**
 * 切换品牌筛选模式。
 * 离开「其他」时立即清空手填品牌名，避免残留关键字参与下一次查询。
 */
const handleBrandModeChange = (selectedBrandMode?: TraceErrorBrandFilterMode) => {
  if (selectedBrandMode !== "other") {
    brandKeyword.value = "";
  }
};

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

<style scoped lang="scss">
/*
 * 品牌选择「其他」时该单元格会额外展开一行输入框，栅格行高随之变化。
 * 统一顶部对齐，让标签与首行控件保持在同一水平线上。
 */
.query-form {
  align-items: start;
}

.query-form__actions {
  align-self: start;
}

/* 品牌字段：下拉框与「其他」品牌名输入框纵向排列 */
.query-form__brand-field {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: $space-2;
}
</style>
