// 埋点数据聚合和过滤工具。
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

/** 阶段中文文案字典。 */
const traceStageLabelMap = new Map<string, string>([
  ["interview_list_start", "面试列表开始"],
  ["link_page_on_load", "链接页加载"],
  ["link_page_info_interview_fail", "链接页面试信息异常"],
  ["camera_init_timeout", "摄像头初始化超时"],
  ["camera_init_fail", "摄像头初始化失败"],
  ["record_stop_timeout", "录制停止超时"],
  ["oss_upload_fail", "OSS 上传失败"],
  ["upload_fail", "上传失败"],
  ["submit_fail", "提交失败"],
  ["unexpected_hide", "页面异常隐藏"],
  ["interrupt_continue", "中断后继续"],
  ["flow_enter", "进入答题链路"],
  ["business_fail", "业务异常"],
]);

/** 格式化链路事件阶段。 */
export const formatTraceStage = (stage?: string) => {
  /** 清理后的阶段编码。 */
  const normalizedStage = String(stage ?? "").trim();
  if (!normalizedStage) {
    return "-";
  }

  return traceStageLabelMap.get(normalizedStage) ?? normalizedStage;
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
    const isErrorEvent = eventItem.result === "fail" || eventItem.result === "warning";
    if (!isErrorEvent) {
      return false;
    }

    if (!resultFilter) {
      return true;
    }

    return eventItem.result === resultFilter;
  });
