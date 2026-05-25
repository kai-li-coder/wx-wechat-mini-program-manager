// 埋点接口参数单元测试。
import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpGet } from "@/api/request";
import { queryTraceFlow } from "@/api/trace";

vi.mock("@/api/request", () => ({
  httpGet: vi.fn(),
}));

describe("trace api", () => {
  beforeEach(() => {
    vi.mocked(httpGet).mockReset();
  });

  it("omits empty flow filters when querying all events", async () => {
    vi.mocked(httpGet).mockResolvedValue({ records: [], total: 0 });

    await queryTraceFlow({
      flowId: "",
      interviewCandidateId: "",
      eventCode: "",
      stage: "",
      result: "",
      durationMs: undefined,
      brand: "",
      model: "",
      startTime: "",
      endTime: "",
      pageRoute: "",
      pageNum: 1,
      pageSize: 50,
    });

    expect(httpGet).toHaveBeenCalledWith("/admin/candidate/trace/flow", {
      params: {
        pageNum: 1,
        pageSize: 50,
      },
    });
  });

  it("keeps non-empty flow filters", async () => {
    vi.mocked(httpGet).mockResolvedValue({ records: [], total: 0 });

    await queryTraceFlow({
      flowId: " flow_1 ",
      interviewCandidateId: " 9001 ",
      eventCode: " upload_fail ",
      stage: " upload ",
      result: " fail ",
      durationMs: 120,
      brand: " Apple ",
      model: " iPhone 15 Pro ",
      startTime: " 2026-05-20 10:00:00 ",
      endTime: " 2026-05-20 11:00:00 ",
      pageRoute: " /pages/interview/interviewPage ",
      pageNum: 2,
      pageSize: 20,
    });

    expect(httpGet).toHaveBeenCalledWith("/admin/candidate/trace/flow", {
      params: {
        flowId: "flow_1",
        interviewCandidateId: "9001",
        eventCode: "upload_fail",
        stage: "upload",
        result: "fail",
        durationMs: 120,
        brand: "Apple",
        model: "iPhone 15 Pro",
        startTime: "2026-05-20 10:00:00",
        endTime: "2026-05-20 11:00:00",
        pageRoute: "/pages/interview/interviewPage",
        pageNum: 2,
        pageSize: 20,
      },
    });
  });

  it("omits invalid duration filters", async () => {
    vi.mocked(httpGet).mockResolvedValue({ records: [], total: 0 });

    await queryTraceFlow({
      durationMs: -1,
      pageNum: 1,
      pageSize: 50,
    });

    expect(httpGet).toHaveBeenCalledWith("/admin/candidate/trace/flow", {
      params: {
        pageNum: 1,
        pageSize: 50,
      },
    });
  });
});
