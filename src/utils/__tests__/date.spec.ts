// 日期工具单元测试。
import { describe, expect, it, vi } from "vitest";

import { createRecent24HourRange, formatDisplayDateTime, formatTraceDateTime } from "@/utils/date";

describe("date utils", () => {
  it("formats backend trace datetime", () => {
    expect(formatTraceDateTime("2026-05-20T10:15:30+08:00")).toBe("2026-05-20 10:15:30");
  });

  it("formats display datetime", () => {
    expect(formatDisplayDateTime("2026-05-20T10:15:30+08:00")).toBe("2026/05/20 10:15:30");
    expect(formatDisplayDateTime("")).toBe("-");
  });

  it("creates recent 24 hour range by hour", () => {
    vi.setSystemTime(new Date("2026-05-20T10:15:30+08:00"));

    expect(createRecent24HourRange()).toEqual({
      startTime: "2026-05-19 10:00:00",
      endTime: "2026-05-20 10:00:00",
    });

    vi.useRealTimers();
  });
});
