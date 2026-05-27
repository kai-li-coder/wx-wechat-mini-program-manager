// 埋点数据聚合和过滤工具。
import dayjs from "dayjs";

import type { TraceEventItem, TraceMetricItem } from "@/api/trace";
import { TRACE_DATE_FORMAT, TRACE_DATE_TIME_FORMAT } from "@/utils/date";

/** 埋点聚合汇总结果。 */
export interface TraceMetricSummary {
  /** 事件总数。 */
  eventCount: number;
  /** 涉及链路数。 */
  flowCount: number;
  /** 涉及候选人数。 */
  candidateCount: number;
}

/** 错误预警等级。 */
export type TraceErrorWarningLevel = "normal" | "watch" | "warning" | "critical";

/** 错误预警摘要。 */
export interface TraceErrorWarningSummary {
  /** 预警等级。 */
  level: TraceErrorWarningLevel;
  /** 统计日期。 */
  warningDate: string;
  /** 事件总数。 */
  eventCount: number;
  /** 失败事件数。 */
  failCount: number;
  /** 失败事件占比。 */
  failRate: number;
  /** 候选人数。 */
  candidateCount: number;
  /** 受影响候选人数。 */
  affectedCandidateCount: number;
  /** 受影响候选人占比。 */
  affectedCandidateRate: number;
  /** 触发原因。 */
  triggerReasons: string[];
}

/** 趋势图单个小时聚合项。 */
export interface TraceTrendRow {
  /** 小时粒度时间。 */
  metricHour: string;
  /** 趋势图展示标签。 */
  metricLabel?: string;
  /** 失败事件数。 */
  failCount: number;
  /** 警告事件数。 */
  warningCount: number;
  /** 成功事件数。 */
  successCount: number;
}

/** 候选人趋势图聚合项。 */
export interface TraceCandidateTrendRow {
  /** 小时粒度时间。 */
  metricHour: string;
  /** 趋势图展示标签。 */
  metricLabel?: string;
  /** 去重候选人数。 */
  candidateCount: number;
}

/** 趋势图聚合粒度。 */
type TraceTrendGranularity = "month" | "day" | "hour";

/** 趋势图构建选项。 */
export interface TraceTrendBuildOptions {
  /** 查询开始时间。 */
  startTime?: string;
  /** 查询结束时间。 */
  endTime?: string;
}

/** 趋势图坐标轴项。 */
interface TraceTrendAxisItem {
  /** 坐标轴聚合键。 */
  metricHour: string;
  /** 坐标轴展示标签。 */
  metricLabel: string;
}

/** 事件码排行项。 */
export interface TraceEventRankItem {
  /** 事件码。 */
  eventCode: string;
  /** 事件数。 */
  eventCount: number;
  /** 涉及链路数。 */
  flowCount: number;
  /** 涉及候选人数。 */
  candidateCount: number;
}

/** 埋点聚合构建中间项。 */
interface TraceMetricBuildItem {
  /** 聚合项。 */
  metricItem: TraceMetricItem;
  /** 涉及链路集合。 */
  flowIdSet: Set<string>;
  /** 涉及候选人集合。 */
  candidateIdSet: Set<number>;
}

/** 候选人趋势构建中间项。 */
interface TraceCandidateTrendBuildItem {
  /** 候选人趋势项。 */
  candidateTrendRow: TraceCandidateTrendRow;
  /** 当前时间桶去重候选人集合。 */
  candidateIdSet: Set<number>;
}

/** 错误预警构建中间项。 */
interface TraceErrorWarningBuildItem {
  /** 统计日期。 */
  warningDate: string;
  /** 事件总数。 */
  eventCount: number;
  /** 失败事件数。 */
  failCount: number;
  /** 候选人集合。 */
  candidateIdSet: Set<number>;
  /** 受影响候选人集合。 */
  affectedCandidateIdSet: Set<number>;
}

/** 阶段中文文案字典。 */
const traceStageLabelMap = new Map<string, string>([
  ["interview_list_start", "面试列表开始"],
  ["link_page_on_load", "链接页加载"],
  ["link_page_confirm_enter", "链接页确认进入"],
  ["link_page_continue_enter", "链接页继续进入"],
  ["link_page_info_interview_fail", "链接页面试信息异常"],
  ["person_info_page_on_load", "个人信息页加载"],
  ["person_info_confirm_success", "个人信息确认成功"],
  ["device_check_pass", "设备检测通过"],
  ["guide_page_mounted", "引导页挂载"],
  ["guide_page_loaded", "引导页加载完成"],
  ["guide_page_start_answer", "引导页开始答题"],
  ["guide_page_load_fail", "引导页加载异常"],
  ["answer_short_on_show", "短答页显示"],
  ["answer_short_interrupt_check", "短答页中断检测"],
  ["answer_short_interrupt_check_fail", "短答页中断检测异常"],
  ["answer_short_to_interrupt_page", "短答页跳转中断页"],
  ["answer_short_to_interview_page", "短答页跳转面试页"],
  ["interrupt_page_on_load", "中断页加载"],
  ["camera_init_timeout", "摄像头初始化超时"],
  ["camera_init_fail", "摄像头初始化失败"],
  ["record_stop_timeout", "录制停止超时"],
  ["oss_upload_fail", "OSS 上传失败"],
  ["upload_fail", "上传失败"],
  ["submit_fail", "提交失败"],
  ["unexpected_hide", "页面异常隐藏"],
  ["interrupt_continue", "中断后继续"],
  ["end_page_mounted", "结束页挂载"],
  ["end_page_load_fail", "结束页加载异常"],
  ["request_auth_check", "请求鉴权检测"],
  ["flow_enter", "进入答题链路"],
  ["business_fail", "业务异常"],
  ["codex_production_telemetry_check", "生产埋点连通性检测"],
]);

/** 当前支持筛选的全部链路阶段编码。 */
export const traceStageCodes = [...traceStageLabelMap.keys()];

/** 事件码中文文案字典。 */
const traceEventCodeLabelMap = new Map<string, string>([
  ...traceStageLabelMap,
  ["interrupt_check", "中断检测"],
  ["auth_redirect", "鉴权重定向"],
  ["flow_leave", "离开答题链路"],
]);

/** 当前支持筛选的全部埋点事件码。 */
export const traceEventCodes = [...traceEventCodeLabelMap.keys()];

/** 需要按警告归类的错误码集合。 */
const warningErrorCodeSet = new Set(["NO_TOKEN"]);
/** 需要按警告归类的错误信息集合。 */
const warningErrorMessageSet = new Set(["未登录，请先登录", "摄像头或麦克风未授权", "面试已交卷"]);
/** 错误预警空摘要。 */
const emptyErrorWarningSummary: TraceErrorWarningSummary = {
  level: "normal",
  warningDate: "",
  eventCount: 0,
  failCount: 0,
  failRate: 0,
  candidateCount: 0,
  affectedCandidateCount: 0,
  affectedCandidateRate: 0,
  triggerReasons: [],
};
/** 错误观察占比阈值。 */
const ERROR_WATCH_RATE_THRESHOLD = 0.03;
/** 错误观察事件数阈值。 */
const ERROR_WATCH_FAIL_COUNT_THRESHOLD = 5;
/** 错误预警占比阈值。 */
const ERROR_WARNING_RATE_THRESHOLD = 0.05;
/** 错误预警事件数阈值。 */
const ERROR_WARNING_FAIL_COUNT_THRESHOLD = 10;
/** 严重错误占比阈值。 */
const ERROR_CRITICAL_RATE_THRESHOLD = 0.1;
/** 严重错误事件数阈值。 */
const ERROR_CRITICAL_FAIL_COUNT_THRESHOLD = 10;
/** 严重受影响候选人占比阈值。 */
const ERROR_CRITICAL_AFFECTED_CANDIDATE_RATE_THRESHOLD = 0.05;
/** 严重受影响候选人数阈值。 */
const ERROR_CRITICAL_AFFECTED_CANDIDATE_COUNT_THRESHOLD = 3;
/** 错误预警等级排序权重。 */
const errorWarningLevelWeightMap = new Map<TraceErrorWarningLevel, number>([
  ["normal", 0],
  ["watch", 1],
  ["warning", 2],
  ["critical", 3],
]);

/** 判断值是否为可读取字段的普通对象。 */
const isTraceRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 解析设备信息对象，兼容后端直接返回 JSON 字符串的场景。 */
const resolveTraceDeviceInfo = (deviceInfo: unknown): Record<string, unknown> | null => {
  if (isTraceRecord(deviceInfo)) {
    return deviceInfo;
  }

  if (typeof deviceInfo !== "string") {
    return null;
  }

  try {
    const parsedDeviceInfo: unknown = JSON.parse(deviceInfo);
    if (isTraceRecord(parsedDeviceInfo)) {
      return parsedDeviceInfo;
    }
  } catch {
    return null;
  }

  return null;
};

/** 格式化设备字段展示值。 */
const formatTraceDeviceField = (fieldValue: unknown) => String(fieldValue ?? "").trim();

/** 格式化链路事件阶段，展示中文文案与原始阶段编码。 */
export const formatTraceStage = (stage?: string) => {
  /** 清理后的阶段编码。 */
  const normalizedStage = String(stage ?? "").trim();
  if (!normalizedStage) {
    return "-";
  }

  /** 阶段中文文案。 */
  const stageLabel = traceStageLabelMap.get(normalizedStage);
  if (!stageLabel) {
    return normalizedStage;
  }

  return `${stageLabel}（${normalizedStage}）`;
};

/** 格式化埋点事件码，展示中文文案与原始编码。 */
export const formatTraceEventCode = (eventCode?: string) => {
  /** 清理后的事件码。 */
  const normalizedEventCode = String(eventCode ?? "").trim();
  if (!normalizedEventCode) {
    return "-";
  }

  /** 事件码中文文案。 */
  const eventCodeLabel = traceEventCodeLabelMap.get(normalizedEventCode);
  if (!eventCodeLabel) {
    return normalizedEventCode;
  }

  return `${eventCodeLabel}（${normalizedEventCode}）`;
};

/** 获取链路事件表格稳定行键。 */
export const resolveTraceEventRowKey = (eventItem: TraceEventItem) => {
  if (eventItem.eventId) {
    return eventItem.eventId;
  }

  return String(eventItem.id ?? `${eventItem.flowId}-${eventItem.clientTime}`);
};

/** 获取服务端记录时间，优先使用实际返回的创建时间。 */
export const resolveTraceEventServerTime = (eventItem: TraceEventItem) =>
  eventItem.createdAt || eventItem.serverTime;

/** 获取链路事件归类后的结果，指定错误码和错误信息统一按警告展示和筛选。 */
export const resolveTraceEventResult = (eventItem: TraceEventItem) => {
  /** 标准化后的错误码。 */
  const normalizedErrorCode = String(eventItem.errorCode ?? "")
    .trim()
    .toUpperCase();
  /** 标准化后的错误信息。 */
  const normalizedErrorMessage = String(eventItem.errorMessage ?? "").trim();

  if (warningErrorCodeSet.has(normalizedErrorCode) || warningErrorMessageSet.has(normalizedErrorMessage)) {
    return "warning";
  }

  return eventItem.result;
};

/** 获取客户端时间排序值，无效客户端时间排在末尾。 */
const resolveClientTimeSortValue = (eventItem: TraceEventItem) => {
  /** 客户端时间对象。 */
  const clientDateTime = dayjs(eventItem.clientTime);

  return clientDateTime.isValid() ? clientDateTime.valueOf() : Number.NEGATIVE_INFINITY;
};

/** 按客户端时间倒序返回新的链路事件列表。 */
export const toClientTimeDescEventItems = (eventItems: TraceEventItem[]) =>
  [...eventItems].sort((leftEventItem, rightEventItem) => {
    /** 左侧事件客户端时间排序值。 */
    const leftClientTimeValue = resolveClientTimeSortValue(leftEventItem);
    /** 右侧事件客户端时间排序值。 */
    const rightClientTimeValue = resolveClientTimeSortValue(rightEventItem);

    if (leftClientTimeValue === rightClientTimeValue) {
      return 0;
    }

    return rightClientTimeValue - leftClientTimeValue;
  });

/** 格式化终端型号，展示品牌与型号拼接值。 */
export const formatTraceTerminalModel = (deviceInfo: unknown) => {
  /** 解析后的设备信息。 */
  const resolvedDeviceInfo = resolveTraceDeviceInfo(deviceInfo);
  if (!resolvedDeviceInfo) {
    return "-";
  }

  /** 终端品牌。 */
  const brand = formatTraceDeviceField(resolvedDeviceInfo.brand);
  /** 终端型号。 */
  const model = formatTraceDeviceField(resolvedDeviceInfo.model);
  /** 终端型号展示文本。 */
  const terminalModel = `${brand}-${model}`;

  return terminalModel || "-";
};

/** 统计埋点聚合摘要。 */
export const aggregateMetricSummary = (metricItems: TraceMetricItem[]): TraceMetricSummary =>
  metricItems.reduce(
    (summary, metricItem) => ({
      eventCount: summary.eventCount + metricItem.eventCount,
      flowCount: summary.flowCount + metricItem.flowCount,
      candidateCount: summary.candidateCount + metricItem.candidateCount,
    }),
    { eventCount: 0, flowCount: 0, candidateCount: 0 },
  );

/** 将事件服务端时间转换为小时聚合时间。 */
const toMetricHour = (eventItem: TraceEventItem) => {
  /** 服务端记录时间对象。 */
  const serverDateTime = dayjs(resolveTraceEventServerTime(eventItem));

  return serverDateTime.isValid() ? serverDateTime.startOf("hour").format("YYYY-MM-DD HH:mm:ss") : "";
};

/** 将链路事件明细转换为前端聚合数据。 */
export const toMetricItemsFromEvents = (eventItems: TraceEventItem[]): TraceMetricItem[] => {
  /** 聚合中间数据字典。 */
  const metricBuildItemMap = new Map<string, TraceMetricBuildItem>();

  eventItems.forEach((eventItem) => {
    /** 小时聚合时间。 */
    const metricHour = toMetricHour(eventItem);
    if (!metricHour) {
      return;
    }

    /** 归类后的事件结果。 */
    const resolvedEventResult = resolveTraceEventResult(eventItem);
    /** 聚合唯一键。 */
    const metricKey = `${metricHour}\u0001${eventItem.eventCode}\u0001${resolvedEventResult}`;
    /** 聚合中间项。 */
    const metricBuildItem =
      metricBuildItemMap.get(metricKey) ??
      ({
        metricItem: {
          metricHour,
          eventCode: eventItem.eventCode,
          result: resolvedEventResult,
          eventCount: 0,
          flowCount: 0,
          candidateCount: 0,
        },
        flowIdSet: new Set<string>(),
        candidateIdSet: new Set<number>(),
      } satisfies TraceMetricBuildItem);

    metricBuildItem.metricItem.eventCount += 1;
    if (eventItem.flowId) {
      metricBuildItem.flowIdSet.add(eventItem.flowId);
    }
    if (eventItem.interviewCandidateId !== null) {
      metricBuildItem.candidateIdSet.add(eventItem.interviewCandidateId);
    }
    metricBuildItemMap.set(metricKey, metricBuildItem);
  });

  return [...metricBuildItemMap.values()]
    .map(({ metricItem, flowIdSet, candidateIdSet }) => ({
      ...metricItem,
      flowCount: flowIdSet.size,
      candidateCount: candidateIdSet.size,
    }))
    .sort((leftItem, rightItem) => leftItem.metricHour.localeCompare(rightItem.metricHour));
};

/** 解析趋势图时间范围。 */
const resolveTrendDateRange = (options?: TraceTrendBuildOptions) => {
  if (!options?.startTime || !options.endTime) {
    return null;
  }

  /** 开始时间对象。 */
  const startDateTime = dayjs(options.startTime);
  /** 结束时间对象。 */
  const endDateTime = dayjs(options.endTime);
  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    return null;
  }

  return { startDateTime, endDateTime };
};

/** 解析趋势图聚合粒度。 */
const resolveTrendGranularity = (startDateTime: dayjs.Dayjs, endDateTime: dayjs.Dayjs): TraceTrendGranularity => {
  if (startDateTime.isSame(endDateTime, "day")) {
    return "hour";
  }

  if (endDateTime.diff(startDateTime, "day") > 31) {
    return "month";
  }

  return "day";
};

/** 格式化趋势图聚合键。 */
const formatTrendBucketKey = (dateTime: dayjs.Dayjs, granularity: TraceTrendGranularity) => {
  if (granularity === "month") {
    return dateTime.startOf("month").format(TRACE_DATE_TIME_FORMAT);
  }

  if (granularity === "day") {
    return dateTime.startOf("day").format(TRACE_DATE_TIME_FORMAT);
  }

  return dateTime.startOf("hour").format(TRACE_DATE_TIME_FORMAT);
};

/** 格式化趋势图坐标轴标签。 */
const formatTrendBucketLabel = (dateTime: dayjs.Dayjs, granularity: TraceTrendGranularity) => {
  if (granularity === "month") {
    return `${dateTime.month() + 1}月`;
  }

  if (granularity === "day") {
    return dateTime.format("MM-DD");
  }

  return `${dateTime.hour()}点`;
};

/** 创建趋势图坐标轴项。 */
const createTrendAxisItems = (
  startDateTime: dayjs.Dayjs,
  endDateTime: dayjs.Dayjs,
  granularity: TraceTrendGranularity,
) => {
  /** 坐标轴项列表。 */
  const trendAxisItems: TraceTrendAxisItem[] = [];

  if (granularity === "hour") {
    /** 当日日期。 */
    const currentDay = startDateTime.startOf("day");
    for (let hour = 8; hour <= 22; hour += 1) {
      /** 小时坐标点。 */
      const hourDateTime = currentDay.hour(hour);
      trendAxisItems.push({
        metricHour: formatTrendBucketKey(hourDateTime, granularity),
        metricLabel: formatTrendBucketLabel(hourDateTime, granularity),
      });
    }

    return trendAxisItems;
  }

  /** 坐标轴循环游标。 */
  let cursorDateTime = granularity === "month" ? startDateTime.startOf("month") : startDateTime.startOf("day");
  /** 坐标轴结束游标。 */
  const endCursorDateTime = granularity === "month" ? endDateTime.startOf("month") : endDateTime.startOf("day");

  while (cursorDateTime.isBefore(endCursorDateTime) || cursorDateTime.isSame(endCursorDateTime)) {
    trendAxisItems.push({
      metricHour: formatTrendBucketKey(cursorDateTime, granularity),
      metricLabel: formatTrendBucketLabel(cursorDateTime, granularity),
    });
    cursorDateTime = cursorDateTime.add(1, granularity);
  }

  return trendAxisItems;
};

/** 累加趋势图行事件数。 */
const appendTrendRowCount = (trendRow: TraceTrendRow, metricItem: TraceMetricItem) => {
  if (metricItem.result === "fail") {
    trendRow.failCount += metricItem.eventCount;
    return;
  }

  if (metricItem.result === "warning") {
    trendRow.warningCount += metricItem.eventCount;
    return;
  }

  trendRow.successCount += metricItem.eventCount;
};

/** 按指定时间范围转换趋势图行。 */
const toRangedMetricTrendRows = (
  metricItems: TraceMetricItem[],
  startDateTime: dayjs.Dayjs,
  endDateTime: dayjs.Dayjs,
) => {
  /** 趋势图聚合粒度。 */
  const granularity = resolveTrendGranularity(startDateTime, endDateTime);
  /** 坐标轴项列表。 */
  const trendAxisItems = createTrendAxisItems(startDateTime, endDateTime, granularity);
  /** 按坐标轴聚合后的趋势数据。 */
  const trendRowMap = new Map<string, TraceTrendRow>(
    trendAxisItems.map((axisItem) => [
      axisItem.metricHour,
      {
        metricHour: axisItem.metricHour,
        metricLabel: axisItem.metricLabel,
        failCount: 0,
        warningCount: 0,
        successCount: 0,
      },
    ]),
  );

  metricItems.forEach((metricItem) => {
    /** 聚合时间对象。 */
    const metricDateTime = dayjs(metricItem.metricHour);
    if (!metricDateTime.isValid()) {
      return;
    }

    /** 坐标轴聚合键。 */
    const trendBucketKey = formatTrendBucketKey(metricDateTime, granularity);
    /** 趋势图行。 */
    const trendRow = trendRowMap.get(trendBucketKey);
    if (!trendRow) {
      return;
    }

    appendTrendRowCount(trendRow, metricItem);
  });

  return [...trendRowMap.values()];
};

/** 将聚合数据转换为趋势图行。 */
export const toMetricTrendRows = (
  metricItems: TraceMetricItem[],
  options?: TraceTrendBuildOptions,
): TraceTrendRow[] => {
  /** 趋势图时间范围。 */
  const trendDateRange = resolveTrendDateRange(options);
  if (trendDateRange) {
    return toRangedMetricTrendRows(
      metricItems,
      trendDateRange.startDateTime,
      trendDateRange.endDateTime,
    );
  }

  /** 按小时分组后的趋势数据。 */
  const trendRowMap = new Map<string, TraceTrendRow>();

  metricItems.forEach((metricItem) => {
    const trendRow = trendRowMap.get(metricItem.metricHour) ?? {
      metricHour: metricItem.metricHour,
      failCount: 0,
      warningCount: 0,
      successCount: 0,
    };

    appendTrendRowCount(trendRow, metricItem);

    trendRowMap.set(metricItem.metricHour, trendRow);
  });

  return [...trendRowMap.values()].sort((leftRow, rightRow) =>
    leftRow.metricHour.localeCompare(rightRow.metricHour),
  );
};

/** 创建候选人趋势构建中间项。 */
const createCandidateTrendBuildItem = (metricHour: string, metricLabel?: string): TraceCandidateTrendBuildItem => {
  /** 候选人趋势行。 */
  const candidateTrendRow: TraceCandidateTrendRow = {
    metricHour,
    candidateCount: 0,
  };

  if (metricLabel) {
    candidateTrendRow.metricLabel = metricLabel;
  }

  return {
    candidateTrendRow,
    candidateIdSet: new Set<number>(),
  };
};

/** 追加候选人趋势桶去重候选人。 */
const appendCandidateTrendCandidate = (
  candidateTrendBuildItem: TraceCandidateTrendBuildItem,
  interviewCandidateId: number,
) => {
  candidateTrendBuildItem.candidateIdSet.add(interviewCandidateId);
  candidateTrendBuildItem.candidateTrendRow.candidateCount = candidateTrendBuildItem.candidateIdSet.size;
};

/** 按指定时间范围转换候选人趋势行。 */
const toRangedCandidateTrendRows = (
  eventItems: TraceEventItem[],
  startDateTime: dayjs.Dayjs,
  endDateTime: dayjs.Dayjs,
) => {
  /** 趋势图聚合粒度。 */
  const granularity = resolveTrendGranularity(startDateTime, endDateTime);
  /** 坐标轴项列表。 */
  const trendAxisItems = createTrendAxisItems(startDateTime, endDateTime, granularity);
  /** 按坐标轴聚合后的候选人趋势数据。 */
  const candidateTrendBuildItemMap = new Map<string, TraceCandidateTrendBuildItem>(
    trendAxisItems.map((axisItem) => [
      axisItem.metricHour,
      createCandidateTrendBuildItem(axisItem.metricHour, axisItem.metricLabel),
    ]),
  );

  eventItems.forEach((eventItem) => {
    if (eventItem.interviewCandidateId === null) {
      return;
    }

    /** 服务端记录时间对象。 */
    const metricDateTime = dayjs(resolveTraceEventServerTime(eventItem));
    if (!metricDateTime.isValid()) {
      return;
    }

    /** 坐标轴聚合键。 */
    const trendBucketKey = formatTrendBucketKey(metricDateTime, granularity);
    /** 候选人趋势中间项。 */
    const candidateTrendBuildItem = candidateTrendBuildItemMap.get(trendBucketKey);
    if (!candidateTrendBuildItem) {
      return;
    }

    appendCandidateTrendCandidate(candidateTrendBuildItem, eventItem.interviewCandidateId);
  });

  return [...candidateTrendBuildItemMap.values()].map(
    (candidateTrendBuildItem) => candidateTrendBuildItem.candidateTrendRow,
  );
};

/** 将链路事件明细转换为候选人趋势行。 */
export const toCandidateTrendRows = (
  eventItems: TraceEventItem[],
  options?: TraceTrendBuildOptions,
): TraceCandidateTrendRow[] => {
  /** 趋势图时间范围。 */
  const trendDateRange = resolveTrendDateRange(options);
  if (trendDateRange) {
    return toRangedCandidateTrendRows(eventItems, trendDateRange.startDateTime, trendDateRange.endDateTime);
  }

  /** 按小时分组后的候选人趋势数据。 */
  const candidateTrendBuildItemMap = new Map<string, TraceCandidateTrendBuildItem>();

  eventItems.forEach((eventItem) => {
    if (eventItem.interviewCandidateId === null) {
      return;
    }

    /** 小时聚合时间。 */
    const metricHour = toMetricHour(eventItem);
    if (!metricHour) {
      return;
    }

    /** 候选人趋势中间项。 */
    const candidateTrendBuildItem =
      candidateTrendBuildItemMap.get(metricHour) ?? createCandidateTrendBuildItem(metricHour);
    appendCandidateTrendCandidate(candidateTrendBuildItem, eventItem.interviewCandidateId);
    candidateTrendBuildItemMap.set(metricHour, candidateTrendBuildItem);
  });

  return [...candidateTrendBuildItemMap.values()]
    .map((candidateTrendBuildItem) => candidateTrendBuildItem.candidateTrendRow)
    .sort((leftRow, rightRow) => leftRow.metricHour.localeCompare(rightRow.metricHour));
};

/** 汇总事件码排行。 */
export const toEventRankItems = (metricItems: TraceMetricItem[]): TraceEventRankItem[] => {
  /** 按事件码聚合后的排行数据。 */
  const rankItemMap = new Map<string, TraceEventRankItem>();

  metricItems.forEach((metricItem) => {
    const rankItem = rankItemMap.get(metricItem.eventCode) ?? {
      eventCode: metricItem.eventCode,
      eventCount: 0,
      flowCount: 0,
      candidateCount: 0,
    };

    rankItem.eventCount += metricItem.eventCount;
    rankItem.flowCount += metricItem.flowCount;
    rankItem.candidateCount += metricItem.candidateCount;
    rankItemMap.set(metricItem.eventCode, rankItem);
  });

  return [...rankItemMap.values()].sort(
    (leftItem, rightItem) => rightItem.eventCount - leftItem.eventCount,
  );
};

/** 汇总失败事件码排行 Top N。 */
export const toTopFailEventRankItems = (metricItems: TraceMetricItem[], limit = 5): TraceEventRankItem[] =>
  toEventRankItems(metricItems.filter((metricItem) => metricItem.result === "fail")).slice(0, limit);

/** 创建错误预警构建中间项。 */
const createErrorWarningBuildItem = (warningDate: string): TraceErrorWarningBuildItem => ({
  warningDate,
  eventCount: 0,
  failCount: 0,
  candidateIdSet: new Set<number>(),
  affectedCandidateIdSet: new Set<number>(),
});

/** 获取错误预警等级。 */
const resolveErrorWarningLevel = (
  failRate: number,
  failCount: number,
  affectedCandidateRate: number,
  affectedCandidateCount: number,
): TraceErrorWarningLevel => {
  /** 是否达到严重错误事件占比阈值。 */
  const isCriticalFailRate =
    failRate >= ERROR_CRITICAL_RATE_THRESHOLD && failCount >= ERROR_CRITICAL_FAIL_COUNT_THRESHOLD;
  /** 是否达到严重受影响候选人占比阈值。 */
  const isCriticalAffectedCandidateRate =
    affectedCandidateRate >= ERROR_CRITICAL_AFFECTED_CANDIDATE_RATE_THRESHOLD &&
    affectedCandidateCount >= ERROR_CRITICAL_AFFECTED_CANDIDATE_COUNT_THRESHOLD;
  if (isCriticalFailRate || isCriticalAffectedCandidateRate) {
    return "critical";
  }

  if (failRate >= ERROR_WARNING_RATE_THRESHOLD && failCount >= ERROR_WARNING_FAIL_COUNT_THRESHOLD) {
    return "warning";
  }

  if (failRate >= ERROR_WATCH_RATE_THRESHOLD && failCount >= ERROR_WATCH_FAIL_COUNT_THRESHOLD) {
    return "watch";
  }

  return "normal";
};

/** 创建错误预警触发原因。 */
const createErrorWarningTriggerReasons = (
  level: TraceErrorWarningLevel,
  failRate: number,
  failCount: number,
  affectedCandidateRate: number,
  affectedCandidateCount: number,
) => {
  /** 触发原因列表。 */
  const triggerReasons: string[] = [];

  if (level === "normal") {
    return ["未达到观察预警阈值"];
  }

  if (failRate >= ERROR_WATCH_RATE_THRESHOLD && failCount >= ERROR_WATCH_FAIL_COUNT_THRESHOLD) {
    triggerReasons.push("错误占比达到 3% 观察阈值");
  }

  if (failRate >= ERROR_WARNING_RATE_THRESHOLD && failCount >= ERROR_WARNING_FAIL_COUNT_THRESHOLD) {
    triggerReasons.push("错误占比达到 5% 预警阈值");
  }

  if (failRate >= ERROR_CRITICAL_RATE_THRESHOLD && failCount >= ERROR_CRITICAL_FAIL_COUNT_THRESHOLD) {
    triggerReasons.push("错误占比达到 10% 严重阈值");
  }

  if (
    affectedCandidateRate >= ERROR_CRITICAL_AFFECTED_CANDIDATE_RATE_THRESHOLD &&
    affectedCandidateCount >= ERROR_CRITICAL_AFFECTED_CANDIDATE_COUNT_THRESHOLD
  ) {
    triggerReasons.push("受影响候选人占比达到 5% 严重阈值");
  }

  return triggerReasons;
};

/** 将错误预警构建项转换为摘要。 */
const toErrorWarningSummaryFromBuildItem = (
  errorWarningBuildItem: TraceErrorWarningBuildItem,
): TraceErrorWarningSummary => {
  /** 候选人数。 */
  const candidateCount = errorWarningBuildItem.candidateIdSet.size;
  /** 受影响候选人数。 */
  const affectedCandidateCount = errorWarningBuildItem.affectedCandidateIdSet.size;
  /** 失败事件占比。 */
  const failRate =
    errorWarningBuildItem.eventCount > 0 ? errorWarningBuildItem.failCount / errorWarningBuildItem.eventCount : 0;
  /** 受影响候选人占比。 */
  const affectedCandidateRate = candidateCount > 0 ? affectedCandidateCount / candidateCount : 0;
  /** 预警等级。 */
  const level = resolveErrorWarningLevel(
    failRate,
    errorWarningBuildItem.failCount,
    affectedCandidateRate,
    affectedCandidateCount,
  );

  return {
    level,
    warningDate: errorWarningBuildItem.warningDate,
    eventCount: errorWarningBuildItem.eventCount,
    failCount: errorWarningBuildItem.failCount,
    failRate,
    candidateCount,
    affectedCandidateCount,
    affectedCandidateRate,
    triggerReasons: createErrorWarningTriggerReasons(
      level,
      failRate,
      errorWarningBuildItem.failCount,
      affectedCandidateRate,
      affectedCandidateCount,
    ),
  };
};

/** 比较错误预警风险高低。 */
const compareErrorWarningRisk = (
  leftSummary: TraceErrorWarningSummary,
  rightSummary: TraceErrorWarningSummary,
) => {
  /** 左侧等级权重。 */
  const leftLevelWeight = errorWarningLevelWeightMap.get(leftSummary.level) ?? 0;
  /** 右侧等级权重。 */
  const rightLevelWeight = errorWarningLevelWeightMap.get(rightSummary.level) ?? 0;
  if (leftLevelWeight !== rightLevelWeight) {
    return rightLevelWeight - leftLevelWeight;
  }

  if (leftSummary.failRate !== rightSummary.failRate) {
    return rightSummary.failRate - leftSummary.failRate;
  }

  if (leftSummary.affectedCandidateRate !== rightSummary.affectedCandidateRate) {
    return rightSummary.affectedCandidateRate - leftSummary.affectedCandidateRate;
  }

  if (leftSummary.failCount !== rightSummary.failCount) {
    return rightSummary.failCount - leftSummary.failCount;
  }

  return rightSummary.warningDate.localeCompare(leftSummary.warningDate);
};

/** 创建空错误预警摘要。 */
const createEmptyErrorWarningSummary = (options?: TraceTrendBuildOptions): TraceErrorWarningSummary => {
  /** 查询开始时间对象。 */
  const startDateTime = dayjs(options?.startTime);
  if (!startDateTime.isValid()) {
    return { ...emptyErrorWarningSummary };
  }

  return {
    ...emptyErrorWarningSummary,
    warningDate: startDateTime.format(TRACE_DATE_FORMAT),
  };
};

/** 将链路事件明细转换为错误预警摘要。 */
export const toErrorWarningSummary = (
  eventItems: TraceEventItem[],
  options?: TraceTrendBuildOptions,
): TraceErrorWarningSummary => {
  /** 按天聚合的错误预警构建数据。 */
  const errorWarningBuildItemMap = new Map<string, TraceErrorWarningBuildItem>();

  eventItems.forEach((eventItem) => {
    /** 服务端记录时间对象。 */
    const serverDateTime = dayjs(resolveTraceEventServerTime(eventItem));
    if (!serverDateTime.isValid()) {
      return;
    }

    /** 预警统计日期。 */
    const warningDate = serverDateTime.format(TRACE_DATE_FORMAT);
    /** 错误预警构建项。 */
    const errorWarningBuildItem =
      errorWarningBuildItemMap.get(warningDate) ?? createErrorWarningBuildItem(warningDate);
    /** 归类后的事件结果。 */
    const resolvedEventResult = resolveTraceEventResult(eventItem);

    errorWarningBuildItem.eventCount += 1;
    if (eventItem.interviewCandidateId !== null) {
      errorWarningBuildItem.candidateIdSet.add(eventItem.interviewCandidateId);
    }
    if (resolvedEventResult === "fail") {
      errorWarningBuildItem.failCount += 1;
      if (eventItem.interviewCandidateId !== null) {
        errorWarningBuildItem.affectedCandidateIdSet.add(eventItem.interviewCandidateId);
      }
    }
    errorWarningBuildItemMap.set(warningDate, errorWarningBuildItem);
  });

  /** 错误预警摘要列表。 */
  const errorWarningSummaries = [...errorWarningBuildItemMap.values()]
    .map(toErrorWarningSummaryFromBuildItem)
    .sort(compareErrorWarningRisk);

  return errorWarningSummaries[0] ?? createEmptyErrorWarningSummary(options);
};

/** 筛选错误日志事件。 */
export const filterErrorEvents = (eventItems: TraceEventItem[], resultFilter?: string) =>
  eventItems.filter((eventItem) => {
    /** 归类后的事件结果。 */
    const resolvedEventResult = resolveTraceEventResult(eventItem);
    /** 是否属于错误日志展示范围。 */
    const isErrorEvent = resolvedEventResult === "fail" || resolvedEventResult === "warning";
    if (!isErrorEvent) {
      return false;
    }

    if (!resultFilter) {
      return true;
    }

    return resolvedEventResult === resultFilter;
  });
