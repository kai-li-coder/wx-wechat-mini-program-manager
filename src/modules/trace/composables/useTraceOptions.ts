// 埋点查询选项配置。
import dayjs from "dayjs";

import type { TraceBrandQuickFilter, TraceDeviceQuickFilter } from "@/utils/trace";
import { formatTraceEventCode, formatTraceStage, traceEventCodes, traceStageCodes } from "@/utils/trace";

/** 日期范围快捷项。 */
interface DateRangeShortcut {
  /** 快捷项名称。 */
  text: string;
  /** 快捷项日期范围。 */
  value: () => [Date, Date];
}

/** 创建日期范围快捷项值。 */
const createDateRangeShortcutValue = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): [Date, Date] => [
  startDate.startOf("day").toDate(),
  endDate.startOf("day").toDate(),
];

/** 获取本周周一日期。 */
const resolveCurrentWeekStart = () => {
  /** 当前日期。 */
  const currentDate = dayjs();
  /** 距离周一的天数。 */
  const mondayOffset = (currentDate.day() + 6) % 7;

  return currentDate.subtract(mondayOffset, "day").startOf("day");
};

/** 获取本季度起始月份。 */
const resolveCurrentQuarterStart = () => {
  /** 当前日期。 */
  const currentDate = dayjs();
  /** 当前季度起始月份下标。 */
  const quarterStartMonth = Math.floor(currentDate.month() / 3) * 3;

  return currentDate.month(quarterStartMonth).startOf("month");
};

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

/** 错误日志机型快捷查询选项。 */
const errorDeviceQuickFilterOptions: Array<{ label: string; value: TraceDeviceQuickFilter }> = [
  { label: "全部机型", value: "" },
  { label: "IOS设备", value: "ios" },
  { label: "Android设备", value: "android" },
];

/** 错误日志品牌快捷查询选项。 */
const errorBrandQuickFilterOptions: Array<{ label: string; value: TraceBrandQuickFilter }> = [
  { label: "全部品牌", value: "" },
  { label: "iPhone", value: "iphone" },
  { label: "非iPhone", value: "nonIphone" },
];

/** 埋点总览日期范围快捷项。 */
const dashboardDateRangeShortcuts: DateRangeShortcut[] = [
  {
    text: "本年",
    value: () => createDateRangeShortcutValue(dayjs().startOf("year"), dayjs()),
  },
  {
    text: "本季度",
    value: () => {
      /** 本季度起始日期。 */
      const quarterStartDate = resolveCurrentQuarterStart();

      return createDateRangeShortcutValue(quarterStartDate, quarterStartDate.add(2, "month").endOf("month"));
    },
  },
  {
    text: "本月",
    value: () => createDateRangeShortcutValue(dayjs().startOf("month"), dayjs()),
  },
  {
    text: "本周",
    value: () => {
      /** 本周周一日期。 */
      const weekStartDate = resolveCurrentWeekStart();

      return createDateRangeShortcutValue(weekStartDate, weekStartDate.add(6, "day"));
    },
  },
  {
    text: "本日",
    value: () => createDateRangeShortcutValue(dayjs(), dayjs()),
  },
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
  errorDeviceQuickFilterOptions,
  errorBrandQuickFilterOptions,
  eventCodeOptions,
  stageOptions,
  dashboardDateRangeShortcuts,
});
