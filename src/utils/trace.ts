// 埋点数据聚合和过滤工具。
import dayjs from "dayjs";

import type { TraceEventItem, TraceMetricItem } from "@/api/trace";

/** 埋点聚合汇总结果。 */
export interface TraceMetricSummary {
  /** 事件总数。 */
  eventCount: number;
  /** 涉及链路数。 */
  flowCount: number;
  /** 涉及候选人数。 */
  candidateCount: number;
}

/** 趋势图单个小时聚合项。 */
export interface TraceTrendRow {
  /** 小时粒度时间。 */
  metricHour: string;
  /** 失败事件数。 */
  failCount: number;
  /** 警告事件数。 */
  warningCount: number;
  /** 成功事件数。 */
  successCount: number;
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

/** 将聚合数据转换为趋势图行。 */
export const toMetricTrendRows = (metricItems: TraceMetricItem[]): TraceTrendRow[] => {
  /** 按小时分组后的趋势数据。 */
  const trendRowMap = new Map<string, TraceTrendRow>();

  metricItems.forEach((metricItem) => {
    const trendRow = trendRowMap.get(metricItem.metricHour) ?? {
      metricHour: metricItem.metricHour,
      failCount: 0,
      warningCount: 0,
      successCount: 0,
    };

    if (metricItem.result === "fail") {
      trendRow.failCount += metricItem.eventCount;
    } else if (metricItem.result === "warning") {
      trendRow.warningCount += metricItem.eventCount;
    } else {
      trendRow.successCount += metricItem.eventCount;
    }

    trendRowMap.set(metricItem.metricHour, trendRow);
  });

  return [...trendRowMap.values()].sort((leftRow, rightRow) =>
    leftRow.metricHour.localeCompare(rightRow.metricHour),
  );
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
