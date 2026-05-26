// 日期格式化与默认时间范围工具。
import dayjs from "dayjs";

/** 后端埋点查询使用的日期时间格式。 */
export const TRACE_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
/** 日期范围选择器使用的日期格式。 */
export const TRACE_DATE_FORMAT = "YYYY-MM-DD";
/** 页面展示使用的日期时间格式。 */
export const DISPLAY_DATE_TIME_FORMAT = "YYYY/MM/DD HH:mm:ss";

/** 格式化为后端查询时间。 */
export const formatTraceDateTime = (value: dayjs.ConfigType) =>
  dayjs(value).format(TRACE_DATE_TIME_FORMAT);

/** 格式化为日期范围选择器日期。 */
export const formatTraceDate = (value: dayjs.ConfigType) => dayjs(value).format(TRACE_DATE_FORMAT);

/** 格式化为页面展示时间。 */
export const formatDisplayDateTime = (value?: dayjs.ConfigType) => {
  if (!value) {
    return "-";
  }

  /** 解析后的日期对象。 */
  const dateTime = dayjs(value);
  return dateTime.isValid() ? dateTime.format(DISPLAY_DATE_TIME_FORMAT) : "-";
};

/** 创建最近 24 小时整点查询范围。 */
export const createRecent24HourRange = () => {
  /** 当前小时整点。 */
  const endHour = dayjs().startOf("hour");
  /** 24 小时前整点。 */
  const startHour = endHour.subtract(24, "hour");

  return {
    startTime: formatTraceDateTime(startHour),
    endTime: formatTraceDateTime(endHour),
  };
};

/** 创建本日工作时段查询范围。 */
export const createTodayTraceRange = () => {
  /** 今日日期。 */
  const currentDay = dayjs().startOf("day");

  return {
    startTime: formatTraceDateTime(currentDay.hour(8)),
    endTime: formatTraceDateTime(currentDay.hour(22).minute(59).second(59)),
  };
};
