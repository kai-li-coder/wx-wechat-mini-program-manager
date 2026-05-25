// 埋点查询选项配置。
import { formatTraceEventCode } from "@/utils/trace";

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

/** 常见埋点事件码选项。 */
const eventCodeOptions = [
  { label: formatTraceEventCode("camera_init_fail"), value: "camera_init_fail" },
  { label: formatTraceEventCode("record_stop_timeout"), value: "record_stop_timeout" },
  { label: formatTraceEventCode("upload_fail"), value: "upload_fail" },
  { label: formatTraceEventCode("submit_fail"), value: "submit_fail" },
  { label: formatTraceEventCode("unexpected_hide"), value: "unexpected_hide" },
  { label: formatTraceEventCode("interrupt_continue"), value: "interrupt_continue" },
];

/** 获取埋点查询选项。 */
export const useTraceOptions = () => ({
  resultOptions,
  errorResultOptions,
  eventCodeOptions,
});
