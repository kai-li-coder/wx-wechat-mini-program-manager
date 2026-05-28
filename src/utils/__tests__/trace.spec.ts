// 埋点数据工具单元测试。
import { describe, expect, it } from "vitest";

import type { TraceEventItem, TraceMetricItem } from "@/api/trace";
import {
  aggregateMetricSummary,
  filterErrorEvents,
  formatTraceEventCode,
  formatTraceStage,
  formatTraceTerminalModel,
  normalizeTraceErrorBrandTags,
  normalizeTraceErrorDeviceTags,
  resolveTraceEventRowKey,
  resolveTraceEventResult,
  resolveTraceEventServerTime,
  toCandidateTrendRows,
  toClientTimeDescEventItems,
  toErrorWarningSummary,
  toEventRankItems,
  toMetricItemsFromEvents,
  toMetricTrendRows,
  toTopFailEventRankItems,
} from "@/utils/trace";

/** 构造测试用聚合数据。 */
const metricItems: TraceMetricItem[] = [
  {
    metricHour: "2026-05-20 10:00:00",
    eventCode: "upload_fail",
    result: "fail",
    eventCount: 2,
    flowCount: 2,
    candidateCount: 1,
  },
  {
    metricHour: "2026-05-20 10:00:00",
    eventCode: "record_stop_timeout",
    result: "warning",
    eventCount: 1,
    flowCount: 1,
    candidateCount: 1,
  },
  {
    metricHour: "2026-05-20 11:00:00",
    eventCode: "upload_fail",
    result: "success",
    eventCount: 3,
    flowCount: 2,
    candidateCount: 2,
  },
];

/** 线上已出现的阶段码中文文案用例。 */
const onlineStageLabelCases = [
  ["link_page_confirm_enter", "链接页确认进入"],
  ["link_page_continue_enter", "链接页继续进入"],
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
  ["end_page_mounted", "结束页挂载"],
  ["end_page_load_fail", "结束页加载异常"],
  ["request_auth_check", "请求鉴权检测"],
  ["codex_production_telemetry_check", "生产埋点连通性检测"],
] as const;

/** 线上已出现的事件码中文文案用例。 */
const onlineEventCodeLabelCases = [
  ["upload_fail", "上传失败"],
  ["interrupt_check", "中断检测"],
  ["auth_redirect", "鉴权重定向"],
  ["flow_leave", "离开答题链路"],
] as const;

/** 构造测试用事件。 */
const createEventItem = (result: string): TraceEventItem => ({
  id: Math.random(),
  eventId: "evt_1",
  eventCode: "upload_fail",
  flowId: "flow_1",
  interviewCandidateId: 1,
  pageRoute: "/pages/interview/interviewPage",
  questionIndex: 1,
  snapQuestionId: 1,
  stage: "upload",
  result,
  durationMs: 100,
  errorCode: result === "success" ? "" : "UPLOAD_FAIL",
  errorMessage: result === "success" ? "" : "上传失败",
  retryNo: 0,
  deviceInfo: null,
  extra: null,
  clientTime: "2026-05-20T10:00:00",
  serverTime: "2026-05-20T10:00:01",
  requestId: "req_1",
  clientIp: "127.0.0.1",
  userAgent: "vitest",
});

/** 错误预警测试事件构造参数。 */
interface CreateWarningEventItemsOptions {
  /** 统计日期。 */
  warningDate: string;
  /** 成功事件数。 */
  successCount?: number;
  /** 失败事件数。 */
  failCount?: number;
  /** 警告归类事件数。 */
  warningCount?: number;
  /** 成功事件候选人 ID 列表。 */
  successCandidateIds?: number[];
  /** 失败事件候选人 ID 列表。 */
  failCandidateIds?: number[];
}

/** 循环读取候选人 ID。 */
const resolveCandidateId = (candidateIds: number[] | undefined, index: number, fallbackOffset: number) => {
  if (!candidateIds?.length) {
    return fallbackOffset + index;
  }

  return candidateIds[index % candidateIds.length];
};

/** 构造错误预警测试事件列表。 */
const createWarningEventItems = ({
  warningDate,
  successCount = 0,
  failCount = 0,
  warningCount = 0,
  successCandidateIds,
  failCandidateIds,
}: CreateWarningEventItemsOptions) => {
  /** 成功事件列表。 */
  const successEventItems = Array.from({ length: successCount }, (_, eventIndex) => ({
    ...createEventItem("success"),
    eventId: `${warningDate}_success_${eventIndex}`,
    interviewCandidateId: resolveCandidateId(successCandidateIds, eventIndex, 1),
    serverTime: `${warningDate}T10:${String(eventIndex % 60).padStart(2, "0")}:01`,
  }));
  /** 失败事件列表。 */
  const failEventItems = Array.from({ length: failCount }, (_, eventIndex) => ({
    ...createEventItem("fail"),
    eventId: `${warningDate}_fail_${eventIndex}`,
    interviewCandidateId: resolveCandidateId(failCandidateIds, eventIndex, 10_001),
    serverTime: `${warningDate}T11:${String(eventIndex % 60).padStart(2, "0")}:01`,
  }));
  /** 警告归类事件列表。 */
  const warningEventItems = Array.from({ length: warningCount }, (_, eventIndex) => ({
    ...createEventItem("fail"),
    eventId: `${warningDate}_warning_${eventIndex}`,
    errorCode: "NO_TOKEN",
    interviewCandidateId: 20_001 + eventIndex,
    serverTime: `${warningDate}T12:${String(eventIndex % 60).padStart(2, "0")}:01`,
  }));

  return [...successEventItems, ...failEventItems, ...warningEventItems];
};

describe("trace utils", () => {
  it("aggregates metric summary", () => {
    expect(aggregateMetricSummary(metricItems)).toEqual({
      eventCount: 6,
      flowCount: 5,
      candidateCount: 4,
    });
  });

  it("converts metric items to trend rows", () => {
    expect(toMetricTrendRows(metricItems)).toEqual([
      {
        metricHour: "2026-05-20 10:00:00",
        failCount: 2,
        warningCount: 1,
        successCount: 0,
      },
      {
        metricHour: "2026-05-20 11:00:00",
        failCount: 0,
        warningCount: 0,
        successCount: 3,
      },
    ]);
  });

  it("builds ranged trend rows by selected date range", () => {
    const yearlyTrendRows = toMetricTrendRows(metricItems, {
      startTime: "2026-01-01 00:00:00",
      endTime: "2026-05-20 23:59:59",
    });
    const quarterlyTrendRows = toMetricTrendRows(metricItems, {
      startTime: "2026-04-01 00:00:00",
      endTime: "2026-06-30 23:59:59",
    });
    const monthlyTrendRows = toMetricTrendRows(metricItems, {
      startTime: "2026-05-01 00:00:00",
      endTime: "2026-05-20 23:59:59",
    });
    const weeklyTrendRows = toMetricTrendRows(metricItems, {
      startTime: "2026-05-18 00:00:00",
      endTime: "2026-05-24 23:59:59",
    });
    const dailyTrendRows = toMetricTrendRows(metricItems, {
      startTime: "2026-05-20 00:00:00",
      endTime: "2026-05-20 23:59:59",
    });

    expect(yearlyTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual(["1月", "2月", "3月", "4月", "5月"]);
    expect(quarterlyTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual(["4月", "5月", "6月"]);
    expect(monthlyTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual([
      "05-01",
      "05-02",
      "05-03",
      "05-04",
      "05-05",
      "05-06",
      "05-07",
      "05-08",
      "05-09",
      "05-10",
      "05-11",
      "05-12",
      "05-13",
      "05-14",
      "05-15",
      "05-16",
      "05-17",
      "05-18",
      "05-19",
      "05-20",
    ]);
    expect(weeklyTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual([
      "05-18",
      "05-19",
      "05-20",
      "05-21",
      "05-22",
      "05-23",
      "05-24",
    ]);
    expect(dailyTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual([
      "00:00",
      "01:00",
      "02:00",
      "03:00",
      "04:00",
      "05:00",
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
    ]);
    expect(dailyTrendRows[10]).toMatchObject({ metricLabel: "10:00", failCount: 2, warningCount: 1 });
  });

  it("builds metric items from events with classified results", () => {
    const normalFailEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_fail",
      flowId: "flow_fail",
      interviewCandidateId: 1001,
      serverTime: "2026-05-20T10:12:01",
    };
    const warningErrorCodeEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_warning_code",
      flowId: "flow_warning_code",
      interviewCandidateId: 1002,
      errorCode: "NO_TOKEN",
      serverTime: "2026-05-20T10:30:01",
    };
    const warningErrorMessageEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_warning_message",
      flowId: "flow_warning_message",
      interviewCandidateId: 1003,
      errorMessage: "面试已交卷",
      serverTime: "2026-05-20T10:45:01",
    };

    expect(toMetricTrendRows(toMetricItemsFromEvents([normalFailEventItem, warningErrorCodeEventItem, warningErrorMessageEventItem]))).toEqual([
      {
        metricHour: "2026-05-20 10:00:00",
        failCount: 1,
        warningCount: 2,
        successCount: 0,
      },
    ]);
  });

  it("builds event code rank items", () => {
    expect(toEventRankItems(metricItems)[0]).toMatchObject({
      eventCode: "upload_fail",
      eventCount: 5,
    });
  });

  it("builds top fail event code rank items", () => {
    /** 失败事件码排行数据。 */
    const topFailEventRankItems = toTopFailEventRankItems(
      [
        ...metricItems,
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "camera_init_fail",
          result: "fail",
          eventCount: 8,
          flowCount: 4,
          candidateCount: 4,
        },
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "business_fail",
          result: "fail",
          eventCount: 7,
          flowCount: 4,
          candidateCount: 4,
        },
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "submit_fail",
          result: "fail",
          eventCount: 6,
          flowCount: 4,
          candidateCount: 4,
        },
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "oss_upload_fail",
          result: "fail",
          eventCount: 5,
          flowCount: 4,
          candidateCount: 4,
        },
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "guide_page_load_fail",
          result: "fail",
          eventCount: 4,
          flowCount: 4,
          candidateCount: 4,
        },
        {
          metricHour: "2026-05-20 12:00:00",
          eventCode: "end_page_load_fail",
          result: "fail",
          eventCount: 3,
          flowCount: 3,
          candidateCount: 3,
        },
      ],
      5,
    );

    expect(topFailEventRankItems).toHaveLength(5);
    expect(topFailEventRankItems.map((rankItem) => rankItem.eventCode)).toEqual([
      "camera_init_fail",
      "business_fail",
      "submit_fail",
      "oss_upload_fail",
      "guide_page_load_fail",
    ]);
    expect(topFailEventRankItems.some((rankItem) => rankItem.eventCode === "record_stop_timeout")).toBe(false);
  });

  it("deduplicates candidate trend rows by time bucket", () => {
    /** 候选人趋势事件列表。 */
    const candidateTrendEventItems: TraceEventItem[] = [
      {
        ...createEventItem("success"),
        eventId: "evt_candidate_1_first",
        interviewCandidateId: 1001,
        serverTime: "2026-05-20T10:05:01",
      },
      {
        ...createEventItem("fail"),
        eventId: "evt_candidate_1_second",
        interviewCandidateId: 1001,
        serverTime: "2026-05-20T10:35:01",
      },
      {
        ...createEventItem("success"),
        eventId: "evt_candidate_2",
        interviewCandidateId: 1002,
        serverTime: "2026-05-20T10:45:01",
      },
      {
        ...createEventItem("success"),
        eventId: "evt_candidate_null",
        interviewCandidateId: null,
        serverTime: "2026-05-20T10:55:01",
      },
      {
        ...createEventItem("success"),
        eventId: "evt_candidate_1_next_hour",
        interviewCandidateId: 1001,
        serverTime: "2026-05-20T11:05:01",
      },
    ];

    expect(toCandidateTrendRows(candidateTrendEventItems)).toEqual([
      {
        metricHour: "2026-05-20 10:00:00",
        candidateCount: 2,
      },
      {
        metricHour: "2026-05-20 11:00:00",
        candidateCount: 1,
      },
    ]);
  });

  it("fills ranged candidate trend rows with empty buckets", () => {
    /** 候选人趋势行。 */
    const candidateTrendRows = toCandidateTrendRows(
      [
        {
          ...createEventItem("success"),
          eventId: "evt_candidate_1",
          interviewCandidateId: 1001,
          serverTime: "2026-05-20T10:05:01",
        },
        {
          ...createEventItem("success"),
          eventId: "evt_candidate_2",
          interviewCandidateId: 1002,
          serverTime: "2026-05-20T10:35:01",
        },
      ],
      {
        startTime: "2026-05-20 00:00:00",
        endTime: "2026-05-20 23:59:59",
      },
    );

    expect(candidateTrendRows.map((trendRow) => trendRow.metricLabel)).toEqual([
      "00:00",
      "01:00",
      "02:00",
      "03:00",
      "04:00",
      "05:00",
      "06:00",
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00",
      "23:00",
    ]);
    expect(candidateTrendRows[9]).toMatchObject({ metricLabel: "09:00", candidateCount: 0 });
    expect(candidateTrendRows[10]).toMatchObject({ metricLabel: "10:00", candidateCount: 2 });
  });

  it("builds error warning summary from fail event rate", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary(
      createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 90,
        failCount: 5,
        warningCount: 5,
        failCandidateIds: [1],
      }),
    );

    expect(warningSummary).toMatchObject({
      level: "watch",
      warningDate: "2026-05-20",
      eventCount: 100,
      failCount: 5,
    });
    expect(warningSummary.failRate).toBe(0.05);
  });

  it("keeps low sample error warning summary normal", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary(
      createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 6,
        failCount: 4,
        failCandidateIds: [1],
      }),
    );

    expect(warningSummary.level).toBe("normal");
    expect(warningSummary.failRate).toBe(0.4);
  });

  it("marks error warning summary as warning", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary(
      createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 190,
        failCount: 10,
        successCandidateIds: Array.from({ length: 190 }, (_, index) => index + 1),
        failCandidateIds: [1],
      }),
    );

    expect(warningSummary).toMatchObject({
      level: "warning",
      eventCount: 200,
      failCount: 10,
      affectedCandidateCount: 1,
    });
    expect(warningSummary.failRate).toBe(0.05);
  });

  it("marks error warning summary as critical by fail rate", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary(
      createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 90,
        failCount: 10,
        successCandidateIds: Array.from({ length: 90 }, (_, index) => index + 1),
        failCandidateIds: [1],
      }),
    );

    expect(warningSummary.level).toBe("critical");
    expect(warningSummary.failRate).toBe(0.1);
  });

  it("marks error warning summary as critical by affected candidates", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary(
      createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 97,
        failCount: 3,
        successCandidateIds: Array.from({ length: 50 }, (_, index) => index + 1),
        failCandidateIds: [1, 2, 3],
      }),
    );

    expect(warningSummary).toMatchObject({
      level: "critical",
      candidateCount: 50,
      affectedCandidateCount: 3,
    });
    expect(warningSummary.affectedCandidateRate).toBe(0.06);
  });

  it("returns highest risk date for ranged error warning summary", () => {
    /** 错误预警摘要。 */
    const warningSummary = toErrorWarningSummary([
      ...createWarningEventItems({
        warningDate: "2026-05-20",
        successCount: 96,
        failCount: 4,
      }),
      ...createWarningEventItems({
        warningDate: "2026-05-21",
        successCount: 190,
        failCount: 10,
        successCandidateIds: Array.from({ length: 190 }, (_, index) => index + 1),
        failCandidateIds: [1],
      }),
      ...createWarningEventItems({
        warningDate: "2026-05-22",
        successCount: 90,
        failCount: 10,
        successCandidateIds: Array.from({ length: 90 }, (_, index) => index + 1),
        failCandidateIds: [1],
      }),
    ]);

    expect(warningSummary).toMatchObject({
      level: "critical",
      warningDate: "2026-05-22",
    });
  });

  it("formats trace stage labels", () => {
    expect(formatTraceStage("oss_upload_fail")).toBe("OSS 上传失败（oss_upload_fail）");
    onlineStageLabelCases.forEach(([stageCode, stageLabel]) => {
      expect(formatTraceStage(stageCode)).toBe(`${stageLabel}（${stageCode}）`);
    });
    expect(formatTraceStage("custom_stage")).toBe("custom_stage");
    expect(formatTraceStage("")).toBe("-");
  });

  it("formats trace event code labels", () => {
    onlineEventCodeLabelCases.forEach(([eventCode, eventCodeLabel]) => {
      expect(formatTraceEventCode(eventCode)).toBe(`${eventCodeLabel}（${eventCode}）`);
    });
    expect(formatTraceEventCode("custom_event")).toBe("custom_event");
    expect(formatTraceEventCode("")).toBe("-");
  });

  it("formats terminal model from device brand and model", () => {
    expect(formatTraceTerminalModel({ brand: "Apple", model: "iPhone 15 Pro" })).toBe("Apple-iPhone 15 Pro");
    expect(formatTraceTerminalModel('{"brand":"Xiaomi","model":"14"}')).toBe("Xiaomi-14");
    expect(formatTraceTerminalModel({ brand: "", model: "" })).toBe("-");
  });

  it("normalizes error log brand tags into query and quick filters", () => {
    expect(normalizeTraceErrorBrandTags([" Apple ", " iPhone "])).toEqual({
      tags: ["Apple", "iPhone"],
      brand: "Apple",
      brandQuickFilter: "iphone",
    });
    expect(normalizeTraceErrorBrandTags(["iPhone", "非iphone"])).toEqual({
      tags: ["非 iPhone"],
      brand: "",
      brandQuickFilter: "nonIphone",
    });
    expect(normalizeTraceErrorBrandTags(["Apple", " apple ", "", " Xiaomi "])).toEqual({
      tags: ["Xiaomi"],
      brand: "Xiaomi",
      brandQuickFilter: "",
    });
  });

  it("normalizes error log device tags into query and quick filters", () => {
    expect(normalizeTraceErrorDeviceTags([" iOS设备 ", " iPhone 15 Pro ", "ANDROID设备"])).toEqual({
      tags: ["iPhone 15 Pro", "Android设备"],
      model: "iPhone 15 Pro",
      deviceQuickFilter: "android",
    });
    expect(normalizeTraceErrorDeviceTags(["devtools", " DevTools "])).toEqual({
      tags: ["DevTools"],
      model: "DevTools",
      deviceQuickFilter: "",
    });
    expect(normalizeTraceErrorDeviceTags(["ios", "android 设备"])).toEqual({
      tags: ["Android设备"],
      model: "",
      deviceQuickFilter: "android",
    });
  });

  it("filters only error events", () => {
    const eventItems = [createEventItem("success"), createEventItem("fail"), createEventItem("warning")];

    expect(filterErrorEvents(eventItems).map((eventItem) => eventItem.result)).toEqual(["fail", "warning"]);
    expect(filterErrorEvents(eventItems, "fail").map((eventItem) => eventItem.result)).toEqual(["fail"]);
  });

  it("filters error events by device quick filters", () => {
    const iosEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_ios",
      deviceInfo: { platform: "ios", system: "iOS 17.0", brand: "iPhone", model: "iPhone 15 Pro" },
    };
    const androidEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_android",
      deviceInfo: { platform: "android", system: "Android 14", brand: "Xiaomi", model: "14" },
    };

    expect(
      filterErrorEvents([iosEventItem, androidEventItem], { deviceQuickFilter: "ios" }).map(
        (eventItem) => eventItem.eventId,
      ),
    ).toEqual(["evt_ios"]);
    expect(
      filterErrorEvents([iosEventItem, androidEventItem], { deviceQuickFilter: "android" }).map(
        (eventItem) => eventItem.eventId,
      ),
    ).toEqual(["evt_android"]);
  });

  it("filters error events by brand quick filters", () => {
    const iphoneEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_iphone",
      deviceInfo: { brand: "iPhone", model: "iPhone 15 Pro" },
    };
    const androidEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_android",
      deviceInfo: { brand: "Xiaomi", model: "14" },
    };

    expect(
      filterErrorEvents([iphoneEventItem, androidEventItem], { brandQuickFilter: "iphone" }).map(
        (eventItem) => eventItem.eventId,
      ),
    ).toEqual(["evt_iphone"]);
    expect(
      filterErrorEvents([iphoneEventItem, androidEventItem], { brandQuickFilter: "nonIphone" }).map(
        (eventItem) => eventItem.eventId,
      ),
    ).toEqual(["evt_android"]);
  });

  it("excludes devtools test records from error events", () => {
    const deviceEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_device",
      deviceInfo: { brand: "Xiaomi", model: "14" },
    };
    const devtoolsEventItem = {
      ...createEventItem("fail"),
      eventId: "evt_devtools",
      deviceInfo: { brand: "devtools", model: "iPhone 15 Pro" },
    };

    expect(
      filterErrorEvents([deviceEventItem, devtoolsEventItem], { isExcludeTestRecords: true }).map(
        (eventItem) => eventItem.eventId,
      ),
    ).toEqual(["evt_device"]);
  });

  it("classifies NO_TOKEN events as warning", () => {
    const noTokenEventItem = {
      ...createEventItem("fail"),
      errorCode: " no_token ",
    };

    expect(resolveTraceEventResult(noTokenEventItem)).toBe("warning");
    expect(filterErrorEvents([noTokenEventItem], "warning")).toEqual([noTokenEventItem]);
    expect(filterErrorEvents([noTokenEventItem], "fail")).toEqual([]);
  });

  it("classifies specified error messages as warning", () => {
    const warningErrorMessages = ["未登录，请先登录", "摄像头或麦克风未授权", "面试已交卷"];

    warningErrorMessages.forEach((errorMessage) => {
      const warningMessageEventItem = {
        ...createEventItem("fail"),
        errorMessage: ` ${errorMessage} `,
      };

      expect(resolveTraceEventResult(warningMessageEventItem)).toBe("warning");
      expect(filterErrorEvents([warningMessageEventItem], "warning")).toEqual([warningMessageEventItem]);
      expect(filterErrorEvents([warningMessageEventItem], "fail")).toEqual([]);
    });
  });

  it("sorts events by client time desc without mutating source", () => {
    const olderEventItem = {
      ...createEventItem("success"),
      eventId: "evt_older",
      clientTime: "2026-05-20T10:00:00",
    };
    const invalidTimeEventItem = {
      ...createEventItem("success"),
      eventId: "evt_invalid",
      clientTime: "",
    };
    const latestEventItem = {
      ...createEventItem("success"),
      eventId: "evt_latest",
      clientTime: "2026-05-20T10:30:00",
    };
    const eventItems = [olderEventItem, invalidTimeEventItem, latestEventItem];

    expect(toClientTimeDescEventItems(eventItems).map((eventItem) => eventItem.eventId)).toEqual([
      "evt_latest",
      "evt_older",
      "evt_invalid",
    ]);
    expect(eventItems.map((eventItem) => eventItem.eventId)).toEqual([
      "evt_older",
      "evt_invalid",
      "evt_latest",
    ]);
  });

  it("uses eventId as stable row key when backend omits id", () => {
    const eventItem = createEventItem("success");
    delete eventItem.id;

    expect(resolveTraceEventRowKey(eventItem)).toBe("evt_1");
  });

  it("uses createdAt as server display time when backend returns it", () => {
    const eventItem = createEventItem("success");
    eventItem.createdAt = "2026-05-21T15:42:14.000+08:00";

    expect(resolveTraceEventServerTime(eventItem)).toBe("2026-05-21T15:42:14.000+08:00");
  });
});
