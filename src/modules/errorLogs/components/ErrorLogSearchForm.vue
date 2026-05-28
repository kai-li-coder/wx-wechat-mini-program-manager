<!-- 错误日志筛选表单组件 -->
<template>
  <!-- 错误日志筛选表单区域 -->
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

      <!-- 品牌筛选 -->
      <el-form-item label="品牌">
        <!-- 品牌标签输入框 -->
        <el-input-tag
          v-model="brandFilterTags"
          class="query-form__tag-input"
          clearable
          :delimiter="traceErrorTagDelimiter"
          placeholder="请输入品牌或 iPhone/非 iPhone"
          tag-effect="plain"
        />
      </el-form-item>

      <!-- 机型筛选 -->
      <el-form-item label="机型">
        <!-- 机型标签输入框 -->
        <el-input-tag
          v-model="modelFilterTags"
          class="query-form__tag-input"
          clearable
          :delimiter="traceErrorTagDelimiter"
          placeholder="请输入机型或 iOS设备/Android设备"
          tag-effect="plain"
        />
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
        <el-select v-model="resultFilter" placeholder="全部异常">
          <el-option
            v-for="resultOption in errorResultOptions"
            :key="resultOption.value"
            :label="resultOption.label"
            :value="resultOption.value"
          />
        </el-select>
      </el-form-item>

      <!-- 测试记录筛选 -->
      <el-form-item label="测试记录">
        <el-switch v-model="isExcludeTestRecords" active-text="过滤devtools" inactive-text="不过滤" />
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
import type { TraceBrandQuickFilter, TraceDeviceQuickFilter } from "@/utils/trace";
import { useTraceOptions } from "@/modules/trace/composables/useTraceOptions";
import { normalizeTraceErrorBrandTags, normalizeTraceErrorDeviceTags } from "@/utils/trace";

const queryForm = defineModel<TraceFlowQuery>("query", { required: true });
const resultFilter = defineModel<string>("resultFilter", { required: true });
const deviceQuickFilter = defineModel<TraceDeviceQuickFilter>("deviceQuickFilter", { required: true });
const brandQuickFilter = defineModel<TraceBrandQuickFilter>("brandQuickFilter", { required: true });
const brandTags = defineModel<string[]>("brandTags", { required: true });
const modelTags = defineModel<string[]>("modelTags", { required: true });
const isExcludeTestRecords = defineModel<boolean>("excludeTestRecords", { required: true });

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
const { errorResultOptions, eventCodeOptions } = useTraceOptions();

/** 错误日志标签分隔符。 */
const traceErrorTagDelimiter = /[,，]/;

/** 品牌筛选标签。 */
const brandFilterTags = computed<string[]>({
  get: () => brandTags.value,
  set: (selectedBrandTags) => {
    /** 规范化后的品牌标签筛选。 */
    const normalizedBrandFilter = normalizeTraceErrorBrandTags(selectedBrandTags);
    brandTags.value = normalizedBrandFilter.tags;
    queryForm.value.brand = normalizedBrandFilter.brand;
    brandQuickFilter.value = normalizedBrandFilter.brandQuickFilter;
  },
});

/** 机型筛选标签。 */
const modelFilterTags = computed<string[]>({
  get: () => modelTags.value,
  set: (selectedModelTags) => {
    /** 规范化后的机型标签筛选。 */
    const normalizedDeviceFilter = normalizeTraceErrorDeviceTags(selectedModelTags);
    modelTags.value = normalizedDeviceFilter.tags;
    queryForm.value.model = normalizedDeviceFilter.model;
    deviceQuickFilter.value = normalizedDeviceFilter.deviceQuickFilter;
  },
});

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
.query-form__tag-input {
  width: 100%;
}
</style>
