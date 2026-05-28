// 埋点总览小时桶补齐工具单元测试。
import { describe, expect, it } from "vitest";

import type { TraceDashboardResponse } from "@/api/trace";
import { normalizeDashboardHourBuckets } from "@/modules/dashboard/composables/useDashboardHourBuckets";

/** 创建总览响应测试数据。 */
const createDashboardResponse = (): TraceDashboardResponse => ({
  summary: {
    eventCount: 3,
    flowCount: 2,
    candidateCount: 2,
  },
  trend: {
    granularity: "hour",
    rows: [
      {
        bucket: "2026-05-28 08:00:00",
        label: "08:00",
        successCount: 1,
        failCount: 2,
        warningCount: 0,
      },
    ],
  },
  candidateTrend: {
    granularity: "hour",
    rows: [
      {
        bucket: "2026-05-28 08:00:00",
        label: "08:00",
        candidateCount: 2,
      },
    ],
  },
  topErrorEventCodes: [],
  errorWarning: {
    level: "normal",
    warningDate: null,
    eventCount: 0,
    failCount: 0,
    failRate: 0,
    candidateCount: 0,
    affectedCandidateCount: 0,
    affectedCandidateRate: 0,
    triggerReasons: ["未达到观察预警阈值"],
    thresholds: {
      watchFailRate: 0.03,
      watchFailCount: 5,
      warningFailRate: 0.05,
      warningFailCount: 10,
      criticalFailRate: 0.1,
      criticalFailCount: 10,
      criticalCandidateRate: 0.05,
      criticalCandidateCount: 3,
    },
  },
});

describe("useDashboardHourBuckets", () => {
  it("fills hour granularity trend rows to 24 buckets", () => {
    /** 补齐后的总览数据。 */
    const dashboardResponse = normalizeDashboardHourBuckets(createDashboardResponse(), {
      startTime: "2026-05-28 00:00:00",
      endTime: "2026-05-28 23:59:59",
    });

    expect(dashboardResponse.trend.rows).toHaveLength(24);
    expect(dashboardResponse.trend.rows[0]).toMatchObject({
      bucket: "2026-05-28 00:00:00",
      label: "00:00",
      successCount: 0,
      failCount: 0,
      warningCount: 0,
    });
    expect(dashboardResponse.trend.rows[8]).toMatchObject({
      bucket: "2026-05-28 08:00:00",
      label: "08:00",
      successCount: 1,
      failCount: 2,
    });
    expect(dashboardResponse.candidateTrend.rows).toHaveLength(24);
    expect(dashboardResponse.candidateTrend.rows[8]).toMatchObject({
      bucket: "2026-05-28 08:00:00",
      label: "08:00",
      candidateCount: 2,
    });
  });

  it("keeps non-hour granularity rows unchanged", () => {
    /** 原始总览响应。 */
    const rawDashboardResponse = createDashboardResponse();
    rawDashboardResponse.trend.granularity = "day";
    rawDashboardResponse.candidateTrend.granularity = "day";

    /** 标准化后的总览数据。 */
    const dashboardResponse = normalizeDashboardHourBuckets(rawDashboardResponse, {});

    expect(dashboardResponse.trend.rows).toHaveLength(1);
    expect(dashboardResponse.candidateTrend.rows).toHaveLength(1);
  });
});
