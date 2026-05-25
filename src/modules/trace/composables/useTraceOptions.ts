// 埋点查询选项配置。
import { formatTraceEventCode, formatTraceStage, traceEventCodes, traceStageCodes } from "@/utils/trace";

/** 埋点结果选项。 */
const resultOptions = [
  { label: "全部", value: "" },
  { label: "成功", value: "success" },
  { label: "警告", value: "warning" },
  { label: "失败", value: "fail" },
];

/** 错误日志结果选项。 */
const errorResultOptions = [
  { label: "全部异常", value: "" },
  { label: "失败", value: "fail" },
  { label: "警告", value: "warning" },
];

/** 全部埋点事件码选项。 */
const eventCodeOptions = traceEventCodes.map((eventCode) => ({
  label: formatTraceEventCode(eventCode),
  value: eventCode,
}));

/** 全部链路阶段选项。 */
const stageOptions = traceStageCodes.map((stage) => ({
  label: formatTraceStage(stage),
  value: stage,
}));

/** 获取埋点查询选项。 */
export const useTraceOptions = () => ({
  resultOptions,
  errorResultOptions,
  eventCodeOptions,
  stageOptions,
});
