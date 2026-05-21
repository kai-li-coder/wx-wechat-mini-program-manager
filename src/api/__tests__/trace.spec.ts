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
      interviewCandidateId: "9001",
      pageNum: 2,
      pageSize: 20,
    });

    expect(httpGet).toHaveBeenCalledWith("/admin/candidate/trace/flow", {
      params: {
        flowId: "flow_1",
        interviewCandidateId: "9001",
        pageNum: 2,
        pageSize: 20,
      },
    });
  });
});
