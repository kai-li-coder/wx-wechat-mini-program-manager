// 埋点数据工具单元测试。
import { describe, expect, it } from "vitest";

import type { TraceEventItem, TraceMetricItem } from "@/api/trace";
import {
  aggregateMetricSummary,
  filterErrorEvents,
  formatTraceEventCode,
  formatTraceStage,
  formatTraceTerminalModel,
  resolveTraceEventRowKey,
  resolveTraceEventResult,
  resolveTraceEventServerTime,
  toClientTimeDescEventItems,
  toEventRankItems,
  toMetricItemsFromEvents,
  toMetricTrendRows,
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

  it("filters only error events", () => {
    const eventItems = [createEventItem("success"), createEventItem("fail"), createEventItem("warning")];

    expect(filterErrorEvents(eventItems).map((eventItem) => eventItem.result)).toEqual(["fail", "warning"]);
    expect(filterErrorEvents(eventItems, "fail").map((eventItem) => eventItem.result)).toEqual(["fail"]);
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
