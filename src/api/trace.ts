// 答题链路埋点查询接口。
import { httpGet } from "@/api/request";

/** 埋点聚合查询参数。 */
export interface TraceMetricQuery {
  /** 查询开始时间，格式 YYYY-MM-DD HH:mm:ss。 */
  startTime: string;
  /** 查询结束时间，格式 YYYY-MM-DD HH:mm:ss。 */
  endTime: string;
  /** 事件码筛选。 */
  eventCode?: string;
  /** 事件结果筛选。 */
  result?: string;
}

/** 埋点小时聚合项。 */
export interface TraceMetricItem {
  /** 小时粒度时间。 */
  metricHour: string;
  /** 事件码。 */
  eventCode: string;
  /** 事件结果。 */
  result: string;
  /** 事件数量。 */
  eventCount: number;
  /** 涉及链路数。 */
  flowCount: number;
  /** 涉及候选人数。 */
  candidateCount: number;
}

/** 链路事件查询参数。 */
export interface TraceFlowQuery {
  /** 答题链路 ID。 */
  flowId?: string;
  /** 候选人面试 ID。 */
  interviewCandidateId?: number | string;
  /** 事件码筛选。 */
  eventCode?: string;
  /** 业务阶段筛选。 */
  stage?: string;
  /** 事件结果筛选。 */
  result?: string;
  /** 阶段耗时毫秒筛选。 */
  durationMs?: number;
  /** 设备品牌筛选。 */
  brand?: string;
  /** 设备机型筛选。 */
  model?: string;
  /** 服务端时间范围开始时间，格式 YYYY-MM-DD HH:mm:ss。 */
  startTime?: string;
  /** 服务端时间范围结束时间，格式 YYYY-MM-DD HH:mm:ss。 */
  endTime?: string;
  /** 页面路径筛选。 */
  pageRoute?: string;
  /** 页码。 */
  pageNum?: number;
  /** 每页条数。 */
  pageSize?: number;
}

/** 单条埋点事件。 */
export interface TraceEventItem {
  /** 数据库主键，本地测试服务返回，线上小程序开发服务可能不返回。 */
  id?: number;
  /** 后端生成事件 ID。 */
  eventId: string;
  /** 事件码。 */
  eventCode: string;
  /** 答题链路 ID。 */
  flowId: string;
  /** 候选人面试 ID。 */
  interviewCandidateId: number | null;
  /** 页面路径。 */
  pageRoute: string;
  /** 题目序号。 */
  questionIndex: number | null;
  /** 题目快照 ID。 */
  snapQuestionId: number | null;
  /** 业务阶段。 */
  stage: string;
  /** 事件结果。 */
  result: string;
  /** 阶段耗时毫秒。 */
  durationMs: number | null;
  /** 错误码。 */
  errorCode: string;
  /** 错误信息。 */
  errorMessage: string;
  /** 重试次数。 */
  retryNo: number;
  /** 设备信息。 */
  deviceInfo: unknown;
  /** 扩展信息。 */
  extra: unknown;
  /** 客户端事件时间。 */
  clientTime: string;
  /** 服务端接收时间。 */
  serverTime: string;
  /** 服务端请求 ID，本地测试服务返回，线上小程序开发服务可能不返回。 */
  requestId?: string;
  /** 客户端 IP。 */
  clientIp: string;
  /** 用户代理。 */
  userAgent: string;
  /** 记录创建时间，线上小程序开发服务返回。 */
  createdAt?: string;
}

/** 分页响应结构。 */
export interface TracePagedResponse<T> {
  /** 当前页记录。 */
  records: T[];
  /** 总记录数。 */
  total: number;
}

/** 链路事件字符串筛选字段名。 */
type TraceFlowStringFilterKey =
  | "flowId"
  | "interviewCandidateId"
  | "eventCode"
  | "stage"
  | "result"
  | "brand"
  | "model"
  | "startTime"
  | "endTime"
  | "pageRoute";

/** 写入非空字符串筛选参数。 */
const appendNormalizedStringParam = (
  normalizedParams: TraceFlowQuery,
  params: TraceFlowQuery,
  filterKey: TraceFlowStringFilterKey,
) => {
  /** 去除首尾空格后的筛选值。 */
  const filterValue = String(params[filterKey] ?? "").trim();
  if (!filterValue) {
    return;
  }

  normalizedParams[filterKey] = filterValue;
};

/** 写入有效耗时筛选参数。 */
const appendNormalizedDurationParam = (normalizedParams: TraceFlowQuery, params: TraceFlowQuery) => {
  /** 原始耗时筛选值。 */
  const rawDurationMs = params.durationMs;
  if (rawDurationMs === undefined) {
    return;
  }

  /** 数字化后的耗时筛选值。 */
  const durationMs = Number(rawDurationMs);
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return;
  }

  normalizedParams.durationMs = durationMs;
};

/** 清理链路查询参数，空筛选字段不传给后端。 */
const normalizeTraceFlowQuery = (params: TraceFlowQuery): TraceFlowQuery => {
  /** 清理后的链路查询参数。 */
  const normalizedParams: TraceFlowQuery = {
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  };

  appendNormalizedStringParam(normalizedParams, params, "flowId");
  appendNormalizedStringParam(normalizedParams, params, "interviewCandidateId");
  appendNormalizedStringParam(normalizedParams, params, "eventCode");
  appendNormalizedStringParam(normalizedParams, params, "stage");
  appendNormalizedStringParam(normalizedParams, params, "result");
  appendNormalizedStringParam(normalizedParams, params, "brand");
  appendNormalizedStringParam(normalizedParams, params, "model");
  appendNormalizedStringParam(normalizedParams, params, "startTime");
  appendNormalizedStringParam(normalizedParams, params, "endTime");
  appendNormalizedStringParam(normalizedParams, params, "pageRoute");
  appendNormalizedDurationParam(normalizedParams, params);

  return normalizedParams;
};

/** 查询答题异常小时聚合数据。 */
export const queryTraceMetrics = (params: TraceMetricQuery) =>
  httpGet<TraceMetricItem[]>("/admin/candidate/trace/metrics", { params });

/** 查询答题链路事件明细。 */
export const queryTraceFlow = (params: TraceFlowQuery) =>
  httpGet<TracePagedResponse<TraceEventItem>>("/admin/candidate/trace/flow", {
    params: normalizeTraceFlowQuery(params),
  });
