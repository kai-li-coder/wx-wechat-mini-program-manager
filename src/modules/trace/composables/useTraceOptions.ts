// 埋点查询选项配置。
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
  { label: "camera_init_fail", value: "camera_init_fail" },
  { label: "record_stop_timeout", value: "record_stop_timeout" },
  { label: "upload_fail", value: "upload_fail" },
  { label: "submit_fail", value: "submit_fail" },
  { label: "unexpected_hide", value: "unexpected_hide" },
  { label: "interrupt_continue", value: "interrupt_continue" },
];

/** 获取埋点查询选项。 */
export const useTraceOptions = () => ({
  resultOptions,
  errorResultOptions,
  eventCodeOptions,
});
