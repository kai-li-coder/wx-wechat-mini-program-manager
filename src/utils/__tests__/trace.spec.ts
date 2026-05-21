// 埋点数据工具单元测试。
import { describe, expect, it } from "vitest";

import type { TraceEventItem, TraceMetricItem } from "@/api/trace";
import {
  aggregateMetricSummary,
  filterErrorEvents,
  formatTraceStage,
  resolveTraceEventRowKey,
  resolveTraceEventServerTime,
  toEventRankItems,
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

  it("builds event code rank items", () => {
    expect(toEventRankItems(metricItems)[0]).toMatchObject({
      eventCode: "upload_fail",
      eventCount: 5,
    });
  });

  it("formats trace stage labels", () => {
    expect(formatTraceStage("oss_upload_fail")).toBe("OSS 上传失败");
    expect(formatTraceStage("custom_stage")).toBe("custom_stage");
    expect(formatTraceStage("")).toBe("-");
  });

  it("filters only error events", () => {
    const eventItems = [createEventItem("success"), createEventItem("fail"), createEventItem("warning")];

    expect(filterErrorEvents(eventItems).map((eventItem) => eventItem.result)).toEqual(["fail", "warning"]);
    expect(filterErrorEvents(eventItems, "fail").map((eventItem) => eventItem.result)).toEqual(["fail"]);
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
