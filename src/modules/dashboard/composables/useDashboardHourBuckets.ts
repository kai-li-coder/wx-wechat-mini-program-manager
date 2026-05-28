// 埋点总览小时桶补齐工具。
import dayjs from "dayjs";

import type {
  TraceDashboardCandidateTrend,
  TraceDashboardCandidateTrendRow,
  TraceDashboardQuery,
  TraceDashboardResponse,
  TraceDashboardTrend,
  TraceDashboardTrendRow,
} from "@/api/trace";
import { formatTraceDateTime } from "@/utils/date";

/** 单日小时坐标轴。 */
const dashboardDayHours = Array.from({ length: 24 }, (_, hour) => hour);

/** 格式化小时桶展示标签。 */
const formatDashboardHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** 标准化后端返回的小时桶键。 */
const normalizeDashboardHourBucket = (bucket: string) => {
  /** 后端返回时间桶。 */
  const bucketDateTime = dayjs(bucket);
  if (!bucketDateTime.isValid()) {
    return bucket;
  }

  return formatTraceDateTime(bucketDateTime.startOf("hour"));
};

/** 获取 24 小时补桶使用的日期。 */
const resolveDashboardHourBaseDate = (dashboardResponse: TraceDashboardResponse, query: TraceDashboardQuery) => {
  if (query.startTime) {
    /** 查询开始时间。 */
    const queryStartDateTime = dayjs(query.startTime);
    if (queryStartDateTime.isValid()) {
      return queryStartDateTime;
    }
  }

  /** 首个趋势时间桶。 */
  const firstTrendBucket = dashboardResponse.trend.rows[0]?.bucket ?? dashboardResponse.candidateTrend.rows[0]?.bucket;
  if (firstTrendBucket) {
    /** 首个趋势时间桶日期。 */
    const firstBucketDateTime = dayjs(firstTrendBucket);
    if (firstBucketDateTime.isValid()) {
      return firstBucketDateTime;
    }
  }

  return dayjs();
};

/** 补齐异常趋势 24 小时桶。 */
const createFullDayTrend = (trend: TraceDashboardTrend, baseDateTime: dayjs.Dayjs): TraceDashboardTrend => {
  if (trend.granularity !== "hour") {
    return trend;
  }

  /** 后端趋势行字典。 */
  const trendRowMap = new Map(trend.rows.map((trendRow) => [normalizeDashboardHourBucket(trendRow.bucket), trendRow]));
  /** 补齐后的趋势行。 */
  const fullDayTrendRows: TraceDashboardTrendRow[] = dashboardDayHours.map((hour) => {
    /** 小时桶时间。 */
    const hourDateTime = baseDateTime.startOf("day").hour(hour);
    /** 小时桶键。 */
    const bucket = formatTraceDateTime(hourDateTime);
    /** 后端返回的趋势行。 */
    const trendRow = trendRowMap.get(bucket);

    return {
      bucket,
      label: formatDashboardHourLabel(hour),
      successCount: trendRow?.successCount ?? 0,
      failCount: trendRow?.failCount ?? 0,
      warningCount: trendRow?.warningCount ?? 0,
    };
  });

  return {
    ...trend,
    rows: fullDayTrendRows,
  };
};

/** 补齐候选人趋势 24 小时桶。 */
const createFullDayCandidateTrend = (
  candidateTrend: TraceDashboardCandidateTrend,
  baseDateTime: dayjs.Dayjs,
): TraceDashboardCandidateTrend => {
  if (candidateTrend.granularity !== "hour") {
    return candidateTrend;
  }

  /** 后端候选人趋势行字典。 */
  const candidateTrendRowMap = new Map(
    candidateTrend.rows.map((candidateTrendRow) => [
      normalizeDashboardHourBucket(candidateTrendRow.bucket),
      candidateTrendRow,
    ]),
  );
  /** 补齐后的候选人趋势行。 */
  const fullDayCandidateTrendRows: TraceDashboardCandidateTrendRow[] = dashboardDayHours.map((hour) => {
    /** 小时桶时间。 */
    const hourDateTime = baseDateTime.startOf("day").hour(hour);
    /** 小时桶键。 */
    const bucket = formatTraceDateTime(hourDateTime);
    /** 后端返回的候选人趋势行。 */
    const candidateTrendRow = candidateTrendRowMap.get(bucket);

    return {
      bucket,
      label: formatDashboardHourLabel(hour),
      candidateCount: candidateTrendRow?.candidateCount ?? 0,
    };
  });

  return {
    ...candidateTrend,
    rows: fullDayCandidateTrendRows,
  };
};

/** 标准化总览接口小时桶数据。 */
export const normalizeDashboardHourBuckets = (
  dashboardResponse: TraceDashboardResponse,
  query: TraceDashboardQuery,
): TraceDashboardResponse => {
  /** 24 小时补桶基准日期。 */
  const baseDateTime = resolveDashboardHourBaseDate(dashboardResponse, query);

  return {
    ...dashboardResponse,
    trend: createFullDayTrend(dashboardResponse.trend, baseDateTime),
    candidateTrend: createFullDayCandidateTrend(dashboardResponse.candidateTrend, baseDateTime),
  };
};
